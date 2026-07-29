import { Fragment, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { PageHeader } from "../ui/PageHeader";
import { Button, ButtonLink } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { TitleBlock } from "../ui/TitleBlock";
import { EmptyState, Notice } from "../ui/States";
import { RequestStatusBadge } from "../ui/StatusBadge";
import { cx } from "../lib/cx";
import { day, money, publicRequestUrl, quoteStatusLabel, rate } from "../lib/format";
import { compareBids, formatMonths, isActive } from "../lib/quote-math";
import type { BidRow } from "../lib/quote-math";
import type { QuoteStatus } from "../lib/api-types";
import {
  QUOTE_TRANSITIONS,
  REQUEST_TRANSITIONS,
} from "../lib/api-types";
import {
  endpoints,
  useCanManageOrg,
  useDataRefresh,
  useOrg,
  useOrgRole,
  useRequest,
  useRequestQuotes,
} from "../lib/data";
import { ErrorState, LoadingState } from "../ui/States";

/**
 * The request sheet.
 *
 * The tabulation is the signature element and the one reversed cyanotype field
 * on the page. It is written out here rather than assembled from the table
 * primitives because it carries things an ordinary table does not: the derived
 * term extension, the shortfall flags, and the row actions that move a bid
 * through its lifecycle.
 */

const STATUS_TINT: Record<QuoteStatus, string> = {
  Draft: "text-bp-vellum/50",
  Submitted: "text-bp-line",
  UnderReview: "text-bp-hazard",
  Accepted: "text-bp-approve",
  Rejected: "text-bp-flag",
};

type DeepButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "accept" | "advance" | "reject";
  children: ReactNode;
};

/** Actions living on the reversed field need their own contrast treatment. */
function DeepButton({ tone = "advance", className, children, ...rest }: DeepButtonProps) {
  const tones = {
    accept: "border-bp-hazard bg-bp-hazard text-bp-ink hover:bg-bp-vellum hover:border-bp-vellum",
    advance: "border-bp-line/60 text-bp-vellum hover:bg-bp-line/25",
    reject: "border-bp-flag/60 text-bp-flag hover:bg-bp-flag hover:text-bp-vellum",
  } as const;

  return (
    <button
      type="button"
      className={cx(
        "bp-anno bp-focus-inverse border px-2.5 py-1.5 text-[8px] transition-colors duration-150",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function ShortfallFlag({ row }: { row: BidRow }) {
  // The status column already carries this; a second red would double-count it.
  if (row.quote.status === "Rejected") return null;
  if (row.months === null) {
    return (
      <span className="bp-anno text-[8px] text-bp-graphite">No dates given</span>
    );
  }
  if (row.shortfall === "material") {
    return (
      <span className="bp-anno text-[8px] text-bp-flag">
        Starts {row.daysLate}d late · covers {formatMonths(row.months)}
      </span>
    );
  }
  if (row.shortfall === "minor") {
    return (
      <span className="bp-anno text-[8px] text-bp-vellum/60">
        Starts {row.daysLate}d late
      </span>
    );
  }
  return <span className="bp-anno text-[8px] text-bp-line">Full term</span>;
}

export default function RequestDetail() {
  const { orgId = "", requestId = "" } = useParams<{
    orgId: string;
    requestId: string;
  }>();

  const orgQuery = useOrg(orgId);
  const requestQuery = useRequest(orgId, requestId);
  const quotesQuery = useRequestQuotes(orgId, requestId);
  const canManageQuotes = useCanManageOrg(orgId);
  const orgRole = useOrgRole(orgId);
  const { invalidate } = useDataRefresh();

  const org = orgQuery.data;
  const request = requestQuery.data;
  const requestQuotes = quotesQuery.data ?? [];

  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingAccept, setPendingAccept] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mutating, setMutating] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  // Awarding is triggered from a row that can be well down a long tabulation,
  // so bring the confirmation to the reader rather than waiting to be found.
  useEffect(() => {
    if (!pendingAccept || !confirmRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    confirmRef.current.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
    });
    confirmRef.current.focus({ preventScroll: true });
  }, [pendingAccept]);

  if (orgQuery.loading || requestQuery.loading || quotesQuery.loading) {
    return <LoadingState label="Loading request sheet" />;
  }

  if (orgQuery.error || requestQuery.error || quotesQuery.error) {
    return (
      <ErrorState
        title="Could not load request"
        body={
          orgQuery.error ?? requestQuery.error ?? quotesQuery.error ?? "Unknown error"
        }
      />
    );
  }

  if (!request || request.organizationId !== orgId) {
    return (
      <EmptyState
        title="Request not found"
        body="This request may have been removed, or the link may be pointing at another organization."
        action={
          <ButtonLink to={`/app/orgs/${orgId}/requests`} variant="secondary">
            Back to requests
          </ButtonLink>
        }
      />
    );
  }

  const comparison = compareBids(requestQuotes);
  const activeCount = requestQuotes.filter(isActive).length;
  const acceptTarget = requestQuotes.find((quote) => quote.id === pendingAccept);
  const publicUrl = publicRequestUrl(request.publicSlug);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  async function transitionRequest(status: "Closed" | "Cancelled") {
    if (!request) return;
    setMutating(true);
    try {
      await endpoints.orgs.requests.transition(orgId, request.id, status);
      invalidate();
    } finally {
      setMutating(false);
    }
  }

  async function transitionQuote(quoteId: string, status: QuoteStatus) {
    setMutating(true);
    try {
      await endpoints.orgs.requests.quotes.transition(
        orgId,
        requestId,
        quoteId,
        status,
      );
      invalidate();
    } finally {
      setMutating(false);
    }
  }

  async function confirmAccept() {
    if (!pendingAccept) return;
    setMutating(true);
    try {
      await endpoints.orgs.requests.quotes.accept(
        orgId,
        requestId,
        pendingAccept,
      );
      setPendingAccept(null);
      invalidate();
    } finally {
      setMutating(false);
    }
  }

  const requestTransitions = REQUEST_TRANSITIONS[request.status];
  const canSubmitBid = orgRole !== null && request.status === "Open";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`Sheet · ${request.publicSlug.slice(-4).toUpperCase()}`}
        title={request.title}
        description={request.description ?? undefined}
        crumbs={[
          { label: "Dashboard", to: "/app" },
          { label: org?.name ?? "Organization", to: `/app/orgs/${orgId}/requests` },
          { label: "Requests", to: `/app/orgs/${orgId}/requests` },
          { label: request.title },
        ]}
        actions={
          request.status === "Open" &&
          (canSubmitBid || requestTransitions.length > 0) ? (
            <>
              {canSubmitBid ? (
                <ButtonLink
                  to={`/r/${request.publicSlug}`}
                  variant="primary"
                  size="md"
                >
                  Submit a bid
                </ButtonLink>
              ) : null}
              {requestTransitions.includes("Closed") ? (
                <Button
                  variant="secondary"
                  size="md"
                  disabled={mutating}
                  onClick={() => void transitionRequest("Closed")}
                >
                  Close to new bids
                </Button>
              ) : null}
              {requestTransitions.includes("Cancelled") ? (
                <Button
                  variant="danger"
                  size="md"
                  disabled={mutating}
                  onClick={() => void transitionRequest("Cancelled")}
                >
                  Cancel request
                </Button>
              ) : null}
            </>
          ) : null
        }
      >
        <TitleBlock
          columns={4}
          cells={[
            {
              term: "Status",
              value: <RequestStatusBadge status={request.status} dot />,
            },
            { term: "Raised", value: day(request.createdAt) },
            {
              term: "Bids in play",
              value: `${activeCount} of ${requestQuotes.length}`,
            },
            {
              term: "Term benchmark",
              value: formatMonths(comparison.benchmarkMonths),
            },
          ]}
        />
      </PageHeader>

      {acceptTarget ? (
        <div
          ref={confirmRef}
          tabIndex={-1}
          role="group"
          aria-label="Confirm award"
          className="bp-focus border border-bp-ink bg-bp-hazard/15 p-5"
        >
          <p className="bp-anno m-0 text-[9px] text-bp-ink">Confirm award</p>
          <h2 className="bp-display m-0 mt-2 text-xl">
            Award to {acceptTarget.businessName}?
          </h2>
          <p className="bp-body m-0 mt-2 max-w-[62ch] text-sm text-bp-ink/80">
            Accepting this bid rejects the {activeCount - 1} other bid
            {activeCount - 1 === 1 ? "" : "s"} still in play and closes the
            request to new submissions. This cannot be undone.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="md"
              disabled={mutating}
              onClick={() => void confirmAccept()}
            >
              Award to {acceptTarget.businessName}
            </Button>
            <Button
              variant="quiet"
              size="md"
              onClick={() => setPendingAccept(null)}
            >
              Keep reviewing
            </Button>
          </div>
        </div>
      ) : null}

      {requestQuotes.length === 0 ? (
        <EmptyState
          title="No bids yet"
          body="Nothing has been submitted against this sheet. Send the public link to vendors and their bids will tabulate here as they arrive."
          action={
            <Button variant="primary" size="md" onClick={copyLink}>
              Copy public link
            </Button>
          }
        />
      ) : (
        /* The one reversed field on the page. */
        <section className="border border-bp-ink bg-bp-deep text-bp-vellum">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-bp-line/40 px-5 py-4">
            <h2 className="bp-display m-0 text-2xl text-bp-vellum">
              Bid tabulation
            </h2>
            <p className="bp-anno m-0 text-[9px] text-bp-line">
              Extended across each bid&apos;s own term
            </p>
          </header>

          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full min-w-[880px] border-collapse text-left">
              <thead>
                <tr className="bp-anno text-[9px] text-bp-line">
                  <th scope="col" className="w-14 py-3 pr-4 font-medium">
                    Item
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Vendor
                  </th>
                  <th scope="col" className="py-3 pr-4 text-right font-medium">
                    Rate
                  </th>
                  <th scope="col" className="py-3 pr-4 text-right font-medium">
                    Term
                  </th>
                  <th scope="col" className="py-3 pr-4 text-right font-medium">
                    Term total
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Status
                  </th>
                  <th scope="col" className="py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row, index) => {
                  const { quote } = row;
                  const open = expanded === quote.id;
                  const dimmed = quote.status === "Rejected";

                  return (
                    <Fragment key={quote.id}>
                      {/* Out-of-play bids recede by muting their figures, not
                          by fading the row — a faded flag stops being legible. */}
                      <tr className="border-t border-bp-line/25 align-middle">
                        <td className="bp-data py-4 pr-4 text-xs text-bp-line">
                          <span className="flex items-center gap-2">
                            <span
                              className={cx(
                                "inline-block h-6 w-1",
                                quote.status === "Accepted"
                                  ? "bg-bp-approve"
                                  : quote.status === "UnderReview"
                                    ? "bg-bp-hazard"
                                    : "bg-transparent",
                              )}
                            />
                            {String((index + 1) * 10).padStart(3, "0")}
                          </span>
                        </td>

                        <td className="py-4 pr-4">
                          <button
                            type="button"
                            onClick={() => setExpanded(open ? null : quote.id)}
                            aria-expanded={open}
                            className="bp-focus-inverse block text-left"
                          >
                            <span
                              className={cx(
                                "bp-display block text-lg",
                                dimmed ? "text-bp-vellum/55" : "text-bp-vellum",
                              )}
                            >
                              {quote.businessName}
                            </span>
                            <span className="bp-anno block text-[8px] text-bp-line">
                              {open ? "Hide contact" : "Show contact"}
                            </span>
                          </button>
                          <span className="mt-1 block">
                            <ShortfallFlag row={row} />
                          </span>
                        </td>

                        <td
                          className={cx(
                            "bp-data py-4 pr-4 text-right text-lg",
                            dimmed ? "text-bp-vellum/55" : "text-bp-vellum",
                          )}
                        >
                          {rate(quote.amount, quote.unit)}
                        </td>

                        <td className="bp-data py-4 pr-4 text-right text-sm text-bp-vellum/70">
                          {formatMonths(row.months)}
                        </td>

                        <td
                          className={cx(
                            "bp-data py-4 pr-4 text-right text-lg",
                            dimmed ? "text-bp-vellum/55" : "text-bp-vellum",
                          )}
                        >
                          {row.termTotal === null ? "—" : money(row.termTotal)}
                        </td>

                        <td className="py-4 pr-4">
                          <span
                            className={cx(
                              "bp-anno text-[9px]",
                              STATUS_TINT[quote.status],
                            )}
                          >
                            {quoteStatusLabel(quote.status)}
                          </span>
                        </td>

                        <td className="py-4">
                          {quote.status === "Accepted" ? (
                            <span className="bp-stamp inline-block px-2 py-1 text-[9px]">
                              Awarded
                            </span>
                          ) : canManageQuotes ? (
                            <span className="flex flex-wrap gap-2">
                              {QUOTE_TRANSITIONS[quote.status].includes(
                                "UnderReview",
                              ) ? (
                                <DeepButton
                                  tone="advance"
                                  disabled={mutating}
                                  onClick={() =>
                                    void transitionQuote(quote.id, "UnderReview")
                                  }
                                >
                                  Move to review
                                </DeepButton>
                              ) : null}
                              {QUOTE_TRANSITIONS[quote.status].includes(
                                "Accepted",
                              ) ? (
                                <DeepButton
                                  tone="accept"
                                  disabled={mutating}
                                  onClick={() => setPendingAccept(quote.id)}
                                >
                                  Accept
                                </DeepButton>
                              ) : null}
                              {QUOTE_TRANSITIONS[quote.status].includes(
                                "Submitted",
                              ) ? (
                                <DeepButton
                                  tone="advance"
                                  disabled={mutating}
                                  onClick={() =>
                                    void transitionQuote(quote.id, "Submitted")
                                  }
                                >
                                  Revert
                                </DeepButton>
                              ) : null}
                              {QUOTE_TRANSITIONS[quote.status].includes(
                                "Rejected",
                              ) ? (
                                <DeepButton
                                  tone="reject"
                                  disabled={mutating}
                                  onClick={() =>
                                    void transitionQuote(quote.id, "Rejected")
                                  }
                                >
                                  Reject
                                </DeepButton>
                              ) : null}
                            </span>
                          ) : null}
                        </td>
                      </tr>

                      {open ? (
                        <tr className="border-t border-bp-line/15 bg-bp-vellum/5">
                          <td />
                          <td colSpan={6} className="pb-5 pr-4 pt-1">
                            <dl className="m-0 grid gap-x-8 gap-y-3 sm:grid-cols-3">
                              <div>
                                <dt className="bp-anno m-0 text-[8px] text-bp-line">
                                  Contact
                                </dt>
                                <dd className="bp-data m-0 mt-1 text-xs text-bp-vellum">
                                  {quote.contactName}
                                </dd>
                              </div>
                              <div>
                                <dt className="bp-anno m-0 text-[8px] text-bp-line">
                                  Email
                                </dt>
                                <dd className="bp-data m-0 mt-1 text-xs text-bp-vellum">
                                  <a
                                    href={`mailto:${quote.contactEmail}`}
                                    className="bp-focus-inverse text-bp-vellum underline decoration-dotted underline-offset-4"
                                  >
                                    {quote.contactEmail}
                                  </a>
                                </dd>
                              </div>
                              <div>
                                <dt className="bp-anno m-0 text-[8px] text-bp-line">
                                  Phone
                                </dt>
                                <dd className="bp-data m-0 mt-1 text-xs text-bp-vellum">
                                  {quote.contactPhone ?? "Not given"}
                                </dd>
                              </div>
                              <div className="sm:col-span-3">
                                <dt className="bp-anno m-0 text-[8px] text-bp-line">
                                  Window quoted
                                </dt>
                                <dd className="bp-data m-0 mt-1 text-xs text-bp-vellum">
                                  {day(quote.startAt)} → {day(quote.endAt)}
                                </dd>
                              </div>
                              {quote.notes ? (
                                <div className="sm:col-span-3">
                                  <dt className="bp-anno m-0 text-[8px] text-bp-line">
                                    Notes
                                  </dt>
                                  <dd className="bp-body m-0 mt-1 max-w-[70ch] text-sm text-bp-vellum/80">
                                    {quote.notes}
                                  </dd>
                                </div>
                              ) : null}
                            </dl>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

        </section>
      )}

      <Panel
        title="Public link"
        annotation="No sign-in required to bid"
        action={
          <Button variant="secondary" size="sm" onClick={copyLink}>
            {copied ? "Copied" : "Copy link"}
          </Button>
        }
      >
        <p className="bp-body m-0 mb-3 max-w-[62ch] text-sm text-bp-graphite">
          Send this to vendors. They price the same fields you see below, and
          their bid lands on this sheet.
        </p>
        <p className="bp-data m-0 overflow-x-auto border border-bp-ink bg-bp-field px-3 py-2 text-xs text-bp-line">
          {publicUrl}
        </p>
        {copied ? <Notice className="mt-3">Link copied to your clipboard.</Notice> : null}
      </Panel>
    </div>
  );
}
