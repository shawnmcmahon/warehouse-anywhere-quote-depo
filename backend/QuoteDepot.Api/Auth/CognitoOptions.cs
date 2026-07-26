namespace QuoteDepot.Api.Auth;

public class CognitoOptions
{
    public const string SectionName = "Cognito";

    /// <summary>Cognito region, e.g. us-east-1.</summary>
    public string Region { get; set; } = string.Empty;

    /// <summary>Cognito User Pool ID.</summary>
    public string UserPoolId { get; set; } = string.Empty;

    /// <summary>App client ID (audience).</summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>
    /// When true (Development/Testing), accept a local test JWT signed with TestSigningKey
    /// instead of validating against Cognito JWKS. Never enable in Production.
    /// </summary>
    public bool UseDevAuth { get; set; }

    /// <summary>Symmetric key for DevAuth JWTs (tests / local only).</summary>
    public string TestSigningKey { get; set; } = "quote-depot-dev-signing-key-min-32-chars!";

    public string Authority =>
        string.IsNullOrWhiteSpace(Region) || string.IsNullOrWhiteSpace(UserPoolId)
            ? string.Empty
            : $"https://cognito-idp.{Region}.amazonaws.com/{UserPoolId}";
}
