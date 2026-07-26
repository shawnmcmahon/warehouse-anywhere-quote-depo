import { Link } from "react-router";
import { ControlDeck } from "./ControlDeck";
import { coverage, sampleRequest, testimonial, workflow } from "../content";

const maxVendors = Math.max(...coverage.map((line) => line.vendors));

export default function NeomorphicCanvas() {
  return (
    <div className="theme-deck min-h-screen bg-deck-housing text-deck-ink">
      <a
        href="#main"
        className="deck-engrave sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-deck-screen focus:px-5 focus:py-2.5 focus:text-[10px] focus:text-deck-amber"
      >
        Skip to content
      </a>

      <header className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="deck-raised-sm flex h-10 w-10 items-center justify-center rounded-2xl">
            <span className="h-3 w-3 rounded-full bg-deck-amber shadow-[0_0_12px_rgba(242,164,19,0.7)]" />
          </span>
          <span className="deck-display text-lg">Quote Depot</span>
        </div>

        <nav className="deck-well flex items-center gap-1 rounded-full p-1.5">
          <Link
            to="/1"
            className="deck-engrave rounded-full px-4 py-2 text-[9px] hover:text-deck-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-deck-amber"
          >
            01
          </Link>
          <Link
            to="/2"
            className="deck-engrave rounded-full px-4 py-2 text-[9px] hover:text-deck-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-deck-amber"
          >
            02
          </Link>
          <span className="deck-raised-sm deck-engrave rounded-full px-4 py-2 text-[9px] text-deck-ink">
            03
          </span>
        </nav>
      </header>

      <main id="main">
        <section className="mx-auto grid max-w-[1200px] items-center gap-x-12 gap-y-14 px-5 pb-16 pt-8 lg:grid-cols-2 lg:px-8 lg:pb-24 lg:pt-12">
          <div>
            <p className="deck-engrave m-0 text-[10px]">
              {sampleRequest.reference} — {sampleRequest.region}
            </p>

            <h1 className="deck-display m-0 mt-6 text-[clamp(2.75rem,6vw,4.5rem)]">
              Read every bid
              <br />
              off one panel.
            </h1>

            <p className="deck-body m-0 mt-6 max-w-[48ch] text-[1.1rem] text-deck-muted">
              Quote Depot holds every vendor to the same fields, then puts the
              answers on a single console — same units, same volume, same start
              date. Press a bid to read it. Switch the term to see what it
              actually costs you.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/"
                className="deck-raised-sm deck-travel deck-display rounded-2xl px-8 py-4 text-sm transition-all duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-deck-amber focus-visible:ring-offset-2 focus-visible:ring-offset-deck-housing"
              >
                Start a request
              </Link>
              <span className="deck-engrave text-[10px]">
                Vendors bid without an account
              </span>
            </div>
          </div>

          <ControlDeck />
        </section>

        <section className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
          <h2 className="deck-engrave m-0 text-[10px]">From posted to awarded</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((item, index) => (
              <article
                key={item.step}
                className="deck-raised-sm rounded-3xl p-6"
              >
                <span className="deck-well deck-readout flex h-10 w-10 items-center justify-center rounded-full text-xs text-deck-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="deck-display m-0 mt-5 text-xl">{item.step}</h3>
                <p className="deck-body m-0 mt-2.5 text-sm text-deck-muted">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Coverage as panel meters: the track length is the actual figure. */}
        <section className="mx-auto max-w-[1200px] px-5 pb-16 lg:px-8 lg:pb-20">
          <div className="deck-raised rounded-[32px] p-6 sm:p-9">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="deck-display m-0 text-[clamp(1.5rem,3vw,2.1rem)]">
                Who is quoting right now
              </h2>
              <p className="deck-engrave m-0 text-[10px]">Vendors this month</p>
            </div>

            <ul className="m-0 mt-8 list-none space-y-5 p-0">
              {coverage.map((line) => (
                <li
                  key={line.service}
                  className="grid grid-cols-[1fr] items-center gap-x-5 gap-y-2 sm:grid-cols-[15rem_1fr_3rem]"
                >
                  <span className="deck-body text-[0.95rem] text-deck-ink">
                    {line.service}
                  </span>
                  <span className="deck-well h-2.5 overflow-hidden rounded-full">
                    <span
                      className="block h-full rounded-full bg-deck-amber shadow-[0_0_10px_rgba(242,164,19,0.45)]"
                      style={{
                        width: `${(line.vendors / maxVendors) * 100}%`,
                      }}
                    />
                  </span>
                  <span className="deck-readout text-right text-sm text-deck-muted">
                    {line.vendors}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-5 pb-16 lg:px-8 lg:pb-20">
          <blockquote className="deck-well m-0 rounded-[32px] px-7 py-10 sm:px-12 sm:py-14">
            <p className="deck-display m-0 max-w-[26ch] text-[clamp(1.35rem,3vw,2rem)] leading-[1.3]">
              {testimonial.quote}
            </p>
            <footer className="mt-7">
              <p className="deck-engrave m-0 text-[10px]">{testimonial.name}</p>
              <p className="deck-body m-0 mt-1.5 text-sm text-deck-muted">
                {testimonial.role}
              </p>
            </footer>
          </blockquote>
        </section>

        <section className="mx-auto max-w-[1200px] px-5 pb-20 lg:px-8">
          <Link
            to="/"
            className="deck-raised group flex flex-wrap items-center justify-between gap-6 rounded-[32px] px-8 py-12 transition-all duration-150 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-deck-amber focus-visible:ring-offset-4 focus-visible:ring-offset-deck-housing sm:px-14"
          >
            <span className="deck-display max-w-[16ch] text-[clamp(1.75rem,4vw,2.75rem)]">
              Put your next request on the panel.
            </span>
            <span className="deck-well deck-engrave flex items-center gap-3 rounded-full px-7 py-4 text-[10px] transition-colors duration-150 group-hover:text-deck-ink">
              Start a request
              <span aria-hidden="true">→</span>
            </span>
          </Link>
        </section>
      </main>

      <footer className="mx-auto max-w-[1200px] px-5 pb-10 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/60 pt-6">
          <p className="deck-engrave m-0 text-[10px]">Quote Depot</p>
          <p className="deck-engrave m-0 text-[10px]">
            Exploration 03 — Neomorphic canvas
          </p>
          <p className="deck-engrave m-0 text-[10px]">Manrope / DM Mono</p>
        </div>
      </footer>
    </div>
  );
}
