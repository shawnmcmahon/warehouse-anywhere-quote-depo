using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace QuoteDepot.Tests.Support;

public static class DevJwt
{
    public const string Issuer = "quote-depot-dev";
    public const string Audience = "quote-depot-dev-client";
    public const string SigningKey = "quote-depot-dev-signing-key-min-32-chars!";

    public static string Create(string sub, string email, string? name = null)
    {
        var claims = new List<Claim>
        {
            new("sub", sub),
            new("email", email),
        };
        if (!string.IsNullOrWhiteSpace(name))
        {
            claims.Add(new Claim("name", name));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
