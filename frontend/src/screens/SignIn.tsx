import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "../ui/Button";
import { TextField } from "../ui/Field";
import { ErrorState } from "../ui/States";
import { useAuth } from "../lib/auth/AuthProvider";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, useDevAuth } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? "/app";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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

          <div className="p-6 sm:p-8">
            <h1 className="bp-display m-0 text-3xl">Sign in</h1>
            <p className="bp-body m-0 mt-3 text-sm text-bp-graphite">
              Buyers sign in to raise requests and award work. Vendors bidding
              on a link do not need an account.
            </p>

            {error ? (
              <div className="mt-5">
                <ErrorState title="Sign-in failed" body={error} />
              </div>
            ) : null}

            <form
              className="mt-7 flex flex-col gap-5"
              onSubmit={handleSubmit}
            >
              <TextField
                label="Work email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                required={!useDevAuth}
                autoComplete="current-password"
                placeholder={useDevAuth ? "Optional in dev" : "Your password"}
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
