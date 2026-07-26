using QuoteDepot.Domain.Enums;

namespace QuoteDepot.Domain.Entities;

public class Quote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RequestId { get; set; }
    public Guid? SubmittedByUserId { get; set; }
    public required string BusinessName { get; set; }
    public decimal Amount { get; set; }
    public QuoteUnit Unit { get; set; }
    public DateTimeOffset? StartAt { get; set; }
    public DateTimeOffset? EndAt { get; set; }
    public required string ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public required string ContactEmail { get; set; }
    public string? Notes { get; set; }
    public QuoteStatus Status { get; set; } = QuoteStatus.Submitted;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public uint RowVersion { get; set; }

    public Request? Request { get; set; }
    public User? SubmittedBy { get; set; }
}
