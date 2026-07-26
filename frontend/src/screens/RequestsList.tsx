import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { TextAreaField, TextField } from "../ui/Field";
import { EmptyState } from "../ui/States";
import { RequestStatusBadge } from "../ui/StatusBadge";
import { HeadRow, Row, TBody, THead, TH, TD, Table } from "../ui/Table";
import { day, truncate } from "../lib/format";
import { organizations, requests } from "../lib/fixtures";

/**
 * Every request in the organization, ordered newest first and numbered like
 * line items on a bill of services. Raising one is the page's single job, so
 * it takes the hazard button and opens in place rather than on its own route.
 */
export default function RequestsList() {
  const { orgId = "" } = useParams<{ orgId: string }>();
  const org = organizations[orgId];
  const [drafting, setDrafting] = useState(false);

  const orgRequests = requests.filter(
    (request) => request.organizationId === orgId,
  );
  const openCount = orgRequests.filter(
    (request) => request.status === "Open",
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={org?.name ?? "Organization"}
        title="Requests"
        description="Each request is issued as a sheet with one public link. Vendors price the same fields, so the bids tabulate straight across."
        crumbs={[
          { label: "Dashboard", to: "/app" },
          { label: org?.name ?? "Organization" },
          { label: "Requests" },
        ]}
        actions={
          <Button
            variant={drafting ? "secondary" : "primary"}
            size="md"
            onClick={() => setDrafting((open) => !open)}
            aria-expanded={drafting}
          >
            {drafting ? "Cancel" : "Raise a request"}
          </Button>
        }
      />

      {drafting ? (
        <Panel
          title="New request"
          annotation="Issued open for bid"
        >
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              setDrafting(false);
            }}
          >
            <TextField
              label="Title"
              name="title"
              required
              placeholder="Overflow pallet storage + weekly outbound"
              hint="What a vendor needs to read to know whether to bid."
            />
            <TextAreaField
              label="Scope"
              name="description"
              optional
              rows={5}
              placeholder="Volumes, region, term, dock hours, compliance requirements."
              hint="Stated once here so every bid prices the same work."
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="primary" size="md">
                Raise request
              </Button>
              <Button
                variant="quiet"
                size="md"
                onClick={() => setDrafting(false)}
              >
                Discard
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      {orgRequests.length === 0 ? (
        <EmptyState
          title="No requests raised yet"
          body="Raise your first request to get a public link you can send to vendors."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => setDrafting(true)}
            >
              Raise a request
            </Button>
          }
        />
      ) : (
        <Panel
          title="Issued sheets"
          annotation={`${openCount} open of ${orgRequests.length}`}
          flush
        >
          <div className="px-4 pb-2 sm:px-5">
            <Table minWidth={760}>
              <THead>
                <HeadRow>
                  <TH className="w-16">Item</TH>
                  <TH>Request</TH>
                  <TH>Status</TH>
                  <TH>Raised</TH>
                  <TH>Public link</TH>
                </HeadRow>
              </THead>
              <TBody>
                {orgRequests.map((request, index) => (
                  <Row key={request.id}>
                    <TD figure className="text-xs text-bp-line">
                      {String((index + 1) * 10).padStart(3, "0")}
                    </TD>
                    <TD>
                      <Link
                        to={`/app/orgs/${orgId}/requests/${request.id}`}
                        className="bp-focus bp-display text-base text-bp-ink no-underline hover:text-bp-line"
                      >
                        {request.title}
                      </Link>
                      {request.description ? (
                        <span className="bp-body mt-1 block max-w-[46ch] text-xs text-bp-graphite">
                          {truncate(request.description, 96)}
                        </span>
                      ) : null}
                    </TD>
                    <TD>
                      <RequestStatusBadge status={request.status} />
                    </TD>
                    <TD figure className="text-xs">
                      {day(request.createdAt)}
                    </TD>
                    <TD figure className="text-xs text-bp-line">
                      /r/{request.publicSlug}
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
