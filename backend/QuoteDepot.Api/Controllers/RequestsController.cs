using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuoteDepot.Api.Services;
using QuoteDepot.Domain.Enums;

namespace QuoteDepot.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/orgs/{orgId:guid}/requests")]
public class RequestsController : ControllerBase
{
    private readonly IRequestQuoteService _service;
    private readonly ICurrentUserAccessor _users;

    public RequestsController(IRequestQuoteService service, ICurrentUserAccessor users)
    {
        _service = service;
        _users = users;
    }

    [HttpPost]
    public async Task<ActionResult<RequestResponse>> Create(
        Guid orgId,
        [FromBody] CreateRequestBody body,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var request = await _service.CreateRequestAsync(orgId, user, body.Title, body.Description, cancellationToken);
        return CreatedAtAction(nameof(Get), new { orgId, requestId = request.Id }, RequestResponse.From(request));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RequestResponse>>> List(Guid orgId, CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var items = await _service.ListRequestsAsync(orgId, user, cancellationToken);
        return Ok(items.Select(RequestResponse.From).ToList());
    }

    [HttpGet("{requestId:guid}")]
    public async Task<ActionResult<RequestResponse>> Get(
        Guid orgId,
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var request = await _service.GetRequestAsync(orgId, requestId, user, cancellationToken);
        return Ok(RequestResponse.From(request));
    }

    [HttpPut("{requestId:guid}")]
    public async Task<ActionResult<RequestResponse>> Update(
        Guid orgId,
        Guid requestId,
        [FromBody] UpdateRequestBody body,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var request = await _service.UpdateRequestAsync(orgId, requestId, user, body.Title, body.Description, cancellationToken);
        return Ok(RequestResponse.From(request));
    }

    [HttpPost("{requestId:guid}/status")]
    public async Task<ActionResult<RequestResponse>> Transition(
        Guid orgId,
        Guid requestId,
        [FromBody] TransitionRequestBody body,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<RequestStatus>(body.Status, ignoreCase: true, out var status))
        {
            return BadRequest(new { error = "Invalid request status." });
        }

        var user = await _users.RequireUserAsync(User, cancellationToken);
        var request = await _service.TransitionRequestAsync(orgId, requestId, user, status, cancellationToken);
        return Ok(RequestResponse.From(request));
    }

    [HttpPost("{requestId:guid}/regenerate-slug")]
    public async Task<ActionResult<RequestResponse>> RegenerateSlug(
        Guid orgId,
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var request = await _service.RegenerateSlugAsync(orgId, requestId, user, cancellationToken);
        return Ok(RequestResponse.From(request));
    }

    [HttpGet("{requestId:guid}/quotes")]
    public async Task<ActionResult<IReadOnlyList<QuoteResponse>>> ListQuotes(
        Guid orgId,
        Guid requestId,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        var quotes = await _service.ListQuotesAsync(orgId, requestId, user, cancellationToken);
        return Ok(quotes.Select(QuoteResponse.From).ToList());
    }

    [HttpPost("{requestId:guid}/quotes/{quoteId:guid}/status")]
    public async Task<ActionResult<QuoteResponse>> TransitionQuote(
        Guid orgId,
        Guid requestId,
        Guid quoteId,
        [FromBody] TransitionQuoteBody body,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<QuoteStatus>(body.Status, ignoreCase: true, out var status))
        {
            return BadRequest(new { error = "Invalid quote status." });
        }

        var user = await _users.RequireUserAsync(User, cancellationToken);
        var quote = await _service.TransitionQuoteAsync(orgId, requestId, quoteId, user, status, cancellationToken);
        return Ok(QuoteResponse.From(quote));
    }

    [HttpPost("{requestId:guid}/quotes/{quoteId:guid}/accept")]
    public async Task<IActionResult> AcceptQuote(
        Guid orgId,
        Guid requestId,
        Guid quoteId,
        CancellationToken cancellationToken)
    {
        var user = await _users.RequireUserAsync(User, cancellationToken);
        await _service.AcceptQuoteAsync(orgId, requestId, quoteId, user, cancellationToken);
        return NoContent();
    }
}

public record CreateRequestBody(string Title, string? Description);
public record UpdateRequestBody(string Title, string? Description);
public record TransitionRequestBody(string Status);
public record TransitionQuoteBody(string Status);

public record RequestResponse(
    Guid Id,
    Guid OrganizationId,
    string Title,
    string? Description,
    string PublicSlug,
    string Status,
    DateTimeOffset CreatedAt)
{
    public static RequestResponse From(Domain.Entities.Request r) =>
        new(r.Id, r.OrganizationId, r.Title, r.Description, r.PublicSlug, r.Status.ToString(), r.CreatedAt);
}

public record QuoteResponse(
    Guid Id,
    Guid RequestId,
    string BusinessName,
    decimal Amount,
    string Unit,
    DateTimeOffset? StartAt,
    DateTimeOffset? EndAt,
    string ContactName,
    string? ContactPhone,
    string ContactEmail,
    string? Notes,
    string Status,
    Guid? SubmittedByUserId)
{
    public static QuoteResponse From(Domain.Entities.Quote q) =>
        new(
            q.Id,
            q.RequestId,
            q.BusinessName,
            q.Amount,
            q.Unit.ToString(),
            q.StartAt,
            q.EndAt,
            q.ContactName,
            q.ContactPhone,
            q.ContactEmail,
            q.Notes,
            q.Status.ToString(),
            q.SubmittedByUserId);
}
