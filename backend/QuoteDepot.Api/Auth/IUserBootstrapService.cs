using System.Security.Claims;
using QuoteDepot.Domain.Entities;

namespace QuoteDepot.Api.Auth;

public interface IUserBootstrapService
{
    Task<BootstrapResult> BootstrapAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default);
}

public record BootstrapResult(
    User User,
    IReadOnlyList<MembershipSummary> Memberships,
    IReadOnlyList<PendingInviteSummary> PendingInvites,
    IReadOnlyList<JoinRequestSummary> JoinRequests);

public record MembershipSummary(
    Guid OrganizationId,
    string OrganizationName,
    string Role,
    string Status);

public record PendingInviteSummary(
    Guid InviteId,
    Guid OrganizationId,
    string OrganizationName,
    string Role,
    string Email,
    string Token);

public record JoinRequestSummary(
    Guid JoinRequestId,
    Guid OrganizationId,
    string OrganizationName,
    string Status);
