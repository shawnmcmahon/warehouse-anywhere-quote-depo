import { Link, useParams } from "react-router";
import { PageHeader } from "../ui/PageHeader";
import { Panel } from "../ui/Panel";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { QuoteStatusBadge } from "../ui/StatusBadge";
import { HeadRow, Row, TBody, THead, TH, TD, Table } from "../ui/Table";
import { day, rate } from "../lib/format";
import { useOrg, useOrgPendingQuotes } from "../lib/data";

export default function OrgQuotesReview() {
  const { orgId = "" } = useParams<{ orgId: string }>();
  const orgQuery = useOrg(orgId);
  const quotesQuery = useOrgPendingQuotes(orgId);

  if (orgQuery.loading || quotesQuery.loading) {
    return <LoadingState label="Loading quotes to review" />;
  }

  if (orgQuery.error || quotesQuery.error) {
    return (
      <ErrorState
        title="Could not load quotes"
        body={orgQuery.error ?? quotesQuery.error ?? "Unknown error"}
      />
    );
  }

  const org = orgQuery.data;
  if (!org) {
    return (
      <EmptyState
        title="Organization not found"
        body="You may not have access to this organization, or it may have been removed."
      />
    );
  }

  const quotes = quotesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={org.name}
        title="Quotes to review"
        description="Submitted and under-review bids across all open requests. Open a request to compare bids and accept one."
        crumbs={[
          { label: "Dashboard", to: "/app" },
          { label: org.name, to: `/app/orgs/${orgId}/requests` },
          { label: "Quotes to review" },
        ]}
      />

      {quotes.length === 0 ? (
        <EmptyState
          title="Nothing waiting on review"
          body="When vendors submit bids, they will appear here until you move them forward or reject them."
        />
      ) : (
        <Panel
          title="Pending bids"
          annotation={`${quotes.length} waiting`}
          flush
        >
          <div className="px-4 pb-2 sm:px-5">
            <Table minWidth={760}>
              <THead>
                <HeadRow>
                  <TH>Request</TH>
                  <TH>Vendor</TH>
                  <TH>Rate</TH>
                  <TH>Status</TH>
                  <TH>Submitted</TH>
                </HeadRow>
              </THead>
              <TBody>
                {quotes.map((quote) => (
                  <Row key={quote.quoteId}>
                    <TD>
                      <Link
                        to={`/app/orgs/${orgId}/requests/${quote.requestId}`}
                        className="bp-focus bp-display text-base text-bp-ink no-underline hover:text-bp-line"
                      >
                        {quote.requestTitle}
                      </Link>
                    </TD>
                    <TD className="text-sm">{quote.businessName}</TD>
                    <TD figure className="text-xs">
                      {rate(quote.amount, quote.unit)}
                    </TD>
                    <TD>
                      <QuoteStatusBadge status={quote.status} />
                    </TD>
                    <TD figure className="text-xs">
                      {day(quote.createdAt)}
                    </TD>
                  </Row>
                ))}
              </TBody>
            </Table>
          </div>
        </Panel>
      )}
    </div>
  );
}
