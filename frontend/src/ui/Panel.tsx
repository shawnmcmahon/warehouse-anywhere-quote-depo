import type { ReactNode } from "react";
import { cx } from "../lib/cx";

type PanelProps = {
  title?: string;
  /** Mono caption sitting opposite the title — counts, scale, status. */
  annotation?: ReactNode;
  action?: ReactNode;
  /** Remove body padding when the panel holds a full-bleed table. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * A ruled panel on sheet stock. The header rail repeats the plotter strip from
 * the page header at component scale, which is what keeps a dashboard of these
 * reading as one drawing rather than a stack of cards.
 */
export function Panel({
  title,
  annotation,
  action,
  flush = false,
  className,
  children,
}: PanelProps) {
  return (
    <section
      className={cx("border border-bp-ink bg-bp-sheet", className)}
    >
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-bp-ink bg-bp-stock px-4 py-2.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="bp-display m-0 text-base">{title}</h2>
            {annotation ? (
              <span className="bp-anno text-[9px] text-bp-graphite">
                {annotation}
              </span>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}

      <div className={flush ? undefined : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}
