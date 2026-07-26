using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using QuoteDepot.Domain.Authorization;
using QuoteDepot.Domain.Entities;
using QuoteDepot.Domain.Exceptions;
using QuoteDepot.Infrastructure.Data;

namespace QuoteDepot.Api.Services;

public static class AuditActions
{
    public const string OrganizationCreated = "organization.created";
    public const string OrganizationUpdated = "organization.updated";
    public const string OrganizationLogoUploaded = "organization.logo_uploaded";
    public const string MembershipInvited = "membership.invited";
    public const string MembershipInviteAccepted = "membership.invite_accepted";
    public const string MembershipInviteRevoked = "membership.invite_revoked";
    public const string MembershipRoleChanged = "membership.role_changed";
    public const string MembershipRevoked = "membership.revoked";
    public const string JoinRequestCreated = "join_request.created";
    public const string JoinRequestApproved = "join_request.approved";
    public const string JoinRequestRejected = "join_request.rejected";
    public const string RequestCreated = "request.created";
    public const string RequestUpdated = "request.updated";
    public const string RequestStatusChanged = "request.status_changed";
    public const string RequestSlugRegenerated = "request.slug_regenerated";
    public const string QuoteSubmitted = "quote.submitted";
    public const string QuoteStatusChanged = "quote.status_changed";
    public const string QuoteAccepted = "quote.accepted";
}

public interface IAuditService
{
    /// <summary>Stages an append-only audit row; caller must SaveChanges.</summary>
    void Record(
        Guid organizationId,
        Guid? actorUserId,
        string action,
        string entityType,
        Guid? entityId,
        object? metadata = null);

    Task<IReadOnlyList<AuditEvent>> ListForOrgAsync(
        Guid organizationId,
        User actor,
        int take = 100,
        CancellationToken cancellationToken = default);
}

public class AuditService : IAuditService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly AppDbContext _db;
    private readonly ICurrentUserAccessor _users;

    public AuditService(AppDbContext db, ICurrentUserAccessor users)
    {
        _db = db;
        _users = users;
    }

    public void Record(
        Guid organizationId,
        Guid? actorUserId,
        string action,
        string entityType,
        Guid? entityId,
        object? metadata = null)
    {
        _db.AuditEvents.Add(new AuditEvent
        {
            OrganizationId = organizationId,
            ActorUserId = actorUserId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OccurredAt = DateTimeOffset.UtcNow,
            MetadataJson = metadata is null ? null : JsonSerializer.Serialize(metadata, JsonOptions),
        });
    }

    public async Task<IReadOnlyList<AuditEvent>> ListForOrgAsync(
        Guid organizationId,
        User actor,
        int take = 100,
        CancellationToken cancellationToken = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(organizationId, actor.Id, cancellationToken);
        OrgPermissions.Ensure(OrgPermissions.CanViewAudit(membership.Role), "Only Owner or Admin can view audit events.");

        if (take < 1)
        {
            take = 1;
        }

        if (take > 500)
        {
            take = 500;
        }

        // SQLite cannot ORDER BY DateTimeOffset in SQL; sort newest-first in memory.
        var events = await _db.AuditEvents
            .AsNoTracking()
            .Include(e => e.Actor)
            .Where(e => e.OrganizationId == organizationId)
            .ToListAsync(cancellationToken);

        return events
            .OrderByDescending(e => e.OccurredAt)
            .Take(take)
            .ToList();
    }
}
