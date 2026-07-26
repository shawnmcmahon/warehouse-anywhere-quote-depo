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
import { beginCognitoSignIn, exchangeAuthorizationCode } from "./cognito";
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
  signInWithEmail: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  completeCognitoCallback: (code: string) => Promise<void>;
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
    async (email: string) => {
      if (authConfig.useDevAuth) {
        const token = await createDevJwt(email);
        setAccessToken(token);
        await refreshBootstrap();
        return;
      }
      await beginCognitoSignIn({ loginHint: email });
    },
    [refreshBootstrap],
  );

  const signInWithGoogle = useCallback(async () => {
    await beginCognitoSignIn({ identityProvider: "Google" });
  }, []);

  const completeCognitoCallback = useCallback(
    async (code: string) => {
      const token = await exchangeAuthorizationCode(code);
      setAccessToken(token);
      await refreshBootstrap();
    },
    [refreshBootstrap],
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
      signInWithGoogle,
      completeCognitoCallback,
      signOut,
      refreshBootstrap,
      useDevAuth: authConfig.useDevAuth,
    }),
    [
      status,
      bootstrap,
      signInWithEmail,
      signInWithGoogle,
      completeCognitoCallback,
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
