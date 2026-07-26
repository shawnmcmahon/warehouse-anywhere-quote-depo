import type { QuoteResponse } from "./api-types";

/**
 * Bid comparison, derived only from fields the API actually returns.
 *
 * A rate on its own does not say what a bid costs, because two vendors quoting
 * the same unit rate can be quoting different windows. Extending each bid
 * across the term it offers, and measuring that term against the widest one on
 * the sheet, is what makes a low rate with a late start legible as the
 * narrower offer it is.
 */

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.44;

function parse(value: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function daysBetween(start: string | null, end: string | null): number | null {
  const from = parse(start);
  const to = parse(end);
  if (from === null || to === null || to < from) return null;
  return (to - from) / MS_PER_DAY;
}

/**
 * How far short of the benchmark window a bid falls. Graded rather than
 * boolean so that a bid starting a few days later reads as a note, and only a
 * genuinely narrower offer takes the compliance flag.
 */
export type Shortfall = "none" | "minor" | "material";

const MINOR_BELOW = 0.97;
const MATERIAL_BELOW = 0.85;

export type BidRow = {
  quote: QuoteResponse;
  /** Term the vendor offered, in months. Null when they left dates blank. */
  months: number | null;
  /** Rate extended across the offered term. Null when the term is unknown. */
  termTotal: number | null;
  /** Days after the earliest quoted start this bid begins. */
  daysLate: number;
  /** Share of the benchmark window this bid covers. Null when dates are absent. */
  coverage: number | null;
  shortfall: Shortfall;
};

export type BidComparison = {
  rows: BidRow[];
  /** Widest window any active bid offers, in months. */
  benchmarkMonths: number | null;
  earliestStart: string | null;
  latestEnd: string | null;
};

/** Quotes still in play. Rejected bids drop out of the comparison. */
export function isActive(quote: QuoteResponse): boolean {
  return quote.status !== "Rejected";
}

export function compareBids(quotes: QuoteResponse[]): BidComparison {
  const active = quotes.filter(isActive);

  const starts = active
    .map((quote) => quote.startAt)
    .filter((value): value is string => Boolean(value))
    .sort();
  const ends = active
    .map((quote) => quote.endAt)
    .filter((value): value is string => Boolean(value))
    .sort();

  const earliestStart = starts.length > 0 ? starts[0] : null;
  const latestEnd = ends.length > 0 ? ends[ends.length - 1] : null;

  const benchmarkDays = daysBetween(earliestStart, latestEnd);
  const benchmarkMonths =
    benchmarkDays === null ? null : benchmarkDays / DAYS_PER_MONTH;

  const rows = quotes.map((quote): BidRow => {
    const days = daysBetween(quote.startAt, quote.endAt);
    const months = days === null ? null : days / DAYS_PER_MONTH;

    let termTotal: number | null = null;
    if (quote.unit === "OneTime") {
      termTotal = quote.amount;
    } else if (days !== null) {
      termTotal =
        quote.unit === "Monthly"
          ? quote.amount * (days / DAYS_PER_MONTH)
          : quote.amount * (days / 7);
    }

    const startDelta = daysBetween(earliestStart, quote.startAt);
    const daysLate = startDelta === null ? 0 : Math.round(startDelta);

    const coverage =
      benchmarkMonths === null || benchmarkMonths === 0 || months === null
        ? null
        : months / benchmarkMonths;

    let shortfall: Shortfall = "none";
    if (coverage !== null && coverage < MATERIAL_BELOW) {
      shortfall = "material";
    } else if (coverage !== null && coverage < MINOR_BELOW) {
      shortfall = "minor";
    }

    return { quote, months, termTotal, daysLate, coverage, shortfall };
  });

  return { rows, benchmarkMonths, earliestStart, latestEnd };
}

export function formatMonths(months: number | null): string {
  if (months === null) return "—";
  return `${months.toFixed(1)} mo`;
}
