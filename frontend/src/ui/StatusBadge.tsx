import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { quoteStatusLabel } from "../lib/format";
import type {
  JoinRequestStatus,
  MembershipStatus,
  QuoteStatus,
  RequestStatus,
} from "../lib/api-types";

/**
 * Five tones, mapped to meaning rather than to individual statuses:
 * `hazard` is solid because it marks the one thing waiting on a decision, and
 * everything else is a tinted outline so a table of them stays quiet.
 */
export type BadgeTone = "neutral" | "line" | "hazard" | "approve" | "flag";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-bp-graphite/45 bg-bp-graphite/10 text-bp-graphite",
  line: "border-bp-line/45 bg-bp-line/10 text-bp-line",
  hazard: "border-bp-ink bg-bp-hazard text-bp-ink",
  approve: "border-bp-approve/45 bg-bp-approve/10 text-bp-approve",
  flag: "border-bp-flag/45 bg-bp-flag/10 text-bp-flag",
};

const DOTS: Record<BadgeTone, string> = {
  neutral: "bg-bp-graphite",
  line: "bg-bp-line",
  hazard: "bg-bp-ink",
  approve: "bg-bp-approve",
  flag: "bg-bp-flag",
};

type BadgeProps = {
  tone: BadgeTone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
};

export function Badge({ tone, children, dot = false, className }: BadgeProps) {
  return (
    <span
      className={cx(
        "bp-anno inline-flex items-center gap-1.5 border px-2 py-1 text-[9px]",
        TONES[tone],
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cx("inline-block h-1.5 w-1.5 rounded-full", DOTS[tone])}
        />
      ) : null}
      {children}
    </span>
  );
}

const QUOTE_TONES: Record<QuoteStatus, BadgeTone> = {
  Draft: "neutral",
  Submitted: "line",
  UnderReview: "hazard",
  Accepted: "approve",
  Rejected: "flag",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <Badge tone={QUOTE_TONES[status]}>{quoteStatusLabel(status)}</Badge>;
}

const REQUEST_TONES: Record<RequestStatus, BadgeTone> = {
  Open: "line",
  Closed: "neutral",
  Cancelled: "flag",
};

export function RequestStatusBadge({
  status,
  dot = false,
}: {
  status: RequestStatus;
  dot?: boolean;
}) {
  return (
    <Badge tone={REQUEST_TONES[status]} dot={dot}>
      {status === "Open" ? "Open for bid" : status}
    </Badge>
  );
}

const MEMBERSHIP_TONES: Record<MembershipStatus, BadgeTone> = {
  Active: "approve",
  Revoked: "flag",
};

export function MembershipStatusBadge({
  status,
}: {
  status: MembershipStatus;
}) {
  return <Badge tone={MEMBERSHIP_TONES[status]}>{status}</Badge>;
}

const JOIN_TONES: Record<JoinRequestStatus, BadgeTone> = {
  Pending: "hazard",
  Approved: "approve",
  Rejected: "flag",
};

export function JoinRequestStatusBadge({
  status,
}: {
  status: JoinRequestStatus;
}) {
  return <Badge tone={JOIN_TONES[status]}>{status}</Badge>;
}
