using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuoteDepot.Api.Services;

namespace QuoteDepot.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/public/orgs")]
public class PublicOrganizationsController : ControllerBase
{
    private readonly IOrganizationService _orgs;

    public PublicOrganizationsController(IOrganizationService orgs)
    {
        _orgs = orgs;
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<PublicOrganizationResponse>> Get(string slug, CancellationToken cancellationToken)
    {
        var org = await _orgs.GetByPublicSlugAsync(slug, cancellationToken);
        if (org is null)
        {
            return NotFound(new { error = "Organization not found." });
        }

        var requests = await _orgs.ListPublicOpenRequestsAsync(slug, cancellationToken);
        return Ok(new PublicOrganizationResponse(
            org.Name,
            org.Description,
            org.PublicSlug,
            requests.Select(PublicOpenRequestResponse.From).ToList()));
    }
}

public record PublicOrganizationResponse(
    string Name,
    string? Description,
    string PublicSlug,
    IReadOnlyList<PublicOpenRequestResponse> OpenRequests);

public record PublicOpenRequestResponse(
    string Title,
    string? Description,
    string PublicSlug,
    DateTimeOffset CreatedAt)
{
    public static PublicOpenRequestResponse From(Domain.Entities.Request r) =>
        new(r.Title, r.Description, r.PublicSlug, r.CreatedAt);
}
