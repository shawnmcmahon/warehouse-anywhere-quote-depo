using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace QuoteDepot.Api.Auth;

public static class AuthServiceCollectionExtensions
{
    public static IServiceCollection AddQuoteDepotAuth(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var cognito = configuration.GetSection(CognitoOptions.SectionName).Get<CognitoOptions>()
            ?? new CognitoOptions();
        services.Configure<CognitoOptions>(configuration.GetSection(CognitoOptions.SectionName));

        var useDevAuth = cognito.UseDevAuth
            || environment.IsEnvironment("Testing")
            || (environment.IsDevelopment() && string.IsNullOrWhiteSpace(cognito.Authority));

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                if (useDevAuth)
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = "quote-depot-dev",
                        ValidateAudience = true,
                        ValidAudience = cognito.ClientId is { Length: > 0 } ? cognito.ClientId : "quote-depot-dev-client",
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(cognito.TestSigningKey)),
                        ValidateLifetime = true,
                        NameClaimType = "sub",
                    };
                }
                else
                {
                    if (string.IsNullOrWhiteSpace(cognito.Authority))
                    {
                        throw new InvalidOperationException(
                            "Cognito:Region and Cognito:UserPoolId are required when DevAuth is disabled.");
                    }

                    options.Authority = cognito.Authority;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = cognito.Authority,
                        ValidateAudience = true,
                        ValidAudience = cognito.ClientId,
                        ValidateLifetime = true,
                        NameClaimType = "sub",
                    };
                }
            });

        services.AddAuthorization();
        services.AddScoped<IUserBootstrapService, UserBootstrapService>();
        return services;
    }
}
