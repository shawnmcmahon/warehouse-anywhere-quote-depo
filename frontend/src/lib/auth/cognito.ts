import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
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

function mapCognitoSignUpError(error: unknown): Error {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: string }).code);
    switch (code) {
      case "UsernameExistsException":
        return new Error("An account with this email already exists. Sign in instead.");
      case "InvalidPasswordException":
        return new Error(
          "Password does not meet requirements. Use at least 8 characters with upper, lower, and a number.",
        );
      case "InvalidParameterException":
        return new Error("Enter a valid email and password.");
      default:
        break;
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Sign-up failed. Please try again.");
}

function mapCognitoConfirmError(error: unknown): Error {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: string }).code);
    switch (code) {
      case "CodeMismatchException":
        return new Error("That verification code is incorrect. Try again.");
      case "ExpiredCodeException":
        return new Error("That verification code expired. Request a new one.");
      case "LimitExceededException":
        return new Error("Too many attempts. Wait a moment and try again.");
      case "UserNotFoundException":
        return new Error("No pending sign-up found for that email.");
      case "InvalidParameterException":
        return new Error("Enter the email and verification code from your message.");
      default:
        break;
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Verification failed. Please try again.");
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

export type SignUpResult = {
  needsConfirmation: boolean;
};

/** Register a new user with email/password in Cognito. */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<SignUpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const pool = getUserPool();

  return new Promise((resolve, reject) => {
    pool.signUp(
      normalizedEmail,
      password,
      [new CognitoUserAttribute({ Name: "email", Value: normalizedEmail })],
      [],
      (err, result) => {
        if (err) {
          reject(mapCognitoSignUpError(err));
          return;
        }

        resolve({ needsConfirmation: !result?.userConfirmed });
      },
    );
  });
}

/** Confirm a new user's email with the verification code from Cognito. */
export async function confirmSignUp(
  email: string,
  code: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const pool = getUserPool();
  const user = new CognitoUser({
    Username: normalizedEmail,
    Pool: pool,
  });

  return new Promise((resolve, reject) => {
    user.confirmRegistration(code.trim(), true, (err) => {
      if (err) {
        reject(mapCognitoConfirmError(err));
        return;
      }
      resolve();
    });
  });
}

/** Resend the sign-up verification code email. */
export async function resendConfirmationCode(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const pool = getUserPool();
  const user = new CognitoUser({
    Username: normalizedEmail,
    Pool: pool,
  });

  return new Promise((resolve, reject) => {
    user.resendConfirmationCode((err) => {
      if (err) {
        reject(mapCognitoConfirmError(err));
        return;
      }
      resolve();
    });
  });
}
