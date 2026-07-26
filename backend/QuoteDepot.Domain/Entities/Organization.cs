namespace QuoteDepot.Domain.Entities;

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? LogoPath { get; set; }
    public Guid OwnerUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? Owner { get; set; }
    public ICollection<OrganizationMembership> Memberships { get; set; } = new List<OrganizationMembership>();
    public ICollection<Invite> Invites { get; set; } = new List<Invite>();
    public ICollection<JoinRequest> JoinRequests { get; set; } = new List<JoinRequest>();
    public ICollection<Request> Requests { get; set; } = new List<Request>();
    public ICollection<AuditEvent> AuditEvents { get; set; } = new List<AuditEvent>();
}
