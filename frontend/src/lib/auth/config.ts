export const authConfig = {
  useDevAuth:
    import.meta.env.VITE_USE_DEV_AUTH === "true" ||
    !import.meta.env.VITE_COGNITO_USER_POOL_ID,
  cognitoRegion: import.meta.env.VITE_COGNITO_REGION ?? "us-east-1",
  cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "",
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
  devIssuer: "quote-depot-dev",
  devAudience: "quote-depot-dev-client",
  devSigningKey:
    import.meta.env.VITE_DEV_SIGNING_KEY ??
    "quote-depot-dev-signing-key-min-32-chars!",
} as const;

export const TOKEN_STORAGE_KEY = "quotedepot.access_token";
