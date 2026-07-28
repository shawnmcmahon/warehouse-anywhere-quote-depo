using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuoteDepot.Api.Services;

namespace QuoteDepot.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/orgs/{orgId:guid}/quotes")]
public class OrgQuotesController : ControllerBase
{
    private readonly IRequestQuoteService _quotes;
    private readonly ICurrentUserAccessor _users;

    public OrgQuotesController(IRequestQuoteService quotes, ICurrentUserAccessor users)
    {
        _quotes = quotes;
        _users = users;
    }

    [HttpGet("pending")]
    public async Task<ActionResult<IReadOnlyList<PendingQuoteResponse>>> ListPending(
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var items = await _quotes.ListPendingQuotesAsync(orgId, user, cancellationToken);
        return Ok(items.Select(PendingQuoteResponse.From).ToList());
    }
}

public record PendingQuoteResponse(
    Guid QuoteId,
    Guid RequestId,
    string RequestTitle,
    string BusinessName,
    decimal Amount,
    string Unit,
    string Status,
    DateTimeOffset CreatedAt)
{
    public static PendingQuoteResponse From(PendingQuoteSummary q) =>
        new(
            q.QuoteId,
            q.RequestId,
            q.RequestTitle,
            q.BusinessName,
            q.Amount,
            q.Unit.ToString(),
            q.Status.ToString(),
            q.CreatedAt);
}
