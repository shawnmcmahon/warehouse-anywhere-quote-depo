import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { Button } from "../ui/Button";
import { PasswordField, TextField } from "../ui/Field";
import { ErrorState } from "../ui/States";
import { useAuth } from "../lib/auth/AuthProvider";

type AuthMode = "signin" | "signup";

function parseMode(value: string | null): AuthMode {
  return value === "signup" ? "signup" : "signin";
}

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { signInWithEmail, signUpWithEmail, useDevAuth } = useAuth();
  const mode = parseMode(searchParams.get("mode"));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? "/app";

  function switchMode(nextMode: AuthMode) {
    setError(null);
    setSuccessMessage(null);
    setPasswordVisible(false);
    setSearchParams(nextMode === "signup" ? { mode: "signup" } : {}, {
      replace: true,
    });
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    const password = String(new FormData(form).get("password") ?? "");

    if (!email) {
      setSubmitting(false);
      return;
    }

    try {
      await signInWithEmail(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setSubmitting(false);
    }
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    const password = String(new FormData(form).get("password") ?? "");
    const confirmPassword = String(
      new FormData(form).get("confirmPassword") ?? "",
    );

    if (!email) {
      setSubmitting(false);
      return;
    }

    if (!password) {
      setError("Enter a password.");
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      const { needsConfirmation } = await signUpWithEmail(email, password);
      if (needsConfirmation) {
        setError(null);
        setSearchParams({}, { replace: true });
        setSuccessMessage(
          "Account created. Check your email for a verification link, then sign in.",
        );
        setSubmitting(false);
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed.");
      setSubmitting(false);
    }
  }

  return (
    <div className="bp-grid flex min-h-screen flex-col bg-bp-vellum text-bp-ink">
      <header className="border-b border-bp-ink bg-bp-stock">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-6 px-5 py-2.5 lg:px-8">
          <Link to="/" className="bp-focus flex items-center gap-3 no-underline">
            <span className="flex h-6 w-6 items-center justify-center border border-bp-ink bg-bp-ink text-[10px] font-bold text-bp-hazard">
              QD
            </span>
            <span className="bp-display text-base text-bp-ink">Quote Depot</span>
          </Link>
          <Link
            to="/"
            className="bp-anno bp-focus text-[9px] text-bp-graphite hover:text-bp-line"
          >
            Back to site
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12 lg:py-20">
        <div className="w-full max-w-md border border-bp-ink bg-bp-sheet">
          <div className="border-b border-bp-ink bg-bp-stock px-6 py-3">
            <p className="bp-anno m-0 text-[9px] text-bp-graphite">
              Access control
              {useDevAuth ? " · dev auth" : ""}
            </p>
          </div>

          <div
            className="grid grid-cols-2 border-b border-bp-ink"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              role="tab"
              id="signin-tab"
              aria-selected={mode === "signin"}
              aria-controls="signin-panel"
              className={
                mode === "signin"
                  ? "bp-anno bp-focus border-b-2 border-bp-hazard bg-bp-sheet px-4 py-3 text-[10px] text-bp-ink"
                  : "bp-anno bp-focus border-b border-bp-line/30 bg-bp-stock px-4 py-3 text-[10px] text-bp-graphite hover:text-bp-ink"
              }
              onClick={() => switchMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              id="signup-tab"
              aria-selected={mode === "signup"}
              aria-controls="signup-panel"
              className={
                mode === "signup"
                  ? "bp-anno bp-focus border-b-2 border-bp-hazard bg-bp-sheet px-4 py-3 text-[10px] text-bp-ink"
                  : "bp-anno bp-focus border-b border-bp-line/30 bg-bp-stock px-4 py-3 text-[10px] text-bp-graphite hover:text-bp-ink"
              }
              onClick={() => switchMode("signup")}
            >
              Sign up
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {mode === "signin" ? (
              <div
                role="tabpanel"
                id="signin-panel"
                aria-labelledby="signin-tab"
              >
                <h1 className="bp-display m-0 text-3xl">Sign in</h1>
                <p className="bp-body m-0 mt-3 text-sm text-bp-graphite">
                  Buyers sign in to raise requests and award work. Vendors bidding
                  on a link do not need an account.
                </p>

                {successMessage ? (
                  <p
                    className="bp-body m-0 mt-5 border border-bp-approve bg-bp-stock px-4 py-3 text-sm text-bp-approve"
                    role="status"
                  >
                    {successMessage}
                  </p>
                ) : null}

                {error ? (
                  <div className="mt-5">
                    <ErrorState title="Sign-in failed" body={error} />
                  </div>
                ) : null}

                <form
                  className="mt-7 flex flex-col gap-5"
                  onSubmit={handleSignIn}
                >
                  <TextField
                    label="Work email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                  />
                  <PasswordField
                    label="Password"
                    name="password"
                    required={!useDevAuth}
                    autoComplete="current-password"
                    placeholder={useDevAuth ? "Optional in dev" : "Your password"}
                    visible={passwordVisible}
                    onVisibleChange={setPasswordVisible}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={submitting}
                  >
                    {submitting ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </div>
            ) : (
              <div
                role="tabpanel"
                id="signup-panel"
                aria-labelledby="signup-tab"
              >
                <h1 className="bp-display m-0 text-3xl">Sign up</h1>
                <p className="bp-body m-0 mt-3 text-sm text-bp-graphite">
                  Create a buyer account to raise requests and compare vendor
                  bids.
                </p>

                {error ? (
                  <div className="mt-5">
                    <ErrorState title="Sign-up failed" body={error} />
                  </div>
                ) : null}

                <form
                  className="mt-7 flex flex-col gap-5"
                  onSubmit={handleSignUp}
                >
                  <TextField
                    label="Work email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                  />
                  <PasswordField
                    label="Password"
                    name="password"
                    required
                    autoComplete="new-password"
                    placeholder="Choose a password"
                    visible={passwordVisible}
                    onVisibleChange={setPasswordVisible}
                  />
                  <PasswordField
                    label="Confirm password"
                    name="confirmPassword"
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    visible={passwordVisible}
                    onVisibleChange={setPasswordVisible}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={submitting}
                  >
                    {submitting ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              </div>
            )}

            <p className="bp-body m-0 mt-7 text-xs text-bp-graphite">
              Bidding on a request?{" "}
              <Link
                to="/"
                className="bp-focus text-bp-line underline decoration-dotted underline-offset-4"
              >
                Use the link you were sent
              </Link>{" "}
              — no account needed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
