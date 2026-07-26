import { authConfig, PKCE_VERIFIER_KEY } from "./config";

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

function randomVerifier(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64UrlEncode(bytes);
}

export async function beginCognitoSignIn(options?: {
  identityProvider?: "Google";
  loginHint?: string;
}): Promise<void> {
  const verifier = randomVerifier();
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  const challenge = base64UrlEncode(await sha256(verifier));

  const params = new URLSearchParams({
    client_id: authConfig.cognitoClientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: authConfig.redirectUri,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  if (options?.identityProvider) {
    params.set("identity_provider", options.identityProvider);
  }
  if (options?.loginHint) {
    params.set("login_hint", options.loginHint);
  }

  const url = `https://${authConfig.cognitoDomain}.auth.${authConfig.cognitoRegion}.amazoncognito.com/oauth2/authorize?${params}`;
  window.location.assign(url);
}

export async function exchangeAuthorizationCode(
  code: string,
): Promise<string> {
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  if (!verifier) {
    throw new Error("Sign-in session expired. Please try again.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: authConfig.cognitoClientId,
    code,
    redirect_uri: authConfig.redirectUri,
    code_verifier: verifier,
  });

  const response = await fetch(
    `https://${authConfig.cognitoDomain}.auth.${authConfig.cognitoRegion}.amazoncognito.com/oauth2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to exchange authorization code.");
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("No access token returned from Cognito.");
  }
  return payload.access_token;
}
