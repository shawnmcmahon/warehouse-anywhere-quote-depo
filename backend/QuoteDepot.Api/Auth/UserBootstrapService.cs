using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using QuoteDepot.Domain.Entities;
using QuoteDepot.Domain.Enums;
using QuoteDepot.Infrastructure.Data;

namespace QuoteDepot.Api.Auth;

public class UserBootstrapService : IUserBootstrapService
{
    private readonly AppDbContext _db;

    public UserBootstrapService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<BootstrapResult> BootstrapAsync(
        ClaimsPrincipal principal,
        CancellationToken cancellationToken = default)
    {
        var sub = principal.FindFirstValue("sub")
            ?? principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Authenticated token is missing a subject claim.");

        var email = principal.FindFirstValue("email")
            ?? principal.FindFirstValue(ClaimTypes.Email)
            ?? throw new InvalidOperationException("Authenticated token is missing an email claim.");

        var name = principal.FindFirstValue("name")
            ?? principal.FindFirstValue("cognito:username")
            ?? principal.FindFirstValue(ClaimTypes.Name);

        var user = await _db.Users
            .SingleOrDefaultAsync(u => u.CognitoSub == sub, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                CognitoSub = sub,
                Email = email,
                Name = name,
            };
            _db.Users.Add(user);
        }
        else
        {
            var changed = false;
            if (!string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase))
            {
                user.Email = email;
                changed = true;
            }

            if (!string.IsNullOrWhiteSpace(name) && !string.Equals(user.Name, name, StringComparison.Ordinal))
            {
                user.Name = name;
                changed = true;
            }

            if (changed)
            {
                user.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);

        var memberships = await _db.OrganizationMemberships
            .AsNoTracking()
            .Where(m => m.UserId == user.Id && m.Status == MembershipStatus.Active)
            .Select(m => new MembershipSummary(
                m.OrganizationId,
                m.Organization!.Name,
                m.Role.ToString(),
                m.Status.ToString()))
            .ToListAsync(cancellationToken);

        var pendingInvites = await _db.Invites
            .AsNoTracking()
            .Where(i => i.Email == user.Email && i.Status == InviteStatus.Pending)
            .Select(i => new PendingInviteSummary(
                i.Id,
                i.OrganizationId,
                i.Organization!.Name,
                i.Role.ToString(),
                i.Email))
            .ToListAsync(cancellationToken);

        var joinRequests = await _db.JoinRequests
            .AsNoTracking()
            .Where(j => j.UserId == user.Id)
            .Select(j => new JoinRequestSummary(
                j.Id,
                j.OrganizationId,
                j.Organization!.Name,
                j.Status.ToString()))
            .ToListAsync(cancellationToken);

        return new BootstrapResult(user, memberships, pendingInvites, joinRequests);
    }
}
