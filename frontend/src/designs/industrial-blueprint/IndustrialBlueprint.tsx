import { Link } from "react-router-dom";
import { WorkOrderSheet } from "./WorkOrderSheet";
import { coverage, formatRate, sampleBids, sampleRequest, workflow } from "../content";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const REQUIRED_POSITIONS = 1200;
const RECOMMENDED = "bid-sierra";

const revisions = [
  ["A", "2026-04-02", "Issued for pricing", "DW"],
  ["B", "2026-04-11", "Volume revised to 1,200 positions", "DW"],
  ["C", "2026-04-17", "Bid period extended to Friday", "DW"],
];

export default function IndustrialBlueprint() {
  return (
    <div className="theme-blueprint min-h-screen bg-bp-vellum text-bp-ink">
      <a
        href="#main"
        className="bp-anno sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-bp-ink focus:px-4 focus:py-2 focus:text-[10px] focus:text-bp-hazard"
      >
        Skip to content
      </a>

      {/* Sheet rail — the strip a plotter prints along the top edge. */}
      <header className="border-b border-bp-ink bg-bp-stock">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-2.5 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center border border-bp-ink bg-bp-ink text-[10px] font-bold text-bp-hazard">
              QD
            </span>
            <span className="bp-display text-base">Quote Depot</span>
          </div>
          <div className="bp-anno flex flex-wrap items-center gap-x-5 gap-y-1 text-[9px] text-bp-graphite">
            <span>{sampleRequest.reference}</span>
            <span className="hidden sm:inline">Rev C</span>
            <span className="flex items-center gap-1.5 text-bp-ink">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-bp-hazard ring-2 ring-bp-hazard/30" />
              Open for bid
            </span>
            <nav className="flex items-center gap-3">
              <Link to="/1" className="hover:text-bp-line">
                01
              </Link>
              <span className="text-bp-ink">02</span>
              <Link to="/3" className="hover:text-bp-line">
                03
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="bp-grid border-b border-bp-ink">
          <div className="mx-auto grid max-w-[1280px] gap-x-10 gap-y-14 px-5 py-14 lg:grid-cols-12 lg:px-8 lg:py-20">
            <div className="lg:col-span-5">
              <p className="bp-anno m-0 text-[10px] text-bp-line">
                Spec 01 — sourcing
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

              <dl className="m-0 mt-8 grid max-w-md grid-cols-1 gap-px border border-bp-ink bg-bp-ink sm:grid-cols-3">
                {[
                  ["Region", sampleRequest.region],
                  ["Term", sampleRequest.term],
                  ["Bid period", "Closes Fri 17:00 PT"],
                ].map(([term, value]) => (
                  <div key={term} className="bg-bp-vellum px-3 py-2.5">
                    <dt className="bp-anno m-0 text-[8px] text-bp-graphite">
                      {term}
                    </dt>
                    <dd className="bp-data m-0 mt-1 text-xs">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-9 flex flex-wrap items-center gap-5">
                <Link
                  to="/"
                  className="bp-anno border border-bp-ink bg-bp-hazard px-7 py-3.5 text-[10px] text-bp-ink transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-bp-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-bp-line focus-visible:ring-offset-2 focus-visible:ring-offset-bp-vellum"
                >
                  Raise a request
                </Link>
                <a
                  href="#tabulation"
                  className="bp-anno text-[10px] text-bp-line underline decoration-dotted underline-offset-4 hover:text-bp-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-bp-line"
                >
                  View tabulation ↓
                </a>
              </div>
            </div>

            <div className="lg:col-span-7">
              <WorkOrderSheet />
            </div>
          </div>
        </section>

        {/* Reversed field: the one place the sheet becomes a cyanotype. */}
        <section id="tabulation" className="bg-bp-deep text-bp-vellum">
          <div className="mx-auto max-w-[1280px] px-5 py-14 lg:px-8 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-bp-line/40 pb-4">
              <h2 className="bp-display m-0 text-[clamp(1.75rem,3.5vw,2.5rem)] text-bp-vellum">
                Bid tabulation
              </h2>
              <p className="bp-anno m-0 text-[9px] text-bp-line">
                Extended against {REQUIRED_POSITIONS.toLocaleString()} positions
                requested
              </p>
            </div>

            <div className="-mx-5 overflow-x-auto px-5 lg:mx-0 lg:px-0">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="bp-anno text-[9px] text-bp-line">
                    <th className="py-3 pr-4 font-medium">Item</th>
                    <th className="py-3 pr-4 font-medium">Vendor</th>
                    <th className="py-3 pr-4 text-right font-medium">
                      Rate $/plt/mo
                    </th>
                    <th className="py-3 pr-4 text-right font-medium">
                      Positions
                    </th>
                    <th className="py-3 pr-4 font-medium">Ready</th>
                    <th className="py-3 pr-4 text-right font-medium">
                      Ext. monthly
                    </th>
                    <th className="py-3 font-medium">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleBids.map((bid, index) => {
                    const recommended = bid.id === RECOMMENDED;
                    const short = REQUIRED_POSITIONS - bid.positions;
                    return (
                      <tr
                        key={bid.id}
                        className="border-t border-bp-line/25 align-baseline"
                      >
                        <td className="bp-data py-4 pr-4 text-xs text-bp-line">
                          <span className="flex items-center gap-2">
                            <span
                              className={`inline-block h-6 w-1 ${
                                recommended ? "bg-bp-hazard" : "bg-transparent"
                              }`}
                            />
                            {String((index + 1) * 10).padStart(3, "0")}
                          </span>
                        </td>
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
                        <td className="bp-data py-4 pr-4 text-sm text-bp-vellum/80">
                          {bid.readyOn}
                        </td>
                        <td className="bp-data py-4 pr-4 text-right text-lg text-bp-vellum">
                          {money.format(bid.rate * bid.positions)}
                        </td>
                        <td className="py-4">
                          {recommended ? (
                            <span className="bp-anno bg-bp-hazard px-2 py-1 text-[8px] text-bp-ink">
                              Recommend
                            </span>
                          ) : short > 0 || !bid.compliant ? (
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
              Truckee Freight Works posts the lowest rate on the sheet and the
              highest risk: 300 positions short, a 31 day lead, and no
              certificate of insurance on file. The tabulation says so before
              you call them.
            </p>
          </div>
        </section>

        {/* Operation numbers, because a routing is exactly what this is. */}
        <section className="bp-grid border-b border-bp-ink">
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

        <section className="mx-auto max-w-[1280px] px-5 py-14 lg:px-8 lg:py-20">
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
                <th className="w-20 py-2.5 font-medium">Item</th>
                <th className="py-2.5 font-medium">Service</th>
                <th className="py-2.5 text-right font-medium">Qty</th>
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
        </section>

        <section className="bg-bp-ink">
          <div className="bp-hazard-tape h-2.5" aria-hidden="true" />
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-8 px-5 py-14 lg:px-8 lg:py-16">
            <h2 className="bp-display m-0 max-w-[18ch] text-[clamp(2rem,4.5vw,3.25rem)] text-bp-vellum">
              Issue your first sheet for pricing.
            </h2>
            <Link
              to="/"
              className="bp-anno border border-bp-hazard bg-bp-hazard px-8 py-4 text-[10px] text-bp-ink transition-colors duration-150 hover:bg-bp-ink hover:text-bp-hazard focus:outline-none focus-visible:ring-2 focus-visible:ring-bp-vellum focus-visible:ring-offset-2 focus-visible:ring-offset-bp-ink"
            >
              Raise a request
            </Link>
          </div>
          <div className="bp-hazard-tape h-2.5" aria-hidden="true" />
        </section>
      </main>

      {/* Footer is the drawing's title block, revision table and all. */}
      <footer className="mx-auto max-w-[1280px] px-5 py-10 lg:px-8">
        <table className="w-full border-collapse border border-bp-ink text-left">
          <caption className="bp-anno mb-2 text-left text-[9px] text-bp-graphite">
            Revision history
          </caption>
          <thead>
            <tr className="bp-anno border-b border-bp-ink text-[8px] text-bp-graphite">
              <th className="w-16 px-3 py-2 font-medium">Rev</th>
              <th className="w-32 px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="w-16 px-3 py-2 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {revisions.map((row) => (
              <tr key={row[0]} className="border-b border-bp-line/25 last:border-b-0">
                {row.map((cell, index) => (
                  <td
                    key={index}
                    className="bp-data px-3 py-2 text-[11px] text-bp-graphite"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 grid gap-px border border-bp-ink bg-bp-ink sm:grid-cols-4">
          {[
            ["Project", "Quote Depot"],
            ["Sheet", "Exploration 02"],
            ["Title", "Industrial blueprint"],
            ["Set in", "Saira Condensed / IBM Plex"],
          ].map(([term, value]) => (
            <div key={term} className="bg-bp-vellum px-3 py-2.5">
              <p className="bp-anno m-0 text-[8px] text-bp-graphite">{term}</p>
              <p className="bp-data m-0 mt-1 text-[11px]">{value}</p>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
