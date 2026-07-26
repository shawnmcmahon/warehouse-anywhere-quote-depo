import type { ReactNode } from "react";
import { cx } from "../lib/cx";

export type TitleBlockCell = {
  term: string;
  value: ReactNode;
};

type TitleBlockProps = {
  cells: TitleBlockCell[];
  /** Columns at the widest breakpoint; collapses to one on mobile. */
  columns?: 2 | 3 | 4;
  className?: string;
};

const COLUMNS: Record<2 | 3 | 4, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * The title block off a drawing sheet: fixed fields, hairline gaps, mono
 * values. Every screen that describes a record — a request, an organization,
 * a quote — states its facts here rather than inventing a layout for them.
 */
export function TitleBlock({ cells, columns = 4, className }: TitleBlockProps) {
  return (
    <dl
      className={cx(
        "m-0 grid grid-cols-1 gap-px border border-bp-ink bg-bp-ink",
        COLUMNS[columns],
        className,
      )}
    >
      {cells.map((cell) => (
        <div key={cell.term} className="bg-bp-vellum px-3 py-2.5">
          <dt className="bp-anno m-0 text-[8px] text-bp-graphite">
            {cell.term}
          </dt>
          <dd className="bp-data m-0 mt-1 text-xs text-bp-ink">{cell.value}</dd>
        </div>
      ))}
    </dl>
  );
}
