using Microsoft.EntityFrameworkCore;
using QuoteDepot.Domain.Authorization;
using QuoteDepot.Domain.Entities;
using QuoteDepot.Domain.Enums;
using QuoteDepot.Domain.Exceptions;
using QuoteDepot.Infrastructure.Data;

namespace QuoteDepot.Api.Services;

public interface IOrganizationService
{
    Task<Organization> CreateAsync(User owner, string name, string? description, CancellationToken ct = default);
    Task<IReadOnlyList<Organization>> ListBrowseAsync(CancellationToken ct = default);
    Task<Organization> GetAsync(Guid orgId, CancellationToken ct = default);
    Task<Organization> UpdateAsync(Guid orgId, User actor, string name, string? description, CancellationToken ct = default);
    Task<IReadOnlyList<OrganizationMembership>> ListMembersAsync(Guid orgId, User actor, CancellationToken ct = default);
    Task<Invite> InviteAsync(Guid orgId, User actor, string email, OrgRole role, CancellationToken ct = default);
    Task<IReadOnlyList<Invite>> ListInvitesAsync(Guid orgId, User actor, CancellationToken ct = default);
    Task RevokeInviteAsync(Guid orgId, User actor, Guid inviteId, CancellationToken ct = default);
    Task<OrganizationMembership> AcceptInviteAsync(User user, string token, CancellationToken ct = default);
    Task ChangeRoleAsync(Guid orgId, User actor, Guid membershipId, OrgRole newRole, CancellationToken ct = default);
    Task RevokeMembershipAsync(Guid orgId, User actor, Guid membershipId, CancellationToken ct = default);
    Task<JoinRequest> RequestJoinAsync(Guid orgId, User user, string? message, CancellationToken ct = default);
    Task<IReadOnlyList<JoinRequest>> ListJoinRequestsAsync(Guid orgId, User actor, CancellationToken ct = default);
    Task ApproveJoinRequestAsync(Guid orgId, User actor, Guid joinRequestId, CancellationToken ct = default);
    Task RejectJoinRequestAsync(Guid orgId, User actor, Guid joinRequestId, CancellationToken ct = default);
}

public class OrganizationService : IOrganizationService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserAccessor _users;
    private readonly IAuditService _audit;

    public OrganizationService(AppDbContext db, ICurrentUserAccessor users, IAuditService audit)
    {
        _db = db;
        _users = users;
        _audit = audit;
    }

    public async Task<Organization> CreateAsync(
        User owner,
        string name,
        string? description,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Organization name is required.");
        }

        var org = new Organization
        {
            Name = name.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            OwnerUserId = owner.Id,
        };

        var membership = new OrganizationMembership
        {
            OrganizationId = org.Id,
            UserId = owner.Id,
            Role = OrgRole.Owner,
            Status = MembershipStatus.Active,
        };

        _db.Organizations.Add(org);
        _db.OrganizationMemberships.Add(membership);
        _audit.Record(
            org.Id,
            owner.Id,
            AuditActions.OrganizationCreated,
            nameof(Organization),
            org.Id,
            new { org.Name });
        await _db.SaveChangesAsync(ct);
        return org;
    }

    public async Task<IReadOnlyList<Organization>> ListBrowseAsync(CancellationToken ct = default)
    {
        return await _db.Organizations
            .AsNoTracking()
            .OrderBy(o => o.Name)
            .ToListAsync(ct);
    }

    public async Task<Organization> GetAsync(Guid orgId, CancellationToken ct = default)
    {
        var org = await _db.Organizations.AsNoTracking().SingleOrDefaultAsync(o => o.Id == orgId, ct);
        if (org is null)
        {
            throw new DomainException("Organization not found.");
        }

        return org;
    }

    public async Task<Organization> UpdateAsync(
        Guid orgId,
        User actor,
        string name,
        string? description,
        CancellationToken ct = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanUpdateOrgSettings(membership.Role), "Only the Owner can update organization settings.");

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Organization name is required.");
        }

        var org = await _db.Organizations.SingleAsync(o => o.Id == orgId, ct);
        org.Name = name.Trim();
        org.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        org.UpdatedAt = DateTimeOffset.UtcNow;
        _audit.Record(
            orgId,
            actor.Id,
            AuditActions.OrganizationUpdated,
            nameof(Organization),
            orgId,
            new { org.Name });
        await _db.SaveChangesAsync(ct);
        return org;
    }

    public async Task<IReadOnlyList<OrganizationMembership>> ListMembersAsync(
        Guid orgId,
        User actor,
        CancellationToken ct = default)
    {
        await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        return await _db.OrganizationMemberships
            .AsNoTracking()
            .Include(m => m.User)
            .Where(m => m.OrganizationId == orgId && m.Status == MembershipStatus.Active)
            .OrderBy(m => m.Role)
            .ThenBy(m => m.User!.Email)
            .ToListAsync(ct);
    }

    public async Task<Invite> InviteAsync(
        Guid orgId,
        User actor,
        string email,
        OrgRole role,
        CancellationToken ct = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanInvite(membership.Role), "You cannot invite members.");
        OrgPermissions.Ensure(OrgPermissions.CanAssignRole(membership.Role, role), $"You cannot invite someone as {role}.");

        email = email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            throw new DomainException("A valid email is required.");
        }

        var existingMember = await _db.OrganizationMemberships
            .Include(m => m.User)
            .AnyAsync(
                m => m.OrganizationId == orgId
                     && m.Status == MembershipStatus.Active
                     && m.User!.Email.ToLower() == email,
                ct);
        if (existingMember)
        {
            throw new DomainException("That user is already an active member.");
        }

        var now = DateTimeOffset.UtcNow;
        var pendingInvites = await _db.Invites
            .Where(i => i.OrganizationId == orgId && i.Email == email && i.Status == InviteStatus.Pending)
            .ToListAsync(ct);
        var stillPending = false;
        foreach (var existingInvite in pendingInvites)
        {
            if (existingInvite.ExpiresAt is { } expires && expires < now)
            {
                existingInvite.Status = InviteStatus.Expired;
            }
            else
            {
                stillPending = true;
            }
        }

        if (stillPending)
        {
            throw new DomainException("An invite is already pending for that email.");
        }

        var invite = new Invite
        {
            OrganizationId = orgId,
            Email = email,
            Role = role,
            Status = InviteStatus.Pending,
            InvitedByUserId = actor.Id,
            ExpiresAt = now.AddDays(14),
        };
        _db.Invites.Add(invite);
        _audit.Record(
            orgId,
            actor.Id,
            AuditActions.MembershipInvited,
            nameof(Invite),
            invite.Id,
            new { invite.Email, Role = invite.Role.ToString() });
        await _db.SaveChangesAsync(ct);
        return invite;
    }

    public async Task<IReadOnlyList<Invite>> ListInvitesAsync(
        Guid orgId,
        User actor,
        CancellationToken ct = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanInvite(membership.Role), "You cannot view invites.");

        return await _db.Invites
            .AsNoTracking()
            .Where(i => i.OrganizationId == orgId && i.Status == InviteStatus.Pending)
            .OrderBy(i => i.Email)
            .ToListAsync(ct);
    }

    public async Task RevokeInviteAsync(
        Guid orgId,
        User actor,
        Guid inviteId,
        CancellationToken ct = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanInvite(membership.Role), "You cannot revoke invites.");

        var invite = await _db.Invites.SingleOrDefaultAsync(
            i => i.Id == inviteId && i.OrganizationId == orgId,
            ct);
        if (invite is null)
        {
            throw new DomainException("Invite not found.");
        }

        if (invite.Status != InviteStatus.Pending)
        {
            throw new DomainException("Invite is not pending.");
        }

        invite.Status = InviteStatus.Revoked;
        _audit.Record(
            orgId,
            actor.Id,
            AuditActions.MembershipInviteRevoked,
            nameof(Invite),
            invite.Id,
            new { invite.Email });
        await _db.SaveChangesAsync(ct);
    }

    public async Task<OrganizationMembership> AcceptInviteAsync(
        User user,
        string token,
        CancellationToken ct = default)
    {
        var invite = await _db.Invites.SingleOrDefaultAsync(i => i.Token == token, ct);
        if (invite is null)
        {
            throw new DomainException("Invite not found.");
        }

        if (invite.Status != InviteStatus.Pending)
        {
            throw new DomainException("Invite is no longer pending.");
        }

        if (invite.ExpiresAt is { } expires && expires < DateTimeOffset.UtcNow)
        {
            invite.Status = InviteStatus.Expired;
            await _db.SaveChangesAsync(ct);
            throw new DomainException("Invite has expired.");
        }

        if (!string.Equals(invite.Email, user.Email.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            throw new DomainException("This invite was issued to a different email address.");
        }

        var existing = await _db.OrganizationMemberships.SingleOrDefaultAsync(
            m => m.OrganizationId == invite.OrganizationId && m.UserId == user.Id,
            ct);

        if (existing is null)
        {
            existing = new OrganizationMembership
            {
                OrganizationId = invite.OrganizationId,
                UserId = user.Id,
                Role = invite.Role,
                Status = MembershipStatus.Active,
            };
            _db.OrganizationMemberships.Add(existing);
        }
        else if (existing.Status == MembershipStatus.Revoked)
        {
            existing.Status = MembershipStatus.Active;
            existing.Role = invite.Role;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            throw new DomainException("You are already a member of this organization.");
        }

        invite.Status = InviteStatus.Accepted;
        invite.AcceptedAt = DateTimeOffset.UtcNow;
        _audit.Record(
            invite.OrganizationId,
            user.Id,
            AuditActions.MembershipInviteAccepted,
            nameof(OrganizationMembership),
            existing.Id,
            new { invite.Email, Role = invite.Role.ToString() });
        await _db.SaveChangesAsync(ct);
        return existing;
    }

    public async Task ChangeRoleAsync(
        Guid orgId,
        User actor,
        Guid membershipId,
        OrgRole newRole,
        CancellationToken ct = default)
    {
        var actorMembership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanChangeRoles(actorMembership.Role), "Only the Owner can change roles.");
        OrgPermissions.Ensure(OrgPermissions.CanAssignRole(actorMembership.Role, newRole), $"Cannot assign role {newRole}.");

        var target = await _db.OrganizationMemberships.SingleOrDefaultAsync(
            m => m.Id == membershipId && m.OrganizationId == orgId,
            ct);
        if (target is null || target.Status != MembershipStatus.Active)
        {
            throw new DomainException("Membership not found.");
        }

        if (target.Role == OrgRole.Owner)
        {
            throw new DomainException("Cannot change the Owner's role.");
        }

        var previousRole = target.Role;
        target.Role = newRole;
        target.UpdatedAt = DateTimeOffset.UtcNow;
        _audit.Record(
            orgId,
            actor.Id,
            AuditActions.MembershipRoleChanged,
            nameof(OrganizationMembership),
            target.Id,
            new { From = previousRole.ToString(), To = newRole.ToString(), target.UserId });
        await _db.SaveChangesAsync(ct);
    }

    public async Task RevokeMembershipAsync(
        Guid orgId,
        User actor,
        Guid membershipId,
        CancellationToken ct = default)
    {
        var actorMembership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanManageMembership(actorMembership.Role), "You cannot revoke memberships.");

        var target = await _db.OrganizationMemberships.SingleOrDefaultAsync(
            m => m.Id == membershipId && m.OrganizationId == orgId,
            ct);
        if (target is null || target.Status != MembershipStatus.Active)
        {
            throw new DomainException("Membership not found.");
        }

        if (target.Role == OrgRole.Owner)
        {
            throw new DomainException("Cannot revoke the Owner.");
        }

        if (actorMembership.Role == OrgRole.Admin && target.Role == OrgRole.Admin)
        {
            throw new DomainException("Admins cannot revoke other Admins.");
        }

        target.Status = MembershipStatus.Revoked;
        target.UpdatedAt = DateTimeOffset.UtcNow;
        _audit.Record(
            orgId,
            actor.Id,
            AuditActions.MembershipRevoked,
            nameof(OrganizationMembership),
            target.Id,
            new { target.UserId, Role = target.Role.ToString() });
        await _db.SaveChangesAsync(ct);
    }

    public async Task<JoinRequest> RequestJoinAsync(
        Guid orgId,
        User user,
        string? message,
        CancellationToken ct = default)
    {
        var org = await _db.Organizations.AnyAsync(o => o.Id == orgId, ct);
        if (!org)
        {
            throw new DomainException("Organization not found.");
        }

        var alreadyMember = await _db.OrganizationMemberships.AnyAsync(
            m => m.OrganizationId == orgId && m.UserId == user.Id && m.Status == MembershipStatus.Active,
            ct);
        if (alreadyMember)
        {
            throw new DomainException("You are already a member of this organization.");
        }

        var pending = await _db.JoinRequests.AnyAsync(
            j => j.OrganizationId == orgId && j.UserId == user.Id && j.Status == JoinRequestStatus.Pending,
            ct);
        if (pending)
        {
            throw new DomainException("You already have a pending join request.");
        }

        var joinRequest = new JoinRequest
        {
            OrganizationId = orgId,
            UserId = user.Id,
            Status = JoinRequestStatus.Pending,
            Message = string.IsNullOrWhiteSpace(message) ? null : message.Trim(),
        };
        _db.JoinRequests.Add(joinRequest);
        _audit.Record(
            orgId,
            user.Id,
            AuditActions.JoinRequestCreated,
            nameof(JoinRequest),
            joinRequest.Id,
            null);
        await _db.SaveChangesAsync(ct);
        return joinRequest;
    }

    public async Task<IReadOnlyList<JoinRequest>> ListJoinRequestsAsync(
        Guid orgId,
        User actor,
        CancellationToken ct = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanApproveJoinRequests(membership.Role), "You cannot view join requests.");

        return await _db.JoinRequests
            .AsNoTracking()
            .Include(j => j.User)
            .Where(j => j.OrganizationId == orgId && j.Status == JoinRequestStatus.Pending)
            .OrderBy(j => j.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task ApproveJoinRequestAsync(
        Guid orgId,
        User actor,
        Guid joinRequestId,
        CancellationToken ct = default)
    {
        var actorMembership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanApproveJoinRequests(actorMembership.Role), "You cannot approve join requests.");

        var joinRequest = await _db.JoinRequests.SingleOrDefaultAsync(
            j => j.Id == joinRequestId && j.OrganizationId == orgId,
            ct);
        if (joinRequest is null)
        {
            throw new DomainException("Join request not found.");
        }

        if (joinRequest.Status != JoinRequestStatus.Pending)
        {
            throw new DomainException("Join request is not pending.");
        }

        joinRequest.Status = JoinRequestStatus.Approved;
        joinRequest.ResolvedAt = DateTimeOffset.UtcNow;
        joinRequest.ResolvedByUserId = actor.Id;

        var membership = await _db.OrganizationMemberships.SingleOrDefaultAsync(
            m => m.OrganizationId == orgId && m.UserId == joinRequest.UserId,
            ct);
        if (membership is null)
        {
            _db.OrganizationMemberships.Add(new OrganizationMembership
            {
                OrganizationId = orgId,
                UserId = joinRequest.UserId,
                Role = OrgRole.Member,
                Status = MembershipStatus.Active,
            });
        }
        else if (membership.Status == MembershipStatus.Revoked)
        {
            // Re-admit revoked users as Member; do not invent a higher role.
            membership.Status = MembershipStatus.Active;
            membership.Role = OrgRole.Member;
            membership.UpdatedAt = DateTimeOffset.UtcNow;
        }
        // Already active (e.g. accepted an Admin invite first): preserve current role.

        _audit.Record(
            orgId,
            actor.Id,
            AuditActions.JoinRequestApproved,
            nameof(JoinRequest),
            joinRequest.Id,
            new { joinRequest.UserId });
        await _db.SaveChangesAsync(ct);
    }

    public async Task RejectJoinRequestAsync(
        Guid orgId,
        User actor,
        Guid joinRequestId,
        CancellationToken ct = default)
    {
        var actorMembership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, ct);
        OrgPermissions.Ensure(OrgPermissions.CanApproveJoinRequests(actorMembership.Role), "You cannot reject join requests.");

        var joinRequest = await _db.JoinRequests.SingleOrDefaultAsync(
            j => j.Id == joinRequestId && j.OrganizationId == orgId,
            ct);
        if (joinRequest is null)
        {
            throw new DomainException("Join request not found.");
        }

        if (joinRequest.Status != JoinRequestStatus.Pending)
        {
            throw new DomainException("Join request is not pending.");
        }

        joinRequest.Status = JoinRequestStatus.Rejected;
        joinRequest.ResolvedAt = DateTimeOffset.UtcNow;
        joinRequest.ResolvedByUserId = actor.Id;
        _audit.Record(
            orgId,
            actor.Id,
            AuditActions.JoinRequestRejected,
            nameof(JoinRequest),
            joinRequest.Id,
            new { joinRequest.UserId });
        await _db.SaveChangesAsync(ct);
    }
}
