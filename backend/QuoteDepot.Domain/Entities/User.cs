namespace QuoteDepot.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string CognitoSub { get; set; }
    public required string Email { get; set; }
    public string? Name { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<OrganizationMembership> Memberships { get; set; } = new List<OrganizationMembership>();
}
