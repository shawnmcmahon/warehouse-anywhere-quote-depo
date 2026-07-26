using QuoteDepot.Domain.Enums;

namespace QuoteDepot.Domain.Entities;

public class Invite
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string Email { get; set; }
    public OrgRole Role { get; set; } = OrgRole.Member;
    public InviteStatus Status { get; set; } = InviteStatus.Pending;
    public Guid InvitedByUserId { get; set; }
    public string Token { get; set; } = Guid.NewGuid().ToString("N");
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? AcceptedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }

    public Organization? Organization { get; set; }
    public User? InvitedBy { get; set; }
}
