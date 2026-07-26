namespace QuoteDepot.Domain.Entities;

public class AuditEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? ActorUserId { get; set; }
    public Guid OrganizationId { get; set; }
    public required string Action { get; set; }
    public required string EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;
    public string? MetadataJson { get; set; }

    public User? Actor { get; set; }
    public Organization? Organization { get; set; }
}
