import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { Button } from "../ui/Button";
import { PasswordField, TextField } from "../ui/Field";
import { ErrorState } from "../ui/States";
import { useAuth } from "../lib/auth/AuthProvider";

type AuthMode = "signin" | "signup" | "verify" | "forgot";
type ForgotStep = "request" | "reset";

function parseMode(value: string | null): AuthMode {
  if (value === "signup") return "signup";
  if (value === "verify") return "verify";
  if (value === "forgot") return "forgot";
  return "signin";
}

function parseForgotStep(value: string | null): ForgotStep {
  return value === "reset" ? "reset" : "request";
}

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    signInWithEmail,
    signUpWithEmail,
    confirmSignUpWithEmail,
    resendSignUpCode,
    requestPasswordReset,
    confirmPasswordReset,
    useDevAuth,
  } = useAuth();
  const mode = parseMode(searchParams.get("mode"));
  const forgotStep = parseForgotStep(searchParams.get("step"));
  const verifyEmail = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const forgotEmail = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const signInEmail = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? "/app";

  function switchMode(nextMode: AuthMode, email?: string) {
    setError(null);
    setSuccessMessage(null);
    setPasswordVisible(false);

    if (nextMode === "signup") {
      setSearchParams({ mode: "signup" }, { replace: true });
      return;
    }

    if (nextMode === "verify") {
      setSearchParams(
        email
          ? { mode: "verify", email }
          : { mode: "verify" },
        { replace: true },
      );
      return;
    }

    if (nextMode === "forgot") {
      setSearchParams(
        email ? { mode: "forgot", email } : { mode: "forgot" },
        { replace: true },
      );
      return;
    }

    setSearchParams(email ? { email } : {}, { replace: true });
  }

  function switchForgotStep(step: ForgotStep, email?: string) {
    setError(null);
    setSuccessMessage(null);
    setPasswordVisible(false);

    if (step === "reset" && email) {
      setSearchParams({ mode: "forgot", email, step: "reset" }, { replace: true });
      return;
    }

    setSearchParams(email ? { mode: "forgot", email } : { mode: "forgot" }, {
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
      const message =
        err instanceof Error ? err.message : "Sign-in failed.";
      if (message === "Verify your email before signing in.") {
        switchMode("verify", email);
        setError(null);
        setSuccessMessage(
          "Enter the verification code from your email to finish setting up your account.",
        );
      } else if (
        message ===
        "Password reset required. Use forgot password or contact support."
      ) {
        switchMode("forgot", email);
        setError(null);
        setSuccessMessage(
          "Your account requires a new password. Request a reset code below.",
        );
      } else {
        setError(message);
      }
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
        switchMode("verify", email);
        setSuccessMessage(
          "We sent a verification code to your email. Enter it below to activate your account.",
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

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    const code = String(new FormData(form).get("code") ?? "").trim();

    if (!email || !code) {
      setError("Enter your email and the verification code from your message.");
      setSubmitting(false);
      return;
    }

    try {
      await confirmSignUpWithEmail(email, code);
      switchMode("signin", email);
      setSuccessMessage(
        "Email verified. Sign in with the password you chose during sign up.",
      );
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setSubmitting(false);
    }
  }

  async function handleResendCode(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    setError(null);
    setResending(true);
    const form = event.currentTarget.form;
    const email = form
      ? String(new FormData(form).get("email") ?? "").trim()
      : verifyEmail;

    if (!email) {
      setError("Enter your email to resend the verification code.");
      setResending(false);
      return;
    }

    try {
      await resendSignUpCode(email);
      setSuccessMessage("A new verification code has been sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  }

  async function handleForgotRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();

    if (!email) {
      setError("Enter your email to receive a reset code.");
      setSubmitting(false);
      return;
    }

    try {
      await requestPasswordReset(email);
      switchForgotStep("reset", email);
      setSuccessMessage(
        "We sent a reset code to your email. Enter it below with your new password.",
      );
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset code.");
      setSubmitting(false);
    }
  }

  async function handleForgotReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    const code = String(new FormData(form).get("code") ?? "").trim();
    const password = String(new FormData(form).get("password") ?? "");
    const confirmPassword = String(
      new FormData(form).get("confirmPassword") ?? "",
    );

    if (!email || !code) {
      setError("Enter your email and the reset code from your message.");
      setSubmitting(false);
      return;
    }

    if (!password) {
      setError("Enter a new password.");
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      await confirmPasswordReset(email, code, password);
      switchMode("signin", email);
      setSuccessMessage(
        "Password updated. Sign in with your new password.",
      );
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed.");
      setSubmitting(false);
    }
  }

  async function handleResendResetCode(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    setError(null);
    setResending(true);
    const form = event.currentTarget.form;
    const email = form
      ? String(new FormData(form).get("email") ?? "").trim()
      : forgotEmail;

    if (!email) {
      setError("Enter your email to resend the reset code.");
      setResending(false);
      return;
    }

    try {
      await requestPasswordReset(email);
      setSuccessMessage("A new reset code has been sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setResending(false);
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

          {mode === "verify" || mode === "forgot" ? (
            <div className="border-b border-bp-ink bg-bp-stock px-4 py-3">
              <button
                type="button"
                onClick={() => switchMode("signin", mode === "forgot" ? forgotEmail : undefined)}
                className="bp-anno bp-focus text-[10px] text-bp-graphite hover:text-bp-ink"
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
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
          )}

          <div className="p-6 sm:p-8">
            {mode === "forgot" ? (
              forgotStep === "reset" ? (
                <div id="forgot-reset-panel">
                  <h1 className="bp-display m-0 text-3xl">Set new password</h1>
                  <p className="bp-body m-0 mt-3 text-sm text-bp-graphite">
                    Enter the reset code from your email and choose a new password.
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
                      <ErrorState title="Password reset failed" body={error} />
                    </div>
                  ) : null}

                  <form
                    className="mt-7 flex flex-col gap-5"
                    onSubmit={handleForgotReset}
                  >
                    <TextField
                      label="Work email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      defaultValue={forgotEmail}
                      placeholder="you@company.com"
                    />
                    <TextField
                      label="Reset code"
                      name="code"
                      required
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      placeholder="6-digit code"
                      hint="Paste the code from your password reset email."
                    />
                    <PasswordField
                      label="New password"
                      name="password"
                      required
                      autoComplete="new-password"
                      placeholder="Choose a new password"
                      visible={passwordVisible}
                      onVisibleChange={setPasswordVisible}
                    />
                    <PasswordField
                      label="Confirm new password"
                      name="confirmPassword"
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter your new password"
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
                      {submitting ? "Updating…" : "Update password"}
                    </Button>
                    <Button
                      type="button"
                      variant="quiet"
                      size="sm"
                      disabled={resending}
                      onClick={handleResendResetCode}
                    >
                      {resending ? "Sending…" : "Resend reset code"}
                    </Button>
                  </form>
                </div>
              ) : (
                <div id="forgot-request-panel">
                  <h1 className="bp-display m-0 text-3xl">Reset password</h1>
                  <p className="bp-body m-0 mt-3 text-sm text-bp-graphite">
                    Enter your work email and we will send a reset code.
                    {useDevAuth
                      ? " Password reset is not available in dev auth mode."
                      : ""}
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
                      <ErrorState title="Could not send reset code" body={error} />
                    </div>
                  ) : null}

                  <form
                    className="mt-7 flex flex-col gap-5"
                    onSubmit={handleForgotRequest}
                  >
                    <TextField
                      label="Work email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      defaultValue={forgotEmail}
                      placeholder="you@company.com"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      disabled={submitting || useDevAuth}
                    >
                      {submitting ? "Sending…" : "Send reset code"}
                    </Button>
                  </form>
                </div>
              )
            ) : mode === "verify" ? (
              <div id="verify-panel">
                <h1 className="bp-display m-0 text-3xl">Verify email</h1>
                <p className="bp-body m-0 mt-3 text-sm text-bp-graphite">
                  Enter the verification code from the email Cognito sent you.
                  The message usually comes from an address like
                  no-reply@verificationemail.com.
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
                    <ErrorState title="Verification failed" body={error} />
                  </div>
                ) : null}

                <form
                  className="mt-7 flex flex-col gap-5"
                  onSubmit={handleVerify}
                >
                  <TextField
                    label="Work email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    defaultValue={verifyEmail}
                    placeholder="you@company.com"
                  />
                  <TextField
                    label="Verification code"
                    name="code"
                    required
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    hint="Paste the code from your verification email."
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={submitting}
                  >
                    {submitting ? "Verifying…" : "Verify email"}
                  </Button>
                  <Button
                    type="button"
                    variant="quiet"
                    size="sm"
                    disabled={resending}
                    onClick={handleResendCode}
                  >
                    {resending ? "Sending…" : "Resend verification code"}
                  </Button>
                </form>
              </div>
            ) : mode === "signin" ? (
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
                    defaultValue={signInEmail}
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
                  {!useDevAuth ? (
                    <p className="bp-body m-0 -mt-2 text-right text-xs">
                      <button
                        type="button"
                        onClick={() => switchMode("forgot", signInEmail)}
                        className="bp-focus text-bp-line underline decoration-dotted underline-offset-4"
                      >
                        Forgot password?
                      </button>
                    </p>
                  ) : null}
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

                <p className="bp-body m-0 mt-5 text-xs text-bp-graphite">
                  Waiting on a verification code?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("verify", signInEmail)}
                    className="bp-focus text-bp-line underline decoration-dotted underline-offset-4"
                  >
                    Verify your email
                  </button>
                </p>
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
