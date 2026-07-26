import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../lib/auth/AuthProvider";
import { LoadingState } from "../ui/States";

/**
 * Protects signed-in routes. Redirects unauthenticated users to sign-in and
 * users without a membership to onboarding.
 */
export function RequireAuth() {
  const { status, bootstrap } = useAuth();
  const location = useLocation();
  const onOnboarding = location.pathname.startsWith("/app/onboarding");

  if (status === "loading") {
    return <LoadingState label="Signing you in" />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  if (
    bootstrap &&
    bootstrap.memberships.length === 0 &&
    !onOnboarding
  ) {
    return <Navigate to="/app/onboarding" replace />;
  }

  return <Outlet />;
}
