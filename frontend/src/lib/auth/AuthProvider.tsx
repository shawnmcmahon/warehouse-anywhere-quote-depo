import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BootstrapResponse } from "../api-types";
import { endpoints } from "../api/endpoints";
import { ApiError } from "../api/client";
import { authConfig } from "./config";
import {
  confirmForgotPassword,
  confirmSignUp,
  forgotPassword,
  resendConfirmationCode,
  signInWithPassword,
  signUpWithPassword,
} from "./cognito";
import { createDevJwt } from "./dev-jwt";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./token-storage";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  bootstrap: BootstrapResponse | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ needsConfirmation: boolean }>;
  confirmSignUpWithEmail: (email: string, code: string) => Promise<void>;
  resendSignUpCode: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
  signOut: () => void;
  refreshBootstrap: () => Promise<void>;
  useDevAuth: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchBootstrap(): Promise<BootstrapResponse> {
  return endpoints.me.bootstrap();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);

  const refreshBootstrap = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setBootstrap(null);
      setStatus("unauthenticated");
      return;
    }

    try {
      const data = await fetchBootstrap();
      setBootstrap(data);
      setStatus("authenticated");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccessToken();
      }
      setBootstrap(null);
      setStatus("unauthenticated");
      throw error;
    }
  }, []);

  useEffect(() => {
    void refreshBootstrap().catch(() => {
      // Unauthenticated on startup is expected.
    });
  }, [refreshBootstrap]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (authConfig.useDevAuth) {
        const token = await createDevJwt(email);
        setAccessToken(token);
        await refreshBootstrap();
        return;
      }

      const token = await signInWithPassword(email, password);
      setAccessToken(token);
      await refreshBootstrap();
    },
    [refreshBootstrap],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      if (authConfig.useDevAuth) {
        const token = await createDevJwt(email);
        setAccessToken(token);
        await refreshBootstrap();
        return { needsConfirmation: false };
      }

      const { needsConfirmation } = await signUpWithPassword(email, password);
      if (!needsConfirmation) {
        const token = await signInWithPassword(email, password);
        setAccessToken(token);
        await refreshBootstrap();
      }

      return { needsConfirmation };
    },
    [refreshBootstrap],
  );

  const confirmSignUpWithEmail = useCallback(async (email: string, code: string) => {
    if (authConfig.useDevAuth) {
      return;
    }

    await confirmSignUp(email, code);
  }, []);

  const resendSignUpCode = useCallback(async (email: string) => {
    if (authConfig.useDevAuth) {
      return;
    }

    await resendConfirmationCode(email);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (authConfig.useDevAuth) {
      throw new Error("Password reset is not available in dev auth mode.");
    }

    await forgotPassword(email);
  }, []);

  const confirmPasswordReset = useCallback(
    async (email: string, code: string, newPassword: string) => {
      if (authConfig.useDevAuth) {
        throw new Error("Password reset is not available in dev auth mode.");
      }

      await confirmForgotPassword(email, code, newPassword);
    },
    [],
  );

  const signOut = useCallback(() => {
    clearAccessToken();
    setBootstrap(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({
      status,
      bootstrap,
      signInWithEmail,
      signUpWithEmail,
      confirmSignUpWithEmail,
      resendSignUpCode,
      requestPasswordReset,
      confirmPasswordReset,
      signOut,
      refreshBootstrap,
      useDevAuth: authConfig.useDevAuth,
    }),
    [
      status,
      bootstrap,
      signInWithEmail,
      signUpWithEmail,
      confirmSignUpWithEmail,
      resendSignUpCode,
      requestPasswordReset,
      confirmPasswordReset,
      signOut,
      refreshBootstrap,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
