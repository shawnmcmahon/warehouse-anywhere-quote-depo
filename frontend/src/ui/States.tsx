import type { ReactNode } from "react";
import { cx } from "../lib/cx";

/**
 * Empty, error and loading states.
 *
 * An empty state is a sheet with nothing drawn on it yet, so it keeps the
 * setting-out grid and a dashed edge and says what to draw. Errors state what
 * happened and what to do about it; they do not apologise and they are never
 * vague about which operation failed.
 */

type EmptyStateProps = {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        "bp-grid flex flex-col items-start gap-3 border border-dashed border-bp-graphite/60 bg-bp-vellum px-5 py-8",
        className,
      )}
    >
      <h3 className="bp-display m-0 text-xl text-bp-ink">{title}</h3>
      <p className="bp-body m-0 max-w-[52ch] text-sm text-bp-graphite">{body}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

type ErrorStateProps = {
  /** What failed, named as the user's operation rather than the endpoint. */
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
};

export function ErrorState({ title, body, action, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cx(
        "flex flex-col items-start gap-3 border border-bp-flag bg-bp-flag/8 px-5 py-6",
        className,
      )}
    >
      <p className="bp-anno m-0 text-[9px] text-bp-flag">Not completed</p>
      <h3 className="bp-display m-0 text-xl text-bp-ink">{title}</h3>
      <p className="bp-body m-0 max-w-[52ch] text-sm text-bp-ink/80">{body}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** Inline confirmation after a mutation lands. */
export function Notice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cx(
        "bp-body m-0 border border-bp-approve/50 bg-bp-approve/10 px-3 py-2 text-xs text-bp-approve",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx("animate-pulse bg-bp-graphite/20", className)}
      aria-hidden="true"
    />
  );
}

export function LoadingState({
  label,
  rows = 3,
}: {
  label: string;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <p className="bp-anno m-0 text-[9px] text-bp-graphite">{label}</p>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}
