using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuoteDepot.Api.Services;
using QuoteDepot.Domain.Enums;

namespace QuoteDepot.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/orgs")]
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationService _orgs;
    private readonly ICurrentUserAccessor _users;
    private readonly IAuditService _audit;
    private readonly IOrgLogoService _logos;

    public OrganizationsController(
        IOrganizationService orgs,
        ICurrentUserAccessor users,
        IAuditService audit,
        IOrgLogoService logos)
    {
        _orgs = orgs;
        _users = users;
        _audit = audit;
        _logos = logos;
    }

    [HttpPost]
    public async Task<ActionResult<OrgResponse>> Create(
        [FromBody] CreateOrgRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var org = await _orgs.CreateAsync(user, request.Name, request.Description, cancellationToken);
        return CreatedAtAction(nameof(Get), new { orgId = org.Id }, OrgResponse.From(org));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrgResponse>>> List(CancellationToken cancellationToken)
    {
        await _users.RequireUserAsync(User, cancellationToken);
        var orgs = await _orgs.ListBrowseAsync(cancellationToken);
        return Ok(orgs.Select(OrgResponse.From).ToList());
    }

    [HttpGet("{orgId:guid}")]
    public async Task<ActionResult<OrgResponse>> Get(Guid orgId, CancellationToken cancellationToken)
    {
        await _users.RequireUserAsync(User, cancellationToken);
        var org = await _orgs.GetAsync(orgId, cancellationToken);
        return Ok(OrgResponse.From(org));
    }

    [HttpPut("{orgId:guid}")]
    public async Task<ActionResult<OrgResponse>> Update(
        Guid orgId,
        [FromBody] UpdateOrgRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var org = await _orgs.UpdateAsync(orgId, user, request.Name, request.Description, cancellationToken);
        return Ok(OrgResponse.From(org));
    }

    [HttpGet("{orgId:guid}/members")]
    public async Task<ActionResult<IReadOnlyList<MemberResponse>>> ListMembers(
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var members = await _orgs.ListMembersAsync(orgId, user, cancellationToken);
        return Ok(members.Select(MemberResponse.From).ToList());
    }

    [HttpGet("{orgId:guid}/invites")]
    public async Task<ActionResult<IReadOnlyList<InviteResponse>>> ListInvites(
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var invites = await _orgs.ListInvitesAsync(orgId, user, cancellationToken);
        return Ok(invites.Select(InviteResponse.From).ToList());
    }

    [HttpPost("{orgId:guid}/invites")]
    public async Task<ActionResult<InviteResponse>> Invite(
        Guid orgId,
        [FromBody] InviteRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        if (!Enum.TryParse<OrgRole>(request.Role, ignoreCase: true, out var role))
        {
            return BadRequest(new { error = "Role must be Admin or Member." });
        }

        var invite = await _orgs.InviteAsync(orgId, user, request.Email, role, cancellationToken);
        return Ok(InviteResponse.From(invite));
    }

    [HttpDelete("{orgId:guid}/invites/{inviteId:guid}")]
    public async Task<IActionResult> RevokeInvite(
        Guid orgId,
        Guid inviteId,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        await _orgs.RevokeInviteAsync(orgId, user, inviteId, cancellationToken);
        return NoContent();
    }

    [HttpPost("invites/accept")]
    public async Task<ActionResult<MemberResponse>> AcceptInvite(
        [FromBody] AcceptInviteRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var membership = await _orgs.AcceptInviteAsync(user, request.Token, cancellationToken);
        return Ok(new MemberResponse(
            membership.Id,
            membership.UserId,
            user.Email,
            user.Name,
            membership.Role.ToString(),
            membership.Status.ToString()));
    }

    [HttpPatch("{orgId:guid}/members/{membershipId:guid}/role")]
    public async Task<IActionResult> ChangeRole(
        Guid orgId,
        Guid membershipId,
        [FromBody] ChangeRoleRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        if (!Enum.TryParse<OrgRole>(request.Role, ignoreCase: true, out var role))
        {
            return BadRequest(new { error = "Role must be Admin or Member." });
        }

        await _orgs.ChangeRoleAsync(orgId, user, membershipId, role, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{orgId:guid}/members/{membershipId:guid}")]
    public async Task<IActionResult> Revoke(
        Guid orgId,
        Guid membershipId,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        await _orgs.RevokeMembershipAsync(orgId, user, membershipId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{orgId:guid}/join-requests")]
    public async Task<ActionResult<JoinRequestResponse>> RequestJoin(
        Guid orgId,
        [FromBody] CreateJoinRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var joinRequest = await _orgs.RequestJoinAsync(orgId, user, request.Message, cancellationToken);
        return Ok(JoinRequestResponse.From(joinRequest));
    }

    [HttpGet("{orgId:guid}/join-requests")]
    public async Task<ActionResult<IReadOnlyList<JoinRequestResponse>>> ListJoinRequests(
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var items = await _orgs.ListJoinRequestsAsync(orgId, user, cancellationToken);
        return Ok(items.Select(JoinRequestResponse.From).ToList());
    }

    [HttpPost("{orgId:guid}/join-requests/{joinRequestId:guid}/approve")]
    public async Task<IActionResult> ApproveJoin(
        Guid orgId,
        Guid joinRequestId,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        await _orgs.ApproveJoinRequestAsync(orgId, user, joinRequestId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{orgId:guid}/join-requests/{joinRequestId:guid}/reject")]
    public async Task<IActionResult> RejectJoin(
        Guid orgId,
        Guid joinRequestId,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        await _orgs.RejectJoinRequestAsync(orgId, user, joinRequestId, cancellationToken);
        return NoContent();
    }

    [HttpGet("{orgId:guid}/audit")]
    public async Task<ActionResult<IReadOnlyList<AuditEventResponse>>> ListAudit(
        Guid orgId,
        [FromQuery] int take = 100,
        CancellationToken cancellationToken = default)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var events = await _audit.ListForOrgAsync(orgId, user, take, cancellationToken);
        return Ok(events.Select(AuditEventResponse.From).ToList());
    }

    [HttpPost("{orgId:guid}/logo")]
    [RequestSizeLimit(2 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 2 * 1024 * 1024)]
    public async Task<ActionResult<OrgResponse>> UploadLogo(
        Guid orgId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { error = "A logo file is required." });
        }

        var user = await _users.RequireUserAsync(User, cancellationToken);
        await using var stream = file.OpenReadStream();
        var org = await _logos.UploadAsync(
            orgId,
            user,
            stream,
            file.ContentType,
            file.FileName,
            cancellationToken);
        return Ok(OrgResponse.From(org));
    }

    [HttpGet("{orgId:guid}/logo")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLogo(Guid orgId, CancellationToken cancellationToken)
    {
        var opened = await _logos.OpenAsync(orgId, cancellationToken);
        if (opened is null)
        {
            return NotFound();
        }

        return File(opened.Value.Stream, opened.Value.ContentType);
    }
}

public record CreateOrgRequest(string Name, string? Description);
public record UpdateOrgRequest(string Name, string? Description);
public record InviteRequest(string Email, string Role);
public record AcceptInviteRequest(string Token);
public record ChangeRoleRequest(string Role);
public record CreateJoinRequest(string? Message);

public record OrgResponse(Guid Id, string Name, string? Description, Guid OwnerUserId, string? LogoPath, string PublicSlug)
{
    public static OrgResponse From(Domain.Entities.Organization o) =>
        new(o.Id, o.Name, o.Description, o.OwnerUserId, o.LogoPath, o.PublicSlug);
}

public record MemberResponse(Guid MembershipId, Guid UserId, string? Email, string? Name, string Role, string Status)
{
    public static MemberResponse From(Domain.Entities.OrganizationMembership m) =>
        new(m.Id, m.UserId, m.User?.Email, m.User?.Name, m.Role.ToString(), m.Status.ToString());
}

public record InviteResponse(Guid InviteId, string Email, string Role, string Status, string Token)
{
    public static InviteResponse From(Domain.Entities.Invite i) =>
        new(i.Id, i.Email, i.Role.ToString(), i.Status.ToString(), i.Token);
}

public record JoinRequestResponse(Guid JoinRequestId, Guid UserId, string? Email, string Status, string? Message)
{
    public static JoinRequestResponse From(Domain.Entities.JoinRequest j) =>
        new(j.Id, j.UserId, j.User?.Email, j.Status.ToString(), j.Message);
}

public record AuditEventResponse(
    Guid Id,
    Guid? ActorUserId,
    string? ActorEmail,
    string Action,
    string EntityType,
    Guid? EntityId,
    DateTimeOffset OccurredAt,
    string? MetadataJson)
{
    public static AuditEventResponse From(Domain.Entities.AuditEvent e) =>
        new(
            e.Id,
            e.ActorUserId,
            e.Actor?.Email,
            e.Action,
            e.EntityType,
            e.EntityId,
            e.OccurredAt,
            e.MetadataJson);
}
