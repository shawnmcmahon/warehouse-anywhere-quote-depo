# Design notes — Quote Depot explorations

Running record of the token plans behind `/1`, `/2` and `/3`, and of the moves
that were considered and dropped. Kept so later passes do not re-litigate
settled decisions or accidentally repeat a rejected one.

## The subject

An RFQ tool for warehousing and logistics work. The person on the screen is a
distribution manager sourcing overflow pallet storage, cross-dock, drayage or
returns processing; the people on the other end are 3PLs bidding for it. The
page has one job: convince that manager that posting a request here produces
bids they can read side by side.

Every direction is built from the same request (`REQ-2026-0417`, 1,200 pallet
positions in Reno–Sparks) and the same three bids, so the comparison between
routes is about design and nothing else. Shared copy lives in `content.ts`.

The one insight all three signatures dramatise: **the lowest rate on the sheet
is not the cheapest bid on the sheet.** Truckee posts $7.90 against Sierra's
$8.40 but is 300 positions short with no certificate of insurance, so the
extended figure tells a different story than the rate does.

## /1 — Premium Swiss Editorial

| Token | Value |
| --- | --- |
| Paper | `#F1F2EF` cool grey-green stock |
| Stock | `#E5E7E2` second surface |
| Ink | `#14171A` |
| Graphite | `#5B6167` |
| Rule | `#D1D5CD` |
| Signal | `#1B3BFF` ultramarine |

Display: Archivo run wide (`wdth 115`) at −0.035em. Body: Newsreader at 380
weight for the editorial beats. Utility: Archivo narrowed (`wdth 86`) in caps
at 10px.

Layout: strict 12 column, asymmetric 5/6 hero split, zero radius, generous
vertical rhythm. Signature: **the tender sheet** — bids set as a magazine rate
table where reading a row brings it to full ink, drops the others back to
graphite, and recalculates the ultramarine award block that bleeds out of the
column. The recessive state is a colour shift rather than an opacity fade so
the unread rows still clear AA.

Rejected: warm cream paper with a serif display and a terracotta accent, which
is where this brief wants to slide. Went cool and grey-green with a saturated
blue instead, and kept the serif to body copy only. Also rejected a dense
hairline-rule broadsheet grid — the whitespace and the big wide display type
are doing the Swiss work, not hairlines everywhere.

## /2 — Industrial Blueprint

| Token | Value |
| --- | --- |
| Vellum | `#E6E4DD` |
| Stock | `#DBD8CF` |
| Ink | `#161E24` |
| Line | `#2F6EA8` cyan setting-out |
| Hazard | `#FFC400` |
| Deep | `#0E1721` reversed field |

Display: Saira Condensed 700 uppercase. Body: IBM Plex Sans. Annotations and
all figures: IBM Plex Mono in caps at 0.14em.

Layout: 12px setting-out grid over a 96px construction grid, hard corners,
1px rules. Signature: **the work order** — the request drawn in plan view to a
stated scale (one cell = ten pallet positions), dimensioned with real extension
lines and arrowheads, numbered leader callouts, and a title block. The footer
is the drawing's revision table.

Rejected: the literal cyanotype, white lines on navy across the whole page. The
drafting *table* is more interesting than the print, so vellum carries the page
and the reversed field is used exactly once, for the tabulation. Hazard yellow
is limited to the single element that needs a decision — it marks the
recommended bid and the primary action, nothing else.

## /3 — Neomorphic Canvas

| Token | Value |
| --- | --- |
| Housing | `#DCDFDD` RAL 7035 polymer |
| Raised | `#E9ECE9` |
| Recess | `#C2C8C5` |
| Ink | `#1E2523` |
| Screen | `#141A18` |
| Amber | `#F2A413` |
| Live | `#2FA96B` |

Display and body: Manrope. Legends and readouts: DM Mono in caps, with a 1px
white text-shadow so they read as moulded into the housing.

Layout: continuous canvas, 24–32px radii, no borders anywhere — depth comes
only from paired shadows. Signature: **the bid deck** — keys with real press
travel, a genuinely dark recessed screen, and a term switch that re-reads the
same rate weekly, monthly, or across the full six month term.

Rejected: the dribbble version of this style, where controls are grey on grey
at 2:1 contrast. Grounding it in a dock leveller control box fixed that — the
screen is properly dark, the amber readout is the only lit surface, and every
control keeps a visible focus ring. Also cut a digit-roll animation on the
readout; the press physics is enough motion for one page.
