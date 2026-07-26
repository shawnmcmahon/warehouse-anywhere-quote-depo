import { Link } from "react-router";
import { ButtonLink } from "../ui/Button";

/**
 * Landing page for Warehouse Anywhere.
 *
 * Simple entry point for buyers to sign in and for vendors to find their
 * bid link. Not a product pitch.
 */

export default function Landing() {
  return (
    <div className="min-h-screen bg-bp-vellum text-bp-ink">
      <a
        href="#main"
        className="bp-anno sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-bp-ink focus:px-4 focus:py-2 focus:text-[10px] focus:text-bp-hazard"
      >
        Skip to content
      </a>

      <header className="border-b border-bp-ink bg-bp-stock">
        <div className="mx-auto flex max-w-[720px] items-center justify-between gap-6 px-5 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center border border-bp-ink bg-bp-ink text-[9px] font-bold text-bp-hazard">
              WA
            </span>
            <span className="bp-display text-base">Warehouse Anywhere</span>
          </div>

          <Link
            to="/signin"
            className="bp-anno bp-focus text-[10px] text-bp-graphite hover:text-bp-line"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto flex max-w-[720px] flex-1 flex-col px-5 py-16 lg:px-8 lg:py-24"
      >
        <div className="border border-bp-ink bg-bp-sheet">
          <div className="px-6 py-10 sm:px-8 sm:py-12">
            <h1 className="bp-display m-0 text-[clamp(1.75rem,4vw,2.25rem)]">
              Quote Depot
            </h1>

            <p className="bp-body m-0 mt-4 max-w-[48ch] text-[0.95rem] text-bp-ink/85">
              Raise warehousing requests, send them to vendors, and compare
              bids in one place.
            </p>

            <div className="mt-8">
              <ButtonLink to="/signin" variant="primary" size="lg">
                Sign in
              </ButtonLink>
            </div>
          </div>
        </div>

        <section className="mt-10" aria-labelledby="quick-links-heading">
          <h2
            id="quick-links-heading"
            className="bp-anno m-0 text-[10px] text-bp-graphite"
          >
            Quick links
          </h2>

          <ul className="mt-3 divide-y divide-bp-line/30 border border-bp-ink bg-bp-sheet">
            <li>
              <Link
                to="/signin"
                className="bp-body bp-focus block px-5 py-3.5 text-sm no-underline transition-colors hover:bg-bp-line/8"
              >
                Sign in to manage requests
              </Link>
            </li>
            <li>
              <p className="bp-body m-0 px-5 py-3.5 text-sm text-bp-graphite">
                Bidding on a request? Use the link you were sent — no account
                needed.
              </p>
            </li>
          </ul>
        </section>
      </main>

      <footer className="mt-auto border-t border-bp-ink bg-bp-stock">
        <div className="bp-anno mx-auto flex max-w-[720px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3 text-[8px] text-bp-graphite lg:px-8">
          <span>Warehouse Anywhere</span>
          <span>Quote Depot</span>
        </div>
      </footer>
    </div>
  );
}
