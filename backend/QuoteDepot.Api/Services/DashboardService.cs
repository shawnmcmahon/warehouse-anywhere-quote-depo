using Microsoft.EntityFrameworkCore;
using QuoteDepot.Domain.Entities;
using QuoteDepot.Domain.Enums;
using QuoteDepot.Infrastructure.Data;

namespace QuoteDepot.Api.Services;

public record DashboardOrgSummary(
    Guid OrganizationId,
    string Name,
    string? Description,
    string? LogoPath,
    string Role,
    int OpenRequestCount,
    int PendingQuoteCount,
    int PendingJoinRequestCount);

public interface IDashboardService
{
    Task<IReadOnlyList<DashboardOrgSummary>> GetAsync(User user, CancellationToken cancellationToken = default);
}

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<DashboardOrgSummary>> GetAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        var memberships = await _db.OrganizationMemberships
            .AsNoTracking()
            .Include(m => m.Organization)
            .Where(m => m.UserId == user.Id && m.Status == MembershipStatus.Active)
            .ToListAsync(cancellationToken);

        if (memberships.Count == 0)
        {
            return Array.Empty<DashboardOrgSummary>();
        }

        var orgIds = memberships.Select(m => m.OrganizationId).ToList();

        var openRequests = await _db.Requests
            .AsNoTracking()
            .Where(r => orgIds.Contains(r.OrganizationId) && r.Status == RequestStatus.Open)
            .Select(r => new { r.Id, r.OrganizationId })
            .ToListAsync(cancellationToken);

        var openRequestIds = openRequests.Select(r => r.Id).ToList();
        var pendingQuoteStatuses = new[] { QuoteStatus.Submitted, QuoteStatus.UnderReview };

        var pendingQuotesByOrg = openRequestIds.Count == 0
            ? new Dictionary<Guid, int>()
            : await _db.Quotes
                .AsNoTracking()
                .Where(q => openRequestIds.Contains(q.RequestId) && pendingQuoteStatuses.Contains(q.Status))
                .Join(
                    _db.Requests.AsNoTracking(),
                    q => q.RequestId,
                    r => r.Id,
                    (q, r) => r.OrganizationId)
                .GroupBy(orgId => orgId)
                .Select(g => new { OrganizationId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.OrganizationId, x => x.Count, cancellationToken);

        var adminOrgIds = memberships
            .Where(m => m.Role is OrgRole.Owner or OrgRole.Admin)
            .Select(m => m.OrganizationId)
            .ToList();

        var pendingJoinsByOrg = adminOrgIds.Count == 0
            ? new Dictionary<Guid, int>()
            : await _db.JoinRequests
                .AsNoTracking()
                .Where(j => adminOrgIds.Contains(j.OrganizationId) && j.Status == JoinRequestStatus.Pending)
                .GroupBy(j => j.OrganizationId)
                .Select(g => new { OrganizationId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.OrganizationId, x => x.Count, cancellationToken);

        var openCountByOrg = openRequests
            .GroupBy(r => r.OrganizationId)
            .ToDictionary(g => g.Key, g => g.Count());

        return memberships
            .OrderBy(m => m.Organization!.Name)
            .Select(m =>
            {
                var orgId = m.OrganizationId;
                var canSeeJoins = m.Role is OrgRole.Owner or OrgRole.Admin;
                return new DashboardOrgSummary(
                    orgId,
                    m.Organization!.Name,
                    m.Organization.Description,
                    m.Organization.LogoPath,
                    m.Role.ToString(),
                    openCountByOrg.GetValueOrDefault(orgId),
                    pendingQuotesByOrg.GetValueOrDefault(orgId),
                    canSeeJoins ? pendingJoinsByOrg.GetValueOrDefault(orgId) : 0);
            })
            .ToList();
    }
}
