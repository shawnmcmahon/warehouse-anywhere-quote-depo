import { useState } from "react";
import { formatRate, sampleBids, sampleRequest } from "../content";

const REQUIRED_POSITIONS = 1200;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * The signature element for /1.
 *
 * A rate table set like a page of a financial magazine. Reading a row brings
 * it to full ink and drops the others back, and the awarded figure at the
 * foot recalculates — which is how you find out that the lowest rate on the
 * sheet is not the cheapest bid on the sheet.
 */
export function TenderSheet() {
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const active = preview ?? selected;
  const bid = sampleBids[active];

  const extended = bid.rate * bid.positions;
  const shortfall = REQUIRED_POSITIONS - bid.positions;

  return (
    <figure className="m-0 border-t-2 border-swiss-ink bg-swiss-paper">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
        <span className="swiss-label text-[10px] text-swiss-ink">
          Tender sheet
        </span>
        <span className="swiss-label text-[10px] text-swiss-graphite">
          {sampleRequest.reference} — {sampleBids.length} bids
        </span>
      </figcaption>

      <ul className="list-none border-t border-swiss-rule p-0">
        {sampleBids.map((entry, index) => {
          const isActive = index === active;
          return (
            <li key={entry.id} className="border-b border-swiss-rule">
              <button
                type="button"
                aria-pressed={index === selected}
                onClick={() => setSelected(index)}
                onMouseEnter={() => setPreview(index)}
                onMouseLeave={() => setPreview(null)}
                onFocus={() => setPreview(index)}
                onBlur={() => setPreview(null)}
                className={`grid w-full grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 px-1 py-5 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-swiss-signal ${
                  isActive ? "text-swiss-ink" : "text-swiss-graphite"
                }`}
              >
                <span className="swiss-display flex items-baseline gap-3 text-[clamp(1.35rem,2.4vw,1.75rem)]">
                  <span
                    aria-hidden="true"
                    className={`inline-block h-2 w-2 shrink-0 transition-colors duration-200 ${
                      isActive ? "bg-swiss-signal" : "bg-transparent"
                    }`}
                  />
                  {entry.vendor}
                </span>
                <span className="swiss-figure text-[clamp(2rem,4vw,2.75rem)] leading-none">
                  <span className="align-super text-[0.45em] opacity-60">$</span>
                  {formatRate(entry.rate)}
                </span>

                <span className="swiss-label text-[10px] text-swiss-graphite">
                  {entry.city} — ready {entry.readyOn}
                </span>
                <span className="swiss-label text-[10px] text-swiss-graphite">
                  {entry.positions.toLocaleString()} positions
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-px flex flex-wrap items-end justify-between gap-x-8 gap-y-4 bg-swiss-signal px-5 py-6 text-white sm:-mr-6 lg:-mr-10">
        <div>
          <p className="swiss-label m-0 text-[10px] text-white/70">
            Extended monthly, as bid
          </p>
          <p className="swiss-display m-0 mt-2 text-[clamp(1.5rem,3vw,2rem)]">
            {bid.vendor}
          </p>
        </div>
        <div className="text-right">
          <p className="swiss-figure m-0 text-[clamp(2.25rem,5vw,3.25rem)] leading-none">
            {money.format(extended)}
          </p>
          <p className="swiss-label m-0 mt-2 text-[10px] text-white/70">
            {shortfall > 0
              ? `${shortfall.toLocaleString()} positions short`
              : "Full volume covered"}
          </p>
        </div>
      </div>

      <p className="swiss-read m-0 mt-5 max-w-prose text-[0.95rem] text-swiss-graphite">
        {bid.note}
      </p>
    </figure>
  );
}
