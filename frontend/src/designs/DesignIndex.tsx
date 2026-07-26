import { Link } from "react-router-dom";

const explorations = [
  {
    to: "/1",
    number: "01",
    name: "Premium Swiss Editorial",
    signature: "The tender sheet",
    summary:
      "Cool paper stock, wide Archivo headlines, Newsreader body. Bids set as an editorial rate table where reading a row recalculates the extended monthly.",
  },
  {
    to: "/2",
    number: "02",
    name: "Industrial Blueprint",
    signature: "The work order",
    summary:
      "Drafting vellum over a construction grid. The request is drawn to scale, dimensioned and called out, and the tabulation runs on a reversed cyanotype field.",
  },
  {
    to: "/3",
    number: "03",
    name: "Neomorphic Canvas",
    signature: "The bid deck",
    summary:
      "Moulded equipment housing with engraved legends. Each bid is a key with press travel; the recessed screen is the only lit surface on the panel.",
  },
];

/** Scaffolding for the design phase — replaced by the real landing page. */
export default function DesignIndex() {
  return (
    <main className="min-h-screen bg-neutral-100 px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-3xl">
        <p className="font-plex-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          Quote Depot — design explorations
        </p>
        <h1 className="mt-4 font-plex text-3xl font-semibold tracking-tight">
          Three directions for the same RFQ product
        </h1>
        <p className="mt-3 max-w-[60ch] font-plex text-neutral-600">
          Each route is a full landing composition built on the same request and
          the same three bids, so the only thing that changes between them is
          the design.
        </p>

        <ul className="mt-10 list-none space-y-4 p-0">
          {explorations.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex gap-5 rounded-xl border border-neutral-300 bg-white p-6 transition-colors duration-150 hover:border-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                <span className="font-plex-mono text-sm text-neutral-400">
                  {item.number}
                </span>
                <span>
                  <span className="block font-plex text-lg font-semibold">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block font-plex-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                    Signature — {item.signature}
                  </span>
                  <span className="mt-3 block font-plex text-sm text-neutral-600">
                    {item.summary}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
