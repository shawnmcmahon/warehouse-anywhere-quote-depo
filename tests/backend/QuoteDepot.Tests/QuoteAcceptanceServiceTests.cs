using QuoteDepot.Domain.Entities;
using QuoteDepot.Domain.Enums;
using QuoteDepot.Domain.Exceptions;
using QuoteDepot.Domain.Services;

namespace QuoteDepot.Tests;

public class QuoteAcceptanceServiceTests
{
    [Fact]
    public void Accept_rejects_other_active_quotes_and_closes_request()
    {
        var request = CreateOpenRequest();
        var winner = CreateQuote(request.Id, QuoteStatus.UnderReview, "Winner Co");
        var other = CreateQuote(request.Id, QuoteStatus.Submitted, "Other Co");
        var draft = CreateQuote(request.Id, QuoteStatus.Draft, "Draft Co");
        request.Quotes = [winner, other, draft];

        QuoteAcceptanceService.ApplyExclusiveAccept(request, winner);

        Assert.Equal(QuoteStatus.Accepted, winner.Status);
        Assert.Equal(QuoteStatus.Rejected, other.Status);
        Assert.Equal(QuoteStatus.Rejected, draft.Status);
        Assert.Equal(RequestStatus.Closed, request.Status);
    }

    [Fact]
    public void Accept_from_submitted_is_illegal()
    {
        var request = CreateOpenRequest();
        var quote = CreateQuote(request.Id, QuoteStatus.Submitted, "Too Early");
        request.Quotes = [quote];

        Assert.Throws<DomainException>(() =>
            QuoteAcceptanceService.ApplyExclusiveAccept(request, quote));
    }

    [Fact]
    public void Accept_on_closed_request_throws()
    {
        var request = CreateOpenRequest();
        request.Status = RequestStatus.Closed;
        var quote = CreateQuote(request.Id, QuoteStatus.UnderReview, "Late");
        request.Quotes = [quote];

        Assert.Throws<DomainException>(() =>
            QuoteAcceptanceService.ApplyExclusiveAccept(request, quote));
    }

    [Fact]
    public void Second_accept_throws_when_already_accepted()
    {
        var request = CreateOpenRequest();
        var first = CreateQuote(request.Id, QuoteStatus.Accepted, "First");
        var second = CreateQuote(request.Id, QuoteStatus.UnderReview, "Second");
        request.Quotes = [first, second];

        Assert.Throws<DomainException>(() =>
            QuoteAcceptanceService.ApplyExclusiveAccept(request, second));
    }

    private static Request CreateOpenRequest() => new()
    {
        Id = Guid.NewGuid(),
        OrganizationId = Guid.NewGuid(),
        CreatedByUserId = Guid.NewGuid(),
        Title = "Pallet racking RFQ",
        PublicSlug = "test-slug",
        Status = RequestStatus.Open,
    };

    private static Quote CreateQuote(Guid requestId, QuoteStatus status, string name) => new()
    {
        Id = Guid.NewGuid(),
        RequestId = requestId,
        BusinessName = name,
        Amount = 1000m,
        Unit = QuoteUnit.OneTime,
        ContactName = "Contact",
        ContactEmail = "contact@example.com",
        Status = status,
    };
}
