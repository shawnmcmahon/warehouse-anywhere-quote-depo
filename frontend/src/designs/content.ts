/**
 * Shared domain language for the three design explorations.
 *
 * Every direction shows the same request and the same three bids so the
 * comparison between /1, /2 and /3 is purely about layout, type, colour and
 * the signature element — never about who got the better copy.
 */

export type SampleBid = {
  id: string;
  vendor: string;
  city: string;
  rate: number;
  unit: string;
  positions: number;
  dockDoors: number;
  readyOn: string;
  leadTime: string;
  note: string;
  compliant: boolean;
};

export const sampleRequest = {
  reference: "REQ-2026-0417",
  title: "Overflow pallet storage + weekly outbound",
  region: "Reno–Sparks, NV",
  volume: "1,200 pallet positions",
  term: "6 months, renewable",
  closes: "Closes Friday, 5:00 PM PT",
  brief:
    "Seasonal overflow off our Sparks DC. Standard 48×40 GMA pallets, four-high " +
    "racked, no temperature control. One outbound sweep per week to three retail DCs.",
} as const;

export const sampleBids: SampleBid[] = [
  {
    id: "bid-sierra",
    vendor: "Sierra Cross-Dock",
    city: "Sparks, NV",
    rate: 8.4,
    unit: "per pallet / month",
    positions: 1200,
    dockDoors: 14,
    readyOn: "Mar 3",
    leadTime: "9 days",
    note: "Racked space held on our floor through the close date.",
    compliant: true,
  },
  {
    id: "bid-basin",
    vendor: "Basin Logistics Co.",
    city: "Fernley, NV",
    rate: 9.15,
    unit: "per pallet / month",
    positions: 1200,
    dockDoors: 22,
    readyOn: "Feb 24",
    leadTime: "2 days",
    note: "Fastest start. Adds a $410 monthly outbound sweep.",
    compliant: true,
  },
  {
    id: "bid-truckee",
    vendor: "Truckee Freight Works",
    city: "Reno, NV",
    rate: 7.9,
    unit: "per pallet / month",
    positions: 900,
    dockDoors: 8,
    readyOn: "Mar 24",
    leadTime: "31 days",
    note: "Lowest rate, 300 positions short, and no COI on file yet.",
    compliant: false,
  },
];

/** The four states a request actually moves through — a real sequence. */
export const workflow = [
  {
    step: "Post",
    detail:
      "Describe the work in your own words. Pallet counts, dock hours, " +
      "temperature, whatever matters.",
  },
  {
    step: "Share",
    detail:
      "Every request gets one public link. Send it to vendors you already " +
      "use and to the ones you don't.",
  },
  {
    step: "Compare",
    detail:
      "Bids land on the same sheet in the same units, so the rate you read " +
      "is the rate you pay.",
  },
  {
    step: "Award",
    detail:
      "Accept one bid. Everything else is declined and the request closes " +
      "in the same click.",
  },
] as const;

/** Service lines, with live vendor coverage — an index, not decoration. */
export const coverage = [
  { service: "Overflow pallet storage", vendors: 214 },
  { service: "Cross-dock and transload", vendors: 168 },
  { service: "Temperature-controlled", vendors: 61 },
  { service: "Kitting and rework", vendors: 94 },
  { service: "Returns processing", vendors: 77 },
  { service: "Drayage and yard moves", vendors: 143 },
] as const;

export const testimonial = {
  quote:
    "Three vendors, three formats, three phone calls to figure out what a " +
    "pallet actually costs. Now it is one sheet and I award it before lunch.",
  name: "Dana Whitfield",
  role: "Distribution manager, Cascade Outdoor Supply",
} as const;

export function formatRate(rate: number): string {
  return rate.toFixed(2);
}
