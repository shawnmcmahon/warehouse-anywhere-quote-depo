using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using QuoteDepot.Api.Auth;
using QuoteDepot.Api.Middleware;
using QuoteDepot.Api.Services;
using QuoteDepot.Infrastructure;
using QuoteDepot.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(options => options.Filters.Add<DomainExceptionFilter>());
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddQuoteDepotAuth(builder.Configuration, builder.Environment);
builder.Services.AddScoped<IUserBootstrapServiceBridge, UserBootstrapServiceBridge>();
builder.Services.AddScoped<ICurrentUserAccessor, CurrentUserAccessor>();
builder.Services.AddScoped<IOrganizationService, OrganizationService>();
builder.Services.AddScoped<IRequestQuoteService, RequestQuoteService>();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    // Partition by client IP + request slug so one busy RFQ cannot starve others.
    options.AddPolicy("public-quotes", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var slug = httpContext.Request.RouteValues.TryGetValue("slug", out var routeSlug)
            ? routeSlug?.ToString() ?? string.Empty
            : string.Empty;
        return RateLimitPartition.GetFixedWindowLimiter(
            $"{ip}:{slug}",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            });
    });
});
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyHeader()
            .AllowAnyMethod()
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173");
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program;
