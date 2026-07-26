using QuoteDepot.Domain.Enums;

namespace QuoteDepot.Domain.Entities;

public class OrganizationMembership
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid UserId { get; set; }
    public OrgRole Role { get; set; }
    public MembershipStatus Status { get; set; } = MembershipStatus.Active;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Organization? Organization { get; set; }
    public User? User { get; set; }
}
