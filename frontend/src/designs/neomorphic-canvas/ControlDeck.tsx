import { useState } from "react";
import { formatRate, sampleBids } from "../content";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** The three ways a warehouse actually wants to read the same rate. */
const views = [
  { id: "weekly", label: "Weekly", factor: 1 / 4.33, caption: "Per week" },
  { id: "monthly", label: "Monthly", factor: 1, caption: "Per month" },
  { id: "term", label: "Full term", factor: 6, caption: "Six month term" },
] as const;

/**
 * The signature element for /3.
 *
 * A working console rather than a picture of one. Each bid is a key with real
 * press travel, the recessed screen is the only lit surface on the panel, and
 * the term switch below re-reads the same rate the three ways a distribution
 * manager needs it.
 */
export function ControlDeck() {
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState(1);
  const bid = sampleBids[selected];
  const mode = views[view];
  const extended = bid.rate * bid.positions * mode.factor;

  return (
    <section
      aria-label="Bid selector"
      className="deck-raised rounded-[32px] p-6 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <p className="deck-engrave m-0 text-[10px]">Bid select</p>
        <p className="deck-engrave m-0 flex items-center gap-2 text-[10px]">
          <span className="inline-block h-2 w-2 rounded-full bg-deck-live shadow-[0_0_10px_rgba(47,169,107,0.8)]" />
          Live
        </p>
      </div>

      {/* Recessed display */}
      <div className="deck-screen mt-4 rounded-2xl px-5 py-6 sm:px-7 sm:py-7">
        <p className="deck-engrave m-0 text-[10px] text-white/40 [text-shadow:none]">
          {bid.vendor} — {bid.city}
        </p>

        <p className="deck-readout deck-lit m-0 mt-4 text-[clamp(2.75rem,7vw,4rem)] font-medium leading-none">
          <span className="align-top text-[0.4em] opacity-70">$</span>
          {formatRate(bid.rate)}
        </p>
        <p className="deck-engrave m-0 mt-2 text-[10px] text-white/45 [text-shadow:none]">
          {bid.unit}
        </p>

        <dl className="m-0 mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
          {[
            [mode.caption, money.format(extended)],
            ["Positions", bid.positions.toLocaleString()],
            ["Ready", bid.readyOn],
          ].map(([term, value]) => (
            <div key={term}>
              <dt className="deck-engrave m-0 text-[9px] text-white/35 [text-shadow:none]">
                {term}
              </dt>
              <dd className="deck-readout m-0 mt-1.5 text-sm text-white/85">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Keys */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {sampleBids.map((entry, index) => {
          const isOn = index === selected;
          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={isOn}
              onClick={() => setSelected(index)}
              className={`rounded-2xl px-4 py-4 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-deck-amber focus-visible:ring-offset-2 focus-visible:ring-offset-deck-housing ${
                isOn
                  ? "deck-pressed"
                  : "deck-raised-sm deck-travel hover:-translate-y-0.5"
              }`}
            >
              <span className="deck-engrave block text-[9px]">
                {isOn ? "Selected" : `Bid 0${index + 1}`}
              </span>
              <span
                className={`deck-display mt-2 block text-[0.95rem] ${
                  isOn ? "text-deck-ink" : "text-deck-muted"
                }`}
              >
                {entry.vendor}
              </span>
              <span className="deck-readout mt-1.5 block text-xs text-deck-muted">
                {formatRate(entry.rate)} — {entry.leadTime} lead
              </span>
            </button>
          );
        })}
      </div>

      {/* Term switch, sunk into the panel */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="deck-engrave m-0 text-[10px]">Read rate as</p>
        <div className="deck-well flex gap-1 rounded-full p-1.5">
          {views.map((option, index) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={index === view}
              onClick={() => setView(index)}
              className={`deck-engrave rounded-full px-4 py-2 text-[9px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-deck-amber ${
                index === view
                  ? "deck-raised-sm text-deck-ink"
                  : "text-deck-muted hover:text-deck-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className="deck-body m-0 mt-6 text-sm text-deck-muted">{bid.note}</p>
    </section>
  );
}
