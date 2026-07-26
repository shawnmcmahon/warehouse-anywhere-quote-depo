import type { QuoteStatus, QuoteUnit, RequestStatus } from "./api-types";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const currencyWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function money(amount: number): string {
  return currency.format(amount);
}

export function moneyWhole(amount: number): string {
  return currencyWhole.format(amount);
}

const UNIT_SUFFIX: Record<QuoteUnit, string> = {
  OneTime: "one time",
  Monthly: "per month",
  Weekly: "per week",
};

const UNIT_SHORT: Record<QuoteUnit, string> = {
  OneTime: "once",
  Monthly: "/mo",
  Weekly: "/wk",
};

export function unitLabel(unit: QuoteUnit): string {
  return UNIT_SUFFIX[unit];
}

export function rate(amount: number, unit: QuoteUnit): string {
  return unit === "OneTime"
    ? money(amount)
    : `${money(amount)}${UNIT_SHORT[unit]}`;
}

/** Drawings date things plainly, so the whole app uses ISO calendar dates. */
export function day(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function dayTime(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return `${day(value)} ${parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
}

export function dateRange(
  start: string | null,
  end: string | null,
): string {
  if (!start && !end) return "Not stated";
  if (start && !end) return `From ${day(start)}`;
  if (!start && end) return `Until ${day(end)}`;
  return `${day(start)} → ${day(end)}`;
}

const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  Draft: "Draft",
  Submitted: "Submitted",
  UnderReview: "Under review",
  Accepted: "Accepted",
  Rejected: "Rejected",
};

export function quoteStatusLabel(status: QuoteStatus): string {
  return QUOTE_STATUS_LABEL[status];
}

export function requestStatusLabel(status: RequestStatus): string {
  return status;
}

/**
 * Audit actions arrive as `entity.verb` keys. The revision table wants a
 * sentence, so expand the verb and leave the entity to its own column.
 */
export function auditDescription(action: string): string {
  const verb = action.includes(".") ? action.slice(action.indexOf(".") + 1) : action;
  const words = verb.replace(/_/g, " ");
  const subject = action.includes(".") ? action.slice(0, action.indexOf(".")) : "";
  const subjectWords = subject.replace(/_/g, " ");
  const sentence = `${subjectWords} ${words}`.trim();
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/** Public quote links are shown in full so they can be read off a screen. */
export function publicRequestUrl(slug: string): string {
  return `${window.location.origin}/r/${slug}`;
}

/** Trim to a whole word so a summary never breaks mid-term. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const clipped = text.slice(0, max);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped).replace(/[,.;:]$/, "")}…`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
