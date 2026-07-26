import { SignJWT } from "jose";
import { authConfig } from "./config";

/** Mint a dev JWT matching backend DevJwt / appsettings.Development Cognito section. */
export async function createDevJwt(
  email: string,
  name?: string | null,
): Promise<string> {
  const sub = `dev-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const key = new TextEncoder().encode(authConfig.devSigningKey);

  const jwt = new SignJWT({
    email: email.trim().toLowerCase(),
    ...(name ? { name } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuer(authConfig.devIssuer)
    .setAudience(authConfig.devAudience)
    .setIssuedAt()
    .setExpirationTime("1h");

  return jwt.sign(key);
}
