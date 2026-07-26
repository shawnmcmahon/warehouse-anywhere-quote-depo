using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using QuoteDepot.Domain.Authorization;
using QuoteDepot.Domain.Entities;
using QuoteDepot.Domain.Enums;
using QuoteDepot.Domain.Exceptions;
using QuoteDepot.Domain.Services;
using QuoteDepot.Domain.StateMachines;
using QuoteDepot.Infrastructure.Data;

namespace QuoteDepot.Api.Services;

public interface IRequestQuoteService
{
    Task<Request> CreateRequestAsync(Guid orgId, User actor, string title, string? description, CancellationToken ct = default);
    Task<IReadOnlyList<Request>> ListRequestsAsync(Guid orgId, User actor, CancellationToken ct = default);
    Task<Request> GetRequestAsync(Guid orgId, Guid requestId, User actor, CancellationToken ct = default);
    Task<Request> UpdateRequestAsync(Guid orgId, Guid requestId, User actor, string title, string? description, CancellationToken ct = default);
    Task<Request> TransitionRequestAsync(Guid orgId, Guid requestId, User actor, RequestStatus to, CancellationToken ct = default);
    Task<Request> RegenerateSlugAsync(Guid orgId, Guid requestId, User actor, CancellationToken ct = default);
    Task<Request?> GetPublicRequestAsync(string slug, CancellationToken ct = default);
    Task<Quote> SubmitPublicQuoteAsync(string slug, SubmitQuoteInput input, Guid? submittedByUserId, CancellationToken ct = default);
    Task<IReadOnlyList<Quote>> ListQuotesAsync(Guid orgId, Guid requestId, User actor, CancellationToken ct = default);
    Task<Quote> TransitionQuoteAsync(Guid orgId, Guid requestId, Guid quoteId, User actor, QuoteStatus to, CancellationToken ct = default);
    Task AcceptQuoteAsync(Guid orgId, Guid requestId, Guid quoteId, User actor, CancellationToken ct = default);
}

public record SubmitQuoteInput(
    string BusinessName,
    decimal Amount,
    QuoteUnit Unit,
    DateTimeOffset? StartAt,
    DateTimeOffset? EndAt,
    string ContactName,
    string? ContactPhone,
    string ContactEmail,
    string? Notes,
    QuoteStatus InitialStatus);

public class RequestQuoteService : IRequestQuoteService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserAccessor _users;

    public RequestQuoteService(AppDbContext db, ICurrentUserAccessor users)
    {
        _db = db;
        _users = users;
    }

    public async Task<Request> CreateRequestAsync(
        Guid orgId,
        User actor,
        string title,
        string? description,
        CancellationToken ct = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanManageRequests(membership.Role), "You cannot create requests.");

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainException("Request title is required.");
        }

        var request = new Request
        {
            OrganizationId = orgId,
            CreatedByUserId = actor.Id,
            Title = title.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            PublicSlug = await GenerateUniqueSlugAsync(ct),
            Status = RequestStatus.Open,
        };
        _db.Requests.Add(request);
        await _db.SaveChangesAsync(ct);
        return request;
    }

    public async Task<IReadOnlyList<Request>> ListRequestsAsync(Guid orgId, User actor, CancellationToken ct = default)
    {
        await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        var items = await _db.Requests
            .AsNoTracking()
            .Where(r => r.OrganizationId == orgId)
            .ToListAsync(ct);
        return items.OrderByDescending(r => r.CreatedAt).ToList();
    }

    public async Task<Request> GetRequestAsync(Guid orgId, Guid requestId, User actor, CancellationToken ct = default)
    {
        await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        return await LoadOrgRequestAsync(orgId, requestId, ct);
    }

    public async Task<Request> UpdateRequestAsync(
        Guid orgId,
        Guid requestId,
        User actor,
        string title,
        string? description,
        CancellationToken ct = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanManageRequests(membership.Role), "You cannot update requests.");

        var request = await LoadOrgRequestAsync(orgId, requestId, ct, tracking: true);
        if (request.Status != RequestStatus.Open)
        {
            throw new DomainException("Only open requests can be edited.");
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainException("Request title is required.");
        }

        request.Title = title.Trim();
        request.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        request.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return request;
    }

    public async Task<Request> TransitionRequestAsync(
        Guid orgId,
        Guid requestId,
        User actor,
        RequestStatus to,
        CancellationToken ct = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanManageRequests(membership.Role), "You cannot change request status.");

        var request = await LoadOrgRequestAsync(orgId, requestId, ct, tracking: true);
        RequestLifecycle.EnsureCanTransition(request.Status, to);
        request.Status = to;
        request.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return request;
    }

    public async Task<Request> RegenerateSlugAsync(
        Guid orgId,
        Guid requestId,
        User actor,
        CancellationToken ct = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanManageRequests(membership.Role), "You cannot regenerate public links.");

        var request = await LoadOrgRequestAsync(orgId, requestId, ct, tracking: true);
        request.PublicSlug = await GenerateUniqueSlugAsync(ct);
        request.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return request;
    }

    public async Task<Request?> GetPublicRequestAsync(string slug, CancellationToken ct = default)
    {
        return await _db.Requests
            .AsNoTracking()
            .SingleOrDefaultAsync(r => r.PublicSlug == slug, ct);
    }

    public async Task<Quote> SubmitPublicQuoteAsync(
        string slug,
        SubmitQuoteInput input,
        Guid? submittedByUserId,
        CancellationToken ct = default)
    {
        var request = await _db.Requests.SingleOrDefaultAsync(r => r.PublicSlug == slug, ct);
        if (request is null)
        {
            throw new DomainException("Request not found.");
        }

        if (!RequestLifecycle.AcceptsQuotes(request.Status))
        {
            throw new DomainException("This request is not accepting quotes.");
        }

        ValidateQuoteInput(input);

        var status = input.InitialStatus;
        if (status is not (QuoteStatus.Draft or QuoteStatus.Submitted))
        {
            throw new DomainException("Public quotes must start as Draft or Submitted.");
        }

        var quote = new Quote
        {
            RequestId = request.Id,
            SubmittedByUserId = submittedByUserId,
            BusinessName = input.BusinessName.Trim(),
            Amount = input.Amount,
            Unit = input.Unit,
            StartAt = input.StartAt,
            EndAt = input.EndAt,
            ContactName = input.ContactName.Trim(),
            ContactPhone = string.IsNullOrWhiteSpace(input.ContactPhone) ? null : input.ContactPhone.Trim(),
            ContactEmail = input.ContactEmail.Trim(),
            Notes = string.IsNullOrWhiteSpace(input.Notes) ? null : input.Notes.Trim(),
            Status = status,
        };
        _db.Quotes.Add(quote);
        await _db.SaveChangesAsync(ct);
        return quote;
    }

    public async Task<IReadOnlyList<Quote>> ListQuotesAsync(
        Guid orgId,
        Guid requestId,
        User actor,
        CancellationToken ct = default)
    {
        await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        await LoadOrgRequestAsync(orgId, requestId, ct);
        var items = await _db.Quotes
            .AsNoTracking()
            .Where(q => q.RequestId == requestId)
            .ToListAsync(ct);
        return items.OrderByDescending(q => q.CreatedAt).ToList();
    }

    public async Task<Quote> TransitionQuoteAsync(
        Guid orgId,
        Guid requestId,
        Guid quoteId,
        User actor,
        QuoteStatus to,
        CancellationToken ct = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(
            OrgPermissions.CanAcceptQuotes(membership.Role) || membership.Role == OrgRole.Member,
            "You cannot update quote status.");

        if (to == QuoteStatus.Accepted)
        {
            throw new DomainException("Use the accept endpoint to accept a quote.");
        }

        await LoadOrgRequestAsync(orgId, requestId, ct);
        var quote = await _db.Quotes.SingleOrDefaultAsync(q => q.Id == quoteId && q.RequestId == requestId, ct);
        if (quote is null)
        {
            throw new DomainException("Quote not found.");
        }

        QuoteLifecycle.EnsureCanTransition(quote.Status, to);
        quote.Status = to;
        quote.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return quote;
    }

    public async Task AcceptQuoteAsync(
        Guid orgId,
        Guid requestId,
        Guid quoteId,
        User actor,
        CancellationToken ct = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanAcceptQuotes(membership.Role), "Only Owner or Admin can accept quotes.");

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var request = await _db.Requests
            .Include(r => r.Quotes)
            .SingleOrDefaultAsync(r => r.Id == requestId && r.OrganizationId == orgId, ct);
        if (request is null)
        {
            throw new DomainException("Request not found.");
        }

        var quote = request.Quotes.SingleOrDefault(q => q.Id == quoteId);
        if (quote is null)
        {
            throw new DomainException("Quote not found.");
        }

        QuoteAcceptanceService.ApplyExclusiveAccept(request, quote);

        try
        {
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new DomainException("The request was updated by someone else. Refresh and try again.");
        }
    }

    private async Task<Request> LoadOrgRequestAsync(
        Guid orgId,
        Guid requestId,
        CancellationToken ct,
        bool tracking = false)
    {
        IQueryable<Request> query = tracking ? _db.Requests : _db.Requests.AsNoTracking();
        var request = await query.SingleOrDefaultAsync(r => r.Id == requestId && r.OrganizationId == orgId, ct);
        if (request is null)
        {
            throw new DomainException("Request not found.");
        }

        return request;
    }

    private async Task<string> GenerateUniqueSlugAsync(CancellationToken ct)
    {
        for (var i = 0; i < 8; i++)
        {
            var slug = Convert.ToHexString(RandomNumberGenerator.GetBytes(8)).ToLowerInvariant();
            var exists = await _db.Requests.AnyAsync(r => r.PublicSlug == slug, ct);
            if (!exists)
            {
                return slug;
            }
        }

        throw new DomainException("Could not generate a unique public link. Try again.");
    }

    private static void ValidateQuoteInput(SubmitQuoteInput input)
    {
        if (string.IsNullOrWhiteSpace(input.BusinessName))
        {
            throw new DomainException("Business name is required.");
        }

        if (input.Amount < 0)
        {
            throw new DomainException("Amount cannot be negative.");
        }

        if (string.IsNullOrWhiteSpace(input.ContactName))
        {
            throw new DomainException("Contact name is required.");
        }

        if (string.IsNullOrWhiteSpace(input.ContactEmail) || !input.ContactEmail.Contains('@'))
        {
            throw new DomainException("A valid contact email is required.");
        }

        if (input.StartAt is { } start && input.EndAt is { } end && end < start)
        {
            throw new DomainException("End date cannot be before start date.");
        }
    }
}
