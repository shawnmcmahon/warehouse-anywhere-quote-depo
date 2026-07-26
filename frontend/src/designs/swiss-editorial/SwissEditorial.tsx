import { Link } from "react-router";
import { TenderSheet } from "./TenderSheet";
import { coverage, sampleRequest, testimonial, workflow } from "../content";

export default function SwissEditorial() {
  return (
    <div className="theme-swiss min-h-screen bg-swiss-paper text-swiss-ink antialiased">
      <a
        href="#main"
        className="swiss-label sr-only rounded-none focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-swiss-ink focus:px-4 focus:py-2 focus:text-[10px] focus:text-white"
      >
        Skip to content
      </a>

      <header className="border-b border-swiss-rule">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-6 py-4 lg:px-10">
          <p className="swiss-display m-0 text-lg tracking-[0.02em]">
            Quote&nbsp;Depot
          </p>
          <nav className="flex items-baseline gap-6">
            <span className="swiss-label text-[10px] text-swiss-ink">
              01 — Swiss editorial
            </span>
            <Link
              to="/2"
              className="swiss-label text-[10px] text-swiss-graphite underline-offset-4 hover:text-swiss-signal hover:underline"
            >
              02
            </Link>
            <Link
              to="/3"
              className="swiss-label text-[10px] text-swiss-graphite underline-offset-4 hover:text-swiss-signal hover:underline"
            >
              03
            </Link>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* Hero — the thesis is the sheet itself, not a slogan. */}
        <section className="mx-auto max-w-[1240px] px-6 pb-20 pt-14 lg:px-10 lg:pb-28 lg:pt-24">
          <div className="grid gap-x-10 gap-y-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="swiss-label m-0 flex items-center gap-3 text-[10px] text-swiss-signal">
                <span className="inline-block h-2 w-2 bg-swiss-signal" />
                Request for quote — {sampleRequest.region}
              </p>

              <h1 className="swiss-display m-0 mt-7 text-[clamp(3rem,7.5vw,5.25rem)]">
                Every bid
                <br />
                on one page,
                <br />
                in one unit.
              </h1>

              <p className="swiss-read m-0 mt-8 max-w-[46ch] text-[clamp(1.05rem,1.4vw,1.2rem)] text-swiss-ink/85">
                Post the warehouse work you need done. Quote Depot gives the
                request one public link and holds every vendor to the same
                fields — rate, unit, positions, start date — so you spend your
                morning comparing bids instead of decoding them.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/"
                  className="swiss-label bg-swiss-ink px-7 py-4 text-[10px] text-white transition-colors duration-200 hover:bg-swiss-signal focus:outline-none focus-visible:ring-2 focus-visible:ring-swiss-signal focus-visible:ring-offset-2 focus-visible:ring-offset-swiss-paper"
                >
                  Post a request
                </Link>
                <a
                  href="#sheet"
                  className="swiss-label border-b border-swiss-ink pb-1 text-[10px] text-swiss-ink transition-colors duration-200 hover:border-swiss-signal hover:text-swiss-signal focus:outline-none focus-visible:ring-2 focus-visible:ring-swiss-signal"
                >
                  Read a live sheet
                </a>
              </div>

              <p className="swiss-label m-0 mt-8 text-[10px] text-swiss-graphite">
                Vendors bid without an account
              </p>
            </div>

            <div id="sheet" className="lg:col-span-6 lg:col-start-7">
              <TenderSheet />
            </div>
          </div>
        </section>

        {/* A genuine sequence, so the numbering earns its place. */}
        <section className="border-t border-swiss-ink bg-swiss-stock">
          <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-24">
            <h2 className="swiss-label m-0 text-[10px] text-swiss-graphite">
              From posted to awarded
            </h2>
            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {workflow.map((item, index) => (
                <article
                  key={item.step}
                  className="border-t-2 border-swiss-ink pt-5"
                >
                  <p className="swiss-figure m-0 text-4xl text-swiss-signal">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="swiss-display m-0 mt-4 text-2xl">
                    {item.step}
                  </h3>
                  <p className="swiss-read m-0 mt-3 text-[1rem] text-swiss-graphite">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Editorial pacing beat: one full-bleed statement, nothing else. */}
        <section className="bg-swiss-signal text-white">
          <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10 lg:py-28">
            <blockquote className="m-0 grid gap-x-10 gap-y-8 lg:grid-cols-12">
              <p className="swiss-read m-0 text-[clamp(1.6rem,3.6vw,2.6rem)] leading-[1.25] lg:col-span-9">
                “{testimonial.quote}”
              </p>
              <footer className="lg:col-span-3">
                <p className="swiss-label m-0 text-[10px] text-white">
                  {testimonial.name}
                </p>
                <p className="swiss-read m-0 mt-2 text-[0.95rem] text-white/75">
                  {testimonial.role}
                </p>
              </footer>
            </blockquote>
          </div>
        </section>

        {/* Coverage set as a magazine index — the leader dots carry real data. */}
        <section className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-swiss-ink pb-4">
            <h2 className="swiss-display m-0 text-[clamp(1.75rem,3vw,2.5rem)]">
              Coverage index
            </h2>
            <p className="swiss-label m-0 text-[10px] text-swiss-graphite">
              Vendors quoting this month
            </p>
          </div>

          <dl className="m-0 mt-2 grid gap-x-16 md:grid-cols-2">
            {coverage.map((line) => (
              <div
                key={line.service}
                className="flex items-baseline gap-3 border-b border-swiss-rule py-5"
              >
                <dt className="swiss-display m-0 text-[1.15rem]">
                  {line.service}
                </dt>
                <span className="swiss-leader" aria-hidden="true" />
                <dd className="swiss-figure tabular m-0 text-[1.15rem] text-swiss-graphite">
                  {line.vendors}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-t border-swiss-ink bg-swiss-stock">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-8 px-6 py-16 lg:px-10 lg:py-24">
            <h2 className="swiss-display m-0 max-w-[16ch] text-[clamp(2.25rem,5vw,3.75rem)]">
              Put your next request on the sheet.
            </h2>
            <Link
              to="/"
              className="swiss-label bg-swiss-signal px-8 py-4 text-[10px] text-white transition-colors duration-200 hover:bg-swiss-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-swiss-ink focus-visible:ring-offset-2 focus-visible:ring-offset-swiss-stock"
            >
              Post a request
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-swiss-rule">
        <div className="mx-auto grid max-w-[1240px] gap-4 px-6 py-8 sm:grid-cols-3 lg:px-10">
          <p className="swiss-label m-0 text-[10px] text-swiss-graphite">
            Quote Depot
          </p>
          <p className="swiss-label m-0 text-[10px] text-swiss-graphite sm:text-center">
            Exploration 01 — Premium Swiss editorial
          </p>
          <p className="swiss-label m-0 text-[10px] text-swiss-graphite sm:text-right">
            Archivo — Newsreader
          </p>
        </div>
      </footer>
    </div>
  );
}
