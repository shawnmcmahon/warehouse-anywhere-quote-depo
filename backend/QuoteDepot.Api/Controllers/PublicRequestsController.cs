using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using QuoteDepot.Api.Services;
using QuoteDepot.Domain.Enums;

namespace QuoteDepot.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/public/requests")]
public class PublicRequestsController : ControllerBase
{
    private readonly IRequestQuoteService _service;
    private readonly ICurrentUserAccessor _users;

    public PublicRequestsController(IRequestQuoteService service, ICurrentUserAccessor users)
    {
        _service = service;
        _users = users;
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<PublicRequestResponse>> Get(string slug, CancellationToken cancellationToken)
    {
        var request = await _service.GetPublicRequestAsync(slug, cancellationToken);
        if (request is null)
        {
            return NotFound(new { error = "Request not found." });
        }

        return Ok(new PublicRequestResponse(
            request.Title,
            request.Description,
            request.Status.ToString(),
            request.PublicSlug,
            request.Status == RequestStatus.Open));
    }

    [HttpPost("{slug}/quotes")]
    [EnableRateLimiting("public-quotes")]
    public async Task<ActionResult<QuoteResponse>> SubmitQuote(
        string slug,
        [FromBody] PublicQuoteBody body,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<QuoteUnit>(body.Unit, ignoreCase: true, out var unit))
        {
            return BadRequest(new { error = "Unit must be OneTime, Monthly, or Weekly." });
        }

        var initial = string.IsNullOrWhiteSpace(body.Status)
            ? QuoteStatus.Submitted
            : Enum.TryParse<QuoteStatus>(body.Status, ignoreCase: true, out var parsed)
                ? parsed
                : QuoteStatus.Submitted;

        Guid? userId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var user = await _users.RequireUserAsync(User, cancellationToken);
            userId = user.Id;
        }

        var quote = await _service.SubmitPublicQuoteAsync(
            slug,
            new SubmitQuoteInput(
                body.BusinessName,
                body.Amount,
                unit,
                body.StartAt,
                body.EndAt,
                body.ContactName,
                body.ContactPhone,
                body.ContactEmail,
                body.Notes,
                initial),
            userId,
            cancellationToken);

        return Ok(QuoteResponse.From(quote));
    }
}

public record PublicRequestResponse(
    string Title,
    string? Description,
    string Status,
    string PublicSlug,
    bool AcceptingQuotes);

public record PublicQuoteBody(
    string BusinessName,
    decimal Amount,
    string Unit,
    DateTimeOffset? StartAt,
    DateTimeOffset? EndAt,
    string ContactName,
    string? ContactPhone,
    string ContactEmail,
    string? Notes,
    string? Status);
