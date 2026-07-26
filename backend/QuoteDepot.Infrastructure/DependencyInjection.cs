using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using QuoteDepot.Infrastructure.Data;

namespace QuoteDepot.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var sqlitePath = configuration["Data:SqlitePath"]
            ?? Path.Combine(AppContext.BaseDirectory, "quotedepot.db");

        var directory = Path.GetDirectoryName(sqlitePath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite($"Data Source={sqlitePath}"));

        return services;
    }
}
