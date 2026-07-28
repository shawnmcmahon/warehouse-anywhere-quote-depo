using System.Security.Cryptography;

namespace QuoteDepot.Domain.Services;

public static class PublicSlugGenerator
{
    public static string Create() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(8)).ToLowerInvariant();
}
