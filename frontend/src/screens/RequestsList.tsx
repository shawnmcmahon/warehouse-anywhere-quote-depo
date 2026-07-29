import { useState } from "react";
import { Link, useParams } from "react-router";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { TextAreaField, TextField } from "../ui/Field";
import { EmptyState, ErrorState, LoadingState, Notice } from "../ui/States";
import { RequestStatusBadge } from "../ui/StatusBadge";
import { HeadRow, Row, TBody, THead, TH, TD, Table } from "../ui/Table";
import { day, publicOrgUrl, truncate } from "../lib/format";
import { endpoints, useDataRefresh, useOrg, useOrgRequests } from "../lib/data";

export default function RequestsList() {
  const { orgId = "" } = useParams<{ orgId: string }>();
  const orgQuery = useOrg(orgId);
  const requestsQuery = useOrgRequests(orgId);
  const { invalidate } = useDataRefresh();
  const [drafting, setDrafting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const org = orgQuery.data;
  const orgRequests = requestsQuery.data ?? [];
  const openCount = orgRequests.filter(
    (request) => request.status === "Open",
  ).length;

  if (orgQuery.loading || requestsQuery.loading) {
    return <LoadingState label="Loading requests" />;
  }

  if (orgQuery.error || requestsQuery.error) {
    return (
      <ErrorState
        title="Could not load requests"
        body={orgQuery.error ?? requestsQuery.error ?? "Unknown error"}
      />
    );
  }

  if (!org) {
    return (
      <EmptyState
        title="Organization not found"
        body="You may not have access to this organization, or it may have been removed."
      />
    );
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    if (!title) {
      setSubmitting(false);
      return;
    }

    try {
      await endpoints.orgs.requests.create(orgId, {
        title,
        description: description || null,
      });
      form.reset();
      setDrafting(false);
      invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not raise request.");
    } finally {
      setSubmitting(false);
    }
  }

  const vendorUrl = publicOrgUrl(org.publicSlug);

  async function copyVendorLink() {
    try {
      await navigator.clipboard.writeText(vendorUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={org.name}
        title="Requests"
        description="Each request is issued as a sheet with one public link. Vendors price the same fields, so the bids tabulate straight across."
        crumbs={[
          { label: "Dashboard", to: "/app" },
          { label: org.name },
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
          title="Request History"
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
                    <TD figure className="text-xs">
                      <Link
                        to={`/r/${request.publicSlug}`}
                        className="bp-focus text-bp-line underline decoration-dotted underline-offset-4 hover:text-bp-ink"
                      >
                        /r/{request.publicSlug}
                      </Link>
                    </TD>
                  </Row>
                ))}
              </TBody>
            </Table>
          </div>
        </Panel>
      )}

      {drafting ? (
        <Panel title="New request" annotation="Issued open for bid">
          {error ? (
            <ErrorState title="Could not raise request" body={error} className="mb-5" />
          ) : null}
          <form className="flex flex-col gap-5" onSubmit={handleCreate}>
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
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting}
              >
                {submitting ? "Raising…" : "Raise request"}
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

      <Panel title="Vendor link" annotation="Share with all vendors">
        <p className="bp-body m-0 max-w-[54ch] text-sm text-bp-graphite">
          Send this link so vendors can browse every open request and submit
          bids without signing in.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={copyVendorLink}>
            Copy vendor link
          </Button>
          <Link
            to={`/o/${org.publicSlug}`}
            className="bp-focus bp-data text-xs text-bp-line underline decoration-dotted underline-offset-4"
          >
            /o/{org.publicSlug}
          </Link>
        </div>
        {copied ? (
          <Notice className="mt-3">Vendor link copied to your clipboard.</Notice>
        ) : null}
      </Panel>
    </div>
  );
}
