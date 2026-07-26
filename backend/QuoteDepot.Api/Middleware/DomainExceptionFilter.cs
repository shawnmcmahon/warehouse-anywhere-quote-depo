using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using QuoteDepot.Domain.Exceptions;

namespace QuoteDepot.Api.Middleware;

public class DomainExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not DomainException domainException)
        {
            return;
        }

        context.Result = new BadRequestObjectResult(new { error = domainException.Message });
        context.ExceptionHandled = true;
    }
}
