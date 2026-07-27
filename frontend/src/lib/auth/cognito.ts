import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { authConfig } from "./config";

function getUserPool(): CognitoUserPool {
  if (!authConfig.cognitoUserPoolId || !authConfig.cognitoClientId) {
    throw new Error("Cognito is not configured.");
  }

  return new CognitoUserPool({
    UserPoolId: authConfig.cognitoUserPoolId,
    ClientId: authConfig.cognitoClientId,
  });
}

function mapCognitoError(error: unknown): Error {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: string }).code);
    switch (code) {
      case "NotAuthorizedException":
        return new Error("Incorrect email or password.");
      case "UserNotFoundException":
        return new Error("No account found for that email.");
      case "UserNotConfirmedException":
        return new Error("Verify your email before signing in.");
      case "PasswordResetRequiredException":
        return new Error("Password reset required. Use forgot password or contact support.");
      case "InvalidParameterException":
        return new Error("Enter a valid email and password.");
      default:
        break;
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Sign-in failed. Please try again.");
}

/** Sign in with email/password via Cognito USER_SRP_AUTH; returns an ID token JWT. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const pool = getUserPool();
  const user = new CognitoUser({
    Username: normalizedEmail,
    Pool: pool,
  });

  const authDetails = new AuthenticationDetails({
    Username: normalizedEmail,
    Password: password,
  });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        resolve(idToken);
      },
      onFailure: (err) => {
        reject(mapCognitoError(err));
      },
      newPasswordRequired: () => {
        reject(
          new Error(
            "Your account requires a new password. Contact support to finish setup.",
          ),
        );
      },
    });
  });
}
