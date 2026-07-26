import { Link } from "react-router-dom";
import { ButtonLink } from "../ui/Button";
import { WorkOrderSheet } from "../designs/industrial-blueprint/WorkOrderSheet";
import {
  coverage,
  formatRate,
  sampleBids,
  sampleRequest,
  testimonial,
  workflow,
} from "../designs/content";

/**
 * The product landing page.
 *
 * It shares the work order drawing with exploration /2 rather than reproducing
 * it, so the signature element has one definition. The process routing is
 * numbered because posting, sharing, comparing and awarding genuinely happen
 * in that order; nothing else on the page is.
 */

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const REQUIRED_POSITIONS = 1200;

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
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-2.5 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center border border-bp-ink bg-bp-ink text-[10px] font-bold text-bp-hazard">
              QD
            </span>
            <span className="bp-display text-base">Quote Depot</span>
          </div>

          <nav className="bp-anno flex flex-wrap items-center gap-x-5 gap-y-1 text-[9px] text-bp-graphite">
            <a href="#routing" className="bp-focus hover:text-bp-line">
              How it works
            </a>
            <a href="#tabulation" className="bp-focus hover:text-bp-line">
              Comparing bids
            </a>
            <Link to="/signin" className="bp-focus hover:text-bp-line">
              Sign in
            </Link>
            {/* Secondary here so the hero keeps the only hazard fill above the fold. */}
            <ButtonLink to="/signin" variant="secondary" size="sm">
              Get started
            </ButtonLink>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="bp-grid border-b border-bp-ink">
          <div className="mx-auto grid max-w-[1280px] gap-x-10 gap-y-14 px-5 py-14 lg:grid-cols-12 lg:px-8 lg:py-20">
            <div className="lg:col-span-5">
              <p className="bp-anno m-0 text-[10px] text-bp-line">
                Sourcing for warehousing and logistics
              </p>

              <h1 className="bp-display m-0 mt-5 text-[clamp(2.75rem,6.5vw,4.75rem)]">
                Draw up the work.
                <br />
                Put it out to bid.
              </h1>

              <p className="bp-body m-0 mt-7 max-w-[50ch] text-[1.05rem] text-bp-ink/85">
                Quote Depot issues every request as a sheet: fixed fields, one
                public link, one revision history. Vendors price the same
                drawing, so the tabulation is straight across before anyone
                opens a spreadsheet.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-5">
                <ButtonLink to="/signin" variant="primary" size="lg">
                  Raise your first request
                </ButtonLink>
                <a
                  href="#tabulation"
                  className="bp-anno bp-focus text-[10px] text-bp-line underline decoration-dotted underline-offset-4 hover:text-bp-ink"
                >
                  See a tabulation ↓
                </a>
              </div>

              <p className="bp-body m-0 mt-6 max-w-[46ch] text-xs text-bp-graphite">
                Vendors do not need an account. They bid from the link you send
                them.
              </p>
            </div>

            <div className="lg:col-span-7">
              <WorkOrderSheet />
            </div>
          </div>
        </section>

        {/* The thesis, on the one reversed field the page gets. */}
        <section id="tabulation" className="bg-bp-deep text-bp-vellum">
          <div className="mx-auto max-w-[1280px] px-5 py-14 lg:px-8 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-bp-line/40 pb-4">
              <h2 className="bp-display m-0 text-[clamp(1.75rem,3.5vw,2.5rem)] text-bp-vellum">
                The lowest rate is not the cheapest bid
              </h2>
              <p className="bp-anno m-0 text-[9px] text-bp-line">
                {sampleRequest.reference} · extended against{" "}
                {REQUIRED_POSITIONS.toLocaleString()} positions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="bp-anno text-[9px] text-bp-line">
                    <th scope="col" className="py-3 pr-4 font-medium">
                      Vendor
                    </th>
                    <th scope="col" className="py-3 pr-4 text-right font-medium">
                      Rate $/plt/mo
                    </th>
                    <th scope="col" className="py-3 pr-4 text-right font-medium">
                      Positions
                    </th>
                    <th scope="col" className="py-3 pr-4 text-right font-medium">
                      Ext. monthly
                    </th>
                    <th scope="col" className="py-3 font-medium">
                      Flag
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sampleBids.map((bid) => {
                    const short = REQUIRED_POSITIONS - bid.positions;
                    return (
                      <tr
                        key={bid.id}
                        className="border-t border-bp-line/25 align-baseline"
                      >
                        <td className="py-4 pr-4">
                          <span className="bp-display block text-lg text-bp-vellum">
                            {bid.vendor}
                          </span>
                          <span className="bp-anno block text-[8px] text-bp-line">
                            {bid.city}
                          </span>
                        </td>
                        <td className="bp-data py-4 pr-4 text-right text-lg text-bp-vellum">
                          {formatRate(bid.rate)}
                        </td>
                        <td className="bp-data py-4 pr-4 text-right text-sm text-bp-vellum/80">
                          {bid.positions.toLocaleString()}
                        </td>
                        <td className="bp-data py-4 pr-4 text-right text-lg text-bp-vellum">
                          {money.format(bid.rate * bid.positions)}
                        </td>
                        <td className="py-4">
                          {short > 0 || !bid.compliant ? (
                            <span className="bp-anno text-[8px] text-bp-flag">
                              {!bid.compliant ? "No COI" : ""}
                              {short > 0 ? ` ${short} short` : ""}
                            </span>
                          ) : (
                            <span className="bp-anno text-[8px] text-bp-line">
                              Compliant
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="bp-body m-0 mt-6 max-w-[62ch] text-sm text-bp-vellum/70">
              Truckee posts the lowest rate on the sheet and the highest risk:
              300 positions short, a 31 day lead, and no certificate of
              insurance on file. The tabulation says so before you call them.
            </p>
          </div>
        </section>

        {/* A real sequence, so it gets operation numbers. */}
        <section id="routing" className="bp-grid border-b border-bp-ink">
          <div className="mx-auto max-w-[1280px] px-5 py-14 lg:px-8 lg:py-20">
            <h2 className="bp-anno m-0 text-[10px] text-bp-line">
              Process routing
            </h2>
            <div className="mt-8 grid gap-px border border-bp-ink bg-bp-ink md:grid-cols-4">
              {workflow.map((item, index) => (
                <article key={item.step} className="bg-bp-vellum p-5">
                  <p className="bp-anno m-0 text-[9px] text-bp-graphite">
                    Op {(index + 1) * 10}
                  </p>
                  <h3 className="bp-display m-0 mt-3 text-2xl">{item.step}</h3>
                  <p className="bp-body m-0 mt-2.5 text-sm text-bp-graphite">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 lg:grid-cols-12 lg:px-8 lg:py-20">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="bp-display m-0 text-[clamp(1.75rem,3.5vw,2.5rem)]">
                Bill of services
              </h2>
              <p className="bp-anno m-0 text-[9px] text-bp-graphite">
                Vendors active this month
              </p>
            </div>

            <table className="mt-6 w-full border-collapse text-left">
              <thead>
                <tr className="bp-anno border-b border-bp-ink text-[9px] text-bp-graphite">
                  <th scope="col" className="w-20 py-2.5 font-medium">
                    Item
                  </th>
                  <th scope="col" className="py-2.5 font-medium">
                    Service
                  </th>
                  <th scope="col" className="py-2.5 text-right font-medium">
                    Qty
                  </th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((line, index) => (
                  <tr
                    key={line.service}
                    className="border-b border-bp-line/25 transition-colors duration-150 hover:bg-bp-line/8"
                  >
                    <td className="bp-data py-3.5 text-xs text-bp-line">
                      {String((index + 1) * 5).padStart(3, "0")}
                    </td>
                    <td className="bp-body py-3.5 text-[0.95rem]">
                      {line.service}
                    </td>
                    <td className="bp-data py-3.5 text-right text-[0.95rem]">
                      {line.vendors}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="lg:col-span-5">
            <figure className="m-0 border border-bp-ink bg-bp-sheet p-6">
              <blockquote className="bp-body m-0 text-[1.05rem] leading-relaxed text-bp-ink">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="bp-anno mt-5 text-[9px] text-bp-graphite">
                {testimonial.name} — {testimonial.role}
              </figcaption>
            </figure>
          </aside>
        </section>

        <section className="bg-bp-ink">
          <div className="bp-hazard-tape h-2.5" aria-hidden="true" />
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-8 px-5 py-14 lg:px-8 lg:py-16">
            <h2 className="bp-display m-0 max-w-[18ch] text-[clamp(2rem,4.5vw,3.25rem)] text-bp-vellum">
              Issue your first sheet for pricing.
            </h2>
            <ButtonLink
              to="/signin"
              variant="primary"
              size="lg"
              className="border-bp-hazard hover:shadow-[3px_3px_0_0_var(--color-bp-vellum)]"
            >
              Get started
            </ButtonLink>
          </div>
          <div className="bp-hazard-tape h-2.5" aria-hidden="true" />
        </section>
      </main>

      <footer className="mx-auto max-w-[1280px] px-5 py-10 lg:px-8">
        <div className="grid gap-px border border-bp-ink bg-bp-ink sm:grid-cols-4">
          {[
            ["Project", "Quote Depot"],
            ["Sheet", "Product landing"],
            ["Title", "Industrial blueprint"],
            ["Set in", "Saira Condensed / IBM Plex"],
          ].map(([term, value]) => (
            <div key={term} className="bg-bp-vellum px-3 py-2.5">
              <p className="bp-anno m-0 text-[8px] text-bp-graphite">{term}</p>
              <p className="bp-data m-0 mt-1 text-[11px]">{value}</p>
            </div>
          ))}
        </div>

        <p className="bp-anno m-0 mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[8px] text-bp-graphite">
          <span>Design explorations</span>
          <Link to="/1" className="bp-focus hover:text-bp-line">
            01 Swiss editorial
          </Link>
          <Link to="/2" className="bp-focus hover:text-bp-line">
            02 Industrial blueprint
          </Link>
          <Link to="/3" className="bp-focus hover:text-bp-line">
            03 Neomorphic canvas
          </Link>
        </p>
      </footer>
    </div>
  );
}
