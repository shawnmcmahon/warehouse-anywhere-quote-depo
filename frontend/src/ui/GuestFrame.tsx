import type { ReactNode } from "react";
import { Link } from "react-router";

export function GuestFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bp-vellum text-bp-ink">
      <a
        href="#main"
        className="bp-anno sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-bp-ink focus:px-4 focus:py-2 focus:text-[10px] focus:text-bp-hazard"
      >
        Skip to content
      </a>

      <header className="border-b border-bp-ink bg-bp-stock">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-2.5 lg:px-8">
          <Link to="/" className="bp-focus flex items-center gap-3 no-underline">
            <span className="flex h-6 w-6 items-center justify-center border border-bp-ink bg-bp-ink text-[10px] font-bold text-bp-hazard">
              QD
            </span>
            <span className="bp-display text-base text-bp-ink">Quote Depot</span>
          </Link>
          <span className="bp-anno text-[9px] text-bp-graphite">
            Bidding — no account needed
          </span>
        </div>
      </header>

      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[1120px] px-5 py-10 lg:px-8 lg:py-14">
          {children}
        </div>
      </main>

      <footer className="mt-auto border-t border-bp-ink bg-bp-stock">
        <div className="bp-anno mx-auto max-w-[1120px] px-5 py-3 text-[8px] text-bp-graphite lg:px-8">
          Quote Depot — requests are issued as fixed sheets so every bid prices
          the same work.
        </div>
      </footer>
    </div>
  );
}
