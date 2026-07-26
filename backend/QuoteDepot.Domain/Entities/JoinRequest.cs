using QuoteDepot.Domain.Enums;

namespace QuoteDepot.Domain.Entities;

public class JoinRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid UserId { get; set; }
    public JoinRequestStatus Status { get; set; } = JoinRequestStatus.Pending;
    public string? Message { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ResolvedAt { get; set; }
    public Guid? ResolvedByUserId { get; set; }

    public Organization? Organization { get; set; }
    public User? User { get; set; }
    public User? ResolvedBy { get; set; }
}
