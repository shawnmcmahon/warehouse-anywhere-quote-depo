using QuoteDepot.Domain.Enums;
using QuoteDepot.Domain.Exceptions;
using QuoteDepot.Domain.StateMachines;

namespace QuoteDepot.Tests;

public class QuoteLifecycleTests
{
    [Theory]
    [InlineData(QuoteStatus.Draft, QuoteStatus.Submitted)]
    [InlineData(QuoteStatus.Submitted, QuoteStatus.UnderReview)]
    [InlineData(QuoteStatus.Submitted, QuoteStatus.Rejected)]
    [InlineData(QuoteStatus.UnderReview, QuoteStatus.Accepted)]
    [InlineData(QuoteStatus.UnderReview, QuoteStatus.Rejected)]
    public void Legal_transitions_are_allowed(QuoteStatus from, QuoteStatus to)
    {
        Assert.True(QuoteLifecycle.CanTransition(from, to));
        QuoteLifecycle.EnsureCanTransition(from, to);
    }

    [Theory]
    [InlineData(QuoteStatus.Draft, QuoteStatus.Accepted)]
    [InlineData(QuoteStatus.Draft, QuoteStatus.UnderReview)]
    [InlineData(QuoteStatus.Submitted, QuoteStatus.Accepted)]
    [InlineData(QuoteStatus.Accepted, QuoteStatus.Rejected)]
    [InlineData(QuoteStatus.Rejected, QuoteStatus.Submitted)]
    public void Illegal_transitions_throw(QuoteStatus from, QuoteStatus to)
    {
        Assert.False(QuoteLifecycle.CanTransition(from, to));
        Assert.Throws<DomainException>(() => QuoteLifecycle.EnsureCanTransition(from, to));
    }

    [Theory]
    [InlineData(QuoteStatus.Draft, true)]
    [InlineData(QuoteStatus.Submitted, true)]
    [InlineData(QuoteStatus.UnderReview, true)]
    [InlineData(QuoteStatus.Accepted, false)]
    [InlineData(QuoteStatus.Rejected, false)]
    public void Active_status_matches_lifecycle(QuoteStatus status, bool expected)
    {
        Assert.Equal(expected, QuoteLifecycle.IsActive(status));
    }
}
