import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, ButtonLink } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { TitleBlock } from "../ui/TitleBlock";
import { SelectField, TextAreaField, TextField } from "../ui/Field";
import { RequestStatusBadge } from "../ui/StatusBadge";
import { EmptyState } from "../ui/States";
import { day } from "../lib/format";
import { requests } from "../lib/fixtures";

/**
 * The guest bid form.
 *
 * This is the only screen a vendor sees, and they arrive from a link with no
 * account and no context, so the sheet they are pricing sits beside the form
 * the whole way down rather than above it. No organization branding is shown
 * because the public endpoint does not return the organization.
 */

const UNIT_OPTIONS = [
  { value: "Monthly", label: "Per month" },
  { value: "Weekly", label: "Per week" },
  { value: "OneTime", label: "One time" },
];

function GuestFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bp-vellum text-bp-ink">
      <a
        href="#main"
        className="bp-anno sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-bp-ink focus:px-4 focus:py-2 focus:text-[10px] focus:text-bp-hazard"
      >
        Skip to content
      </a>

      <header className="border-b border-bp-ink bg-bp-stock">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-2.5 lg:px-8">
          <Link to="/" className="bp-focus flex items-center gap-3 no-underline">
            <span className="flex h-6 w-6 items-center justify-center border border-bp-ink bg-bp-ink text-[10px] font-bold text-bp-hazard">
              QD
            </span>
            <span className="bp-display text-base text-bp-ink">Quote Depot</span>
          </Link>
          <span className="bp-anno text-[9px] text-bp-graphite">
            Bidding — no account needed
          </span>
        </div>
      </header>

      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[1120px] px-5 py-10 lg:px-8 lg:py-14">
          {children}
        </div>
      </main>

      <footer className="mt-auto border-t border-bp-ink bg-bp-stock">
        <div className="bp-anno mx-auto max-w-[1120px] px-5 py-3 text-[8px] text-bp-graphite lg:px-8">
          Quote Depot — requests are issued as fixed sheets so every bid prices
          the same work.
        </div>
      </footer>
    </div>
  );
}

export default function PublicQuote() {
  const { slug = "" } = useParams<{ slug: string }>();
  const request = requests.find((item) => item.publicSlug === slug);
  const [submitted, setSubmitted] = useState(false);

  if (!request) {
    return (
      <GuestFrame>
        <EmptyState
          title="This link is not live"
          body="The request may have been withdrawn, or the link may be mistyped. Check with whoever sent it to you."
        />
      </GuestFrame>
    );
  }

  const acceptingQuotes = request.status === "Open";

  if (submitted) {
    return (
      <GuestFrame>
        <div className="max-w-[62ch]">
          <p className="bp-anno m-0 text-[10px] text-bp-approve">Bid received</p>
          <h1 className="bp-display m-0 mt-4 text-[clamp(2rem,5vw,3rem)]">
            Your bid is on the sheet.
          </h1>
          <p className="bp-body m-0 mt-5 text-base text-bp-graphite">
            It has been logged against “{request.title}” and now sits with the
            buyer alongside every other bid. They will contact you on the
            details you gave if they move it forward.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/signin" variant="primary" size="lg">
              Sign in to track it
            </ButtonLink>
            <Button
              variant="quiet"
              size="lg"
              onClick={() => setSubmitted(false)}
            >
              Submit another bid
            </Button>
          </div>
        </div>
      </GuestFrame>
    );
  }

  return (
    <GuestFrame>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        {/* What you are pricing. */}
        <div className="lg:col-span-5">
          <p className="bp-anno m-0 text-[10px] text-bp-line">
            Request for quote
          </p>
          <h1 className="bp-display m-0 mt-4 text-[clamp(1.9rem,4.5vw,2.75rem)]">
            {request.title}
          </h1>

          {request.description ? (
            <p className="bp-body m-0 mt-5 max-w-[52ch] text-base text-bp-ink/85">
              {request.description}
            </p>
          ) : null}

          <TitleBlock
            className="mt-7"
            columns={2}
            cells={[
              {
                term: "Status",
                value: <RequestStatusBadge status={request.status} dot />,
              },
              { term: "Issued", value: day(request.createdAt) },
            ]}
          />

          <p className="bp-body m-0 mt-6 max-w-[52ch] text-sm text-bp-graphite">
            Everyone bidding sees exactly these fields, so price the work as
            described. If something is missing, say so in your notes rather
            than assuming.
          </p>
        </div>

        {/* The bid. */}
        <div className="lg:col-span-7">
          {!acceptingQuotes ? (
            <EmptyState
              title="This request is closed to new bids"
              body="The buyer has stopped accepting submissions on this sheet. If you were asked to bid, contact them directly."
            />
          ) : (
            <Panel title="Submit a bid" annotation="Takes about a minute">
              <form
                className="flex flex-col gap-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSubmitted(true);
                }}
              >
                <TextField
                  label="Business name"
                  name="businessName"
                  required
                  placeholder="Sierra Warehousing"
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label="Rate"
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    required
                    figure
                    placeholder="8.40"
                    hint="In US dollars."
                  />
                  <SelectField
                    label="Charged"
                    name="unit"
                    options={UNIT_OPTIONS}
                    defaultValue="Monthly"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label="Can start"
                    name="startAt"
                    type="date"
                    optional
                    figure
                    hint="Earliest date you can take the work."
                  />
                  <TextField
                    label="Can hold until"
                    name="endAt"
                    type="date"
                    optional
                    figure
                    hint="How long the rate stands."
                  />
                </div>

                <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
                  <legend className="bp-anno mb-3 p-0 text-[9px] text-bp-line">
                    Who to contact
                  </legend>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      label="Name"
                      name="contactName"
                      required
                      placeholder="Marisol Vega"
                    />
                    <TextField
                      label="Phone"
                      name="contactPhone"
                      type="tel"
                      optional
                      figure
                      placeholder="+1 775 555 0142"
                    />
                  </div>
                  <TextField
                    label="Email"
                    name="contactEmail"
                    type="email"
                    required
                    placeholder="mvega@sierrawarehousing.com"
                  />
                </fieldset>

                <TextAreaField
                  label="Notes"
                  name="notes"
                  optional
                  rows={4}
                  placeholder="Capacity available, lead time, certificates on file, anything the buyer should weigh."
                  hint="This is where a good bid separates itself from a cheap one."
                />

                <div className="flex flex-wrap items-center gap-4">
                  <Button type="submit" variant="primary" size="lg">
                    Submit bid
                  </Button>
                  <p className="bp-body m-0 text-xs text-bp-graphite">
                    No account required.{" "}
                    <Link
                      to="/signin"
                      className="bp-focus text-bp-line underline decoration-dotted underline-offset-4"
                    >
                      Sign in
                    </Link>{" "}
                    first if you want to track it.
                  </p>
                </div>
              </form>
            </Panel>
          )}
        </div>
      </div>
    </GuestFrame>
  );
}
