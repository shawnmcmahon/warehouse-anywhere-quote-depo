using QuoteDepot.Domain.Entities;
using QuoteDepot.Domain.Enums;
using QuoteDepot.Domain.Exceptions;
using QuoteDepot.Domain.StateMachines;

namespace QuoteDepot.Domain.Services;

/// <summary>
/// Pure domain service: accepting a quote rejects other active quotes and closes the request.
/// Persistence / concurrency is handled by the application layer.
/// </summary>
public static class QuoteAcceptanceService
{
    public static void ApplyExclusiveAccept(Request request, Quote acceptedQuote)
    {
        if (request.Status != RequestStatus.Open)
        {
            throw new DomainException("Only open requests can accept a quote.");
        }

        if (acceptedQuote.RequestId != request.Id)
        {
            throw new DomainException("Quote does not belong to this request.");
        }

        QuoteLifecycle.EnsureCanTransition(acceptedQuote.Status, QuoteStatus.Accepted);

        var alreadyAccepted = request.Quotes.Any(q =>
            q.Id != acceptedQuote.Id && q.Status == QuoteStatus.Accepted);
        if (alreadyAccepted)
        {
            throw new DomainException("Request already has an accepted quote.");
        }

        acceptedQuote.Status = QuoteStatus.Accepted;
        acceptedQuote.UpdatedAt = DateTimeOffset.UtcNow;

        foreach (var quote in request.Quotes.Where(q =>
                     q.Id != acceptedQuote.Id && QuoteLifecycle.IsActive(q.Status)))
        {
            quote.Status = QuoteStatus.Rejected;
            quote.UpdatedAt = DateTimeOffset.UtcNow;
        }

        RequestLifecycle.EnsureCanTransition(request.Status, RequestStatus.Closed);
        request.Status = RequestStatus.Closed;
        request.UpdatedAt = DateTimeOffset.UtcNow;
    }
}
