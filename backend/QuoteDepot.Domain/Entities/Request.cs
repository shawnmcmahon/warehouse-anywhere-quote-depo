using QuoteDepot.Domain.Enums;

namespace QuoteDepot.Domain.Entities;

public class Request
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public required string PublicSlug { get; set; }
    public RequestStatus Status { get; set; } = RequestStatus.Open;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public uint RowVersion { get; set; }

    public Organization? Organization { get; set; }
    public User? CreatedBy { get; set; }
    public ICollection<Quote> Quotes { get; set; } = new List<Quote>();
}
