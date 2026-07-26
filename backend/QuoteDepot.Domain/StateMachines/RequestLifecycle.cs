using QuoteDepot.Domain.Enums;
using QuoteDepot.Domain.Exceptions;

namespace QuoteDepot.Domain.StateMachines;

public static class RequestLifecycle
{
    private static readonly IReadOnlyDictionary<RequestStatus, HashSet<RequestStatus>> Allowed =
        new Dictionary<RequestStatus, HashSet<RequestStatus>>
        {
            [RequestStatus.Open] = [RequestStatus.Closed, RequestStatus.Cancelled],
            [RequestStatus.Closed] = [],
            [RequestStatus.Cancelled] = [],
        };

    public static bool CanTransition(RequestStatus from, RequestStatus to) =>
        Allowed.TryGetValue(from, out var next) && next.Contains(to);

    public static void EnsureCanTransition(RequestStatus from, RequestStatus to)
    {
        if (!CanTransition(from, to))
        {
            throw new DomainException($"Invalid request transition from {from} to {to}.");
        }
    }

    public static bool AcceptsQuotes(RequestStatus status) => status == RequestStatus.Open;
}
