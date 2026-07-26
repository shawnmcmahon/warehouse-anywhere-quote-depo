import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../lib/auth/AuthProvider";
import { LoadingState } from "../ui/States";

export default function SignInCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { completeCognitoCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const oauthError = params.get("error_description") ?? params.get("error");

    if (oauthError) {
      setError(oauthError);
      return;
    }

    if (!code) {
      setError("No authorization code returned.");
      return;
    }

    void completeCognitoCallback(code)
      .then(() => navigate("/app", { replace: true }))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Sign-in failed.");
      });
  }, [completeCognitoCallback, navigate, params]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bp-vellum px-5 text-bp-ink">
        <h1 className="bp-display m-0 text-2xl">Sign-in failed</h1>
        <p className="bp-body m-0 mt-4 max-w-md text-sm text-bp-graphite">{error}</p>
        <Link
          to="/signin"
          className="bp-anno bp-focus mt-6 text-[10px] text-bp-line underline decoration-dotted underline-offset-4"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return <LoadingState label="Completing sign-in" />;
}
