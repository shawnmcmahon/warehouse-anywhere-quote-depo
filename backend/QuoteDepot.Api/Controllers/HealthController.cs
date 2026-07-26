using Microsoft.AspNetCore.Mvc;

namespace QuoteDepot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(HealthResponse), StatusCodes.Status200OK)]
    public ActionResult<HealthResponse> Get()
    {
        return Ok(new HealthResponse("ok", "QuoteDepot.Api", DateTimeOffset.UtcNow));
    }
}

public record HealthResponse(string Status, string Service, DateTimeOffset Timestamp);
