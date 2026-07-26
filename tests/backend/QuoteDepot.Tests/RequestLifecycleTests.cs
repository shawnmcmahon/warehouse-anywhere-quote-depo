using QuoteDepot.Domain.Enums;
using QuoteDepot.Domain.Exceptions;
using QuoteDepot.Domain.StateMachines;

namespace QuoteDepot.Tests;

public class RequestLifecycleTests
{
    [Theory]
    [InlineData(RequestStatus.Open, RequestStatus.Closed)]
    [InlineData(RequestStatus.Open, RequestStatus.Cancelled)]
    public void Legal_transitions_are_allowed(RequestStatus from, RequestStatus to)
    {
        Assert.True(RequestLifecycle.CanTransition(from, to));
    }

    [Theory]
    [InlineData(RequestStatus.Closed, RequestStatus.Open)]
    [InlineData(RequestStatus.Cancelled, RequestStatus.Open)]
    [InlineData(RequestStatus.Closed, RequestStatus.Cancelled)]
    public void Illegal_transitions_throw(RequestStatus from, RequestStatus to)
    {
        Assert.Throws<DomainException>(() => RequestLifecycle.EnsureCanTransition(from, to));
    }

    [Fact]
    public void Only_open_requests_accept_quotes()
    {
        Assert.True(RequestLifecycle.AcceptsQuotes(RequestStatus.Open));
        Assert.False(RequestLifecycle.AcceptsQuotes(RequestStatus.Closed));
        Assert.False(RequestLifecycle.AcceptsQuotes(RequestStatus.Cancelled));
    }
}
