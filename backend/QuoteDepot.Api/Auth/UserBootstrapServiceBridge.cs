using System.Security.Claims;
using QuoteDepot.Api.Services;
using QuoteDepot.Domain.Entities;

namespace QuoteDepot.Api.Auth;

public class UserBootstrapServiceBridge : IUserBootstrapServiceBridge
{
    private readonly IUserBootstrapService _bootstrap;

    public UserBootstrapServiceBridge(IUserBootstrapService bootstrap)
    {
        _bootstrap = bootstrap;
    }

    public async Task<User> EnsureUserAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default)
    {
        var result = await _bootstrap.BootstrapAsync(principal, cancellationToken);
        return result.User;
    }
}
