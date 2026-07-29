using QuoteDepot.Domain.Enums;
using QuoteDepot.Domain.Exceptions;

namespace QuoteDepot.Domain.StateMachines;

public static class QuoteLifecycle
{
    private static readonly IReadOnlyDictionary<QuoteStatus, HashSet<QuoteStatus>> Allowed =
        new Dictionary<QuoteStatus, HashSet<QuoteStatus>>
        {
            [QuoteStatus.Draft] = [QuoteStatus.Submitted],
            [QuoteStatus.Submitted] = [QuoteStatus.UnderReview, QuoteStatus.Rejected],
            [QuoteStatus.UnderReview] = [QuoteStatus.Submitted, QuoteStatus.Accepted, QuoteStatus.Rejected],
            [QuoteStatus.Accepted] = [],
            [QuoteStatus.Rejected] = [],
        };

    public static bool CanTransition(QuoteStatus from, QuoteStatus to) =>
        Allowed.TryGetValue(from, out var next) && next.Contains(to);

    public static void EnsureCanTransition(QuoteStatus from, QuoteStatus to)
    {
        if (!CanTransition(from, to))
        {
            throw new DomainException($"Invalid quote transition from {from} to {to}.");
        }
    }

    public static bool IsActive(QuoteStatus status) =>
        status is QuoteStatus.Draft or QuoteStatus.Submitted or QuoteStatus.UnderReview;
}
