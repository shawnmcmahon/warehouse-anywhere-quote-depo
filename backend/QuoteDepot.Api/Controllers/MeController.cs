using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuoteDepot.Api.Auth;

namespace QuoteDepot.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/me")]
public class MeController : ControllerBase
{
    private readonly IUserBootstrapService _bootstrap;

    public MeController(IUserBootstrapService bootstrap)
    {
        _bootstrap = bootstrap;
    }

    /// <summary>
    /// Ensure a local user row exists for the Cognito subject and return memberships / pending invites.
    /// </summary>
    [HttpPost("bootstrap")]
    [ProducesResponseType(typeof(BootstrapResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<BootstrapResponse>> Bootstrap(CancellationToken cancellationToken)
    {
        var result = await _bootstrap.BootstrapAsync(User, cancellationToken);
        return Ok(new BootstrapResponse(
            result.User.Id,
            result.User.Email,
            result.User.Name,
            result.Memberships,
            result.PendingInvites,
            result.JoinRequests));
    }
}

public record BootstrapResponse(
    Guid UserId,
    string Email,
    string? Name,
    IReadOnlyList<MembershipSummary> Memberships,
    IReadOnlyList<PendingInviteSummary> PendingInvites,
    IReadOnlyList<JoinRequestSummary> JoinRequests);
