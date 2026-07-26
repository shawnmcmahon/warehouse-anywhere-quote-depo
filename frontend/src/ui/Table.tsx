import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cx } from "../lib/cx";

/**
 * Ruled tables for the light surfaces — members, requests, revisions.
 *
 * The reversed cyanotype tabulation on the request sheet is deliberately not
 * built from these: it is the one signature element on that page and it is
 * written out in full there.
 */

type TableProps = {
  /** Horizontal scroll kicks in below this, rather than crushing columns. */
  minWidth?: number;
  caption?: string;
  className?: string;
  children: ReactNode;
};

export function Table({ minWidth = 640, caption, className, children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        style={{ minWidth: `${minWidth}px` }}
        className={cx("w-full border-collapse text-left", className)}
      >
        {caption ? (
          <caption className="bp-anno pb-2 text-left text-[9px] text-bp-graphite">
            {caption}
          </caption>
        ) : null}
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function HeadRow({ children }: { children: ReactNode }) {
  return <tr className="border-b border-bp-ink">{children}</tr>;
}

type RowProps = {
  children: ReactNode;
  /** Marks the row the page is recommending or has settled on. */
  emphasis?: boolean;
  className?: string;
};

export function Row({ children, emphasis = false, className }: RowProps) {
  return (
    <tr
      className={cx(
        "border-b border-bp-line/25 align-middle last:border-b-0",
        emphasis && "bg-bp-hazard/10",
        className,
      )}
    >
      {children}
    </tr>
  );
}

type THProps = ThHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right";
};

export function TH({ align = "left", className, children, ...rest }: THProps) {
  return (
    <th
      scope="col"
      className={cx(
        "bp-anno py-2.5 pr-4 text-[9px] font-medium text-bp-graphite last:pr-0",
        align === "right" && "text-right",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

type TDProps = TdHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right";
  /** Mono and tabular, for anything that should line up down the column. */
  figure?: boolean;
};

export function TD({
  align = "left",
  figure = false,
  className,
  children,
  ...rest
}: TDProps) {
  return (
    <td
      className={cx(
        "py-3.5 pr-4 text-sm last:pr-0",
        figure ? "bp-data" : "bp-body",
        align === "right" && "text-right",
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}
