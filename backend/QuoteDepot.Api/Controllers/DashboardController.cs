using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuoteDepot.Api.Services;

namespace QuoteDepot.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboard;
    private readonly ICurrentUserAccessor _users;

    public DashboardController(IDashboardService dashboard, ICurrentUserAccessor users)
    {
        _dashboard = dashboard;
        _users = users;
    }

    /// <summary>
    /// Summary of the caller's organizations: open requests, pending quotes, and join requests (for Owner/Admin).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DashboardOrgResponse>>> Get(CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var items = await _dashboard.GetAsync(user, cancellationToken);
        return Ok(items.Select(DashboardOrgResponse.From).ToList());
    }
}

public record DashboardOrgResponse(
    Guid OrganizationId,
    string Name,
    string? Description,
    string? LogoPath,
    string Role,
    int OpenRequestCount,
    int PendingQuoteCount,
    int PendingJoinRequestCount)
{
    public static DashboardOrgResponse From(DashboardOrgSummary s) =>
        new(
            s.OrganizationId,
            s.Name,
            s.Description,
            s.LogoPath,
            s.Role,
            s.OpenRequestCount,
            s.PendingQuoteCount,
            s.PendingJoinRequestCount);
}
