using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using QuoteDepot.Domain.Entities;
using QuoteDepot.Domain.Enums;
using QuoteDepot.Domain.Exceptions;
using QuoteDepot.Infrastructure.Data;

namespace QuoteDepot.Api.Services;

public interface ICurrentUserAccessor
{
    Task<User> RequireUserAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default);

    Task<OrganizationMembership> RequireActiveMembershipAsync(
        Guid organizationId,
        Guid userId,
        CancellationToken cancellationToken = default);
}

public class CurrentUserAccessor : ICurrentUserAccessor
{
    private readonly AppDbContext _db;
    private readonly IUserBootstrapServiceBridge _bootstrap;

    public CurrentUserAccessor(AppDbContext db, IUserBootstrapServiceBridge bootstrap)
    {
        _db = db;
        _bootstrap = bootstrap;
    }

    public async Task<User> RequireUserAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default)
    {
        // Ensure local user exists (same path as bootstrap).
        var result = await _bootstrap.EnsureUserAsync(principal, cancellationToken);
        return result;
    }

    public async Task<OrganizationMembership> RequireActiveMembershipAsync(
        Guid organizationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var membership = await _db.OrganizationMemberships
            .Include(m => m.Organization)
            .SingleOrDefaultAsync(
                m => m.OrganizationId == organizationId
                     && m.UserId == userId
                     && m.Status == MembershipStatus.Active,
                cancellationToken);

        if (membership is null)
        {
            throw new DomainException("You are not an active member of this organization.");
        }

        return membership;
    }
}

/// <summary>
/// Thin bridge so Services don't take a hard dependency cycle on Auth DTOs.
/// </summary>
public interface IUserBootstrapServiceBridge
{
    Task<User> EnsureUserAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default);
}
