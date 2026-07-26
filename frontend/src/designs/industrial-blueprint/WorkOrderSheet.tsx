import { sampleRequest } from "../content";

/** Registration ticks, as they appear on the corners of a plotted sheet. */
function CornerTicks() {
  const corner =
    "pointer-events-none absolute h-3 w-3 border-bp-line/60";
  return (
    <>
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
    </>
  );
}

/** Horizontal dimension: extension lines, arrowheads, dimension text. */
function DimensionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-bp-line" aria-hidden="true">
      <span className="h-3 w-px bg-current" />
      <span className="h-0 w-0 border-y-[3px] border-r-[6px] border-y-transparent border-r-current" />
      <span className="h-px flex-1 bg-current" />
      <span className="bp-anno whitespace-nowrap px-1 text-[9px] text-bp-graphite">
        {label}
      </span>
      <span className="h-px flex-1 bg-current" />
      <span className="h-0 w-0 border-y-[3px] border-l-[6px] border-y-transparent border-l-current" />
      <span className="h-3 w-px bg-current" />
    </div>
  );
}

const BANDS = [0, 1, 2];
const BAYS = 20;

const callouts = [
  { n: 1, top: "12%", left: "16%", text: "14 dock doors, 05:00–21:00 receiving" },
  { n: 2, top: "50%", left: "62%", text: "24 hour dwell, no temperature control" },
  { n: 3, top: "84%", left: "34%", text: "COI and W-9 on file before first receipt" },
];

/**
 * The signature element for /2.
 *
 * The request drawn the way a warehouse would actually draw it: a plan view of
 * the racking it needs, dimensioned, called out, and signed off in a title
 * block. One cell is ten pallet positions, so the drawing is to a real scale.
 */
export function WorkOrderSheet() {
  return (
    <figure className="relative m-0 border border-bp-ink bg-bp-vellum p-4 shadow-[6px_6px_0_0_rgba(22,30,36,0.09)] sm:p-6">
      <CornerTicks />

      <figcaption className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-bp-ink pb-3">
        <span className="bp-display text-lg">Plan view — requested racking</span>
        <span className="bp-anno text-[9px] text-bp-graphite">
          1 cell = 10 pallet positions
        </span>
      </figcaption>

      <DimensionRule label={`${BAYS} bays @ 8'-0"`} />

      <div className="mt-3 flex gap-3">
        <div
          className="bp-anno flex items-center justify-center text-[9px] text-bp-graphite"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          aria-hidden="true"
        >
          4 high
        </div>

        <div className="relative flex-1">
          {BANDS.map((band) => (
            <div key={band}>
              <div
                className="grid gap-px bg-bp-line/25"
                style={{ gridTemplateColumns: `repeat(${BAYS}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: BAYS * 2 }, (_, cell) => (
                  <span
                    key={cell}
                    className="aspect-square bg-bp-vellum"
                  />
                ))}
              </div>
              {band < BANDS.length - 1 && (
                <div className="flex items-center gap-2 py-2">
                  <span className="h-px flex-1 border-t border-dashed border-bp-line/50" />
                  <span className="bp-anno text-[8px] text-bp-line">
                    aisle 12'-0"
                  </span>
                  <span className="h-px flex-1 border-t border-dashed border-bp-line/50" />
                </div>
              )}
            </div>
          ))}

          {callouts.map((callout) => (
            <span
              key={callout.n}
              aria-hidden="true"
              className="bp-anno absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-bp-ink bg-bp-hazard text-[9px] leading-none tracking-normal text-bp-ink"
              style={{ top: callout.top, left: callout.left }}
            >
              {callout.n}
            </span>
          ))}
        </div>
      </div>

      <ol className="m-0 mt-6 list-none space-y-2 p-0">
        {callouts.map((callout) => (
          <li key={callout.n} className="flex items-start gap-3">
            <span className="bp-anno mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-bp-ink bg-bp-hazard text-[9px] leading-none tracking-normal text-bp-ink">
              {callout.n}
            </span>
            <span className="bp-body text-sm text-bp-ink">{callout.text}</span>
          </li>
        ))}
      </ol>

      <dl className="m-0 mt-6 grid grid-cols-2 gap-px border border-bp-ink bg-bp-ink sm:grid-cols-4">
        {[
          ["Drawn by", "D. Whitfield"],
          ["Volume", sampleRequest.volume],
          ["Sheet", "1 of 1"],
          ["Rev", "C — open for bid"],
        ].map(([term, value]) => (
          <div key={term} className="bg-bp-vellum px-3 py-2">
            <dt className="bp-anno m-0 text-[8px] text-bp-graphite">{term}</dt>
            <dd className="bp-data m-0 mt-1 text-xs text-bp-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
