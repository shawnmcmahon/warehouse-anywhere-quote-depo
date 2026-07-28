import { useState } from "react";
import { useParams } from "react-router";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { JoinRequestStatusBadge } from "../ui/StatusBadge";
import {
  endpoints,
  useDataRefresh,
  useOrg,
  useOrgJoinRequests,
  useOrgRole,
} from "../lib/data";

export default function OrgJoinRequests() {
  const { orgId = "" } = useParams<{ orgId: string }>();
  const role = useOrgRole(orgId);
  const isOwner = role === "Owner";
  const orgQuery = useOrg(orgId);
  const joinRequestsQuery = useOrgJoinRequests(orgId);
  const { invalidate } = useDataRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (orgQuery.loading || joinRequestsQuery.loading) {
    return <LoadingState label="Loading join requests" />;
  }

  if (orgQuery.error || joinRequestsQuery.error) {
    return (
      <ErrorState
        title="Could not load join requests"
        body={orgQuery.error ?? joinRequestsQuery.error ?? "Unknown error"}
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

  const joinRequests = joinRequestsQuery.data ?? [];
  const pendingJoins = joinRequests.filter((item) => item.status === "Pending");

  async function runMutation(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={org.name}
        title="Join requests"
        description={
          isOwner
            ? "People asking to join this organization. Approve to add them as members."
            : "People asking to join this organization. Only the owner can approve or reject requests."
        }
        crumbs={[
          { label: "Dashboard", to: "/app" },
          { label: org.name, to: `/app/orgs/${orgId}/requests` },
          { label: "Join requests" },
        ]}
      />

      {error ? <ErrorState title="Action failed" body={error} /> : null}

      <Panel
        title="Pending requests"
        annotation={
          pendingJoins.length > 0
            ? `${pendingJoins.length} waiting`
            : "Nothing waiting"
        }
      >
        {pendingJoins.length === 0 ? (
          <p className="bp-body m-0 text-sm text-bp-graphite">
            Nobody is asking to join right now.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-px border border-bp-ink bg-bp-ink p-0">
            {pendingJoins.map((request) => (
              <li
                key={request.joinRequestId}
                className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 bg-bp-vellum px-4 py-3"
              >
                <div className="min-w-0">
                  <span className="bp-data block break-all text-xs text-bp-ink">
                    {request.email}
                  </span>
                  <span className="bp-body mt-1 block max-w-[56ch] text-sm text-bp-graphite">
                    {request.message ?? "No message given."}
                  </span>
                </div>
                <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
                  <JoinRequestStatusBadge status={request.status} />
                  {isOwner ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void runMutation(async () => {
                            await endpoints.orgs.joinRequests.approve(
                              orgId,
                              request.joinRequestId,
                            );
                          })
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void runMutation(async () => {
                            await endpoints.orgs.joinRequests.reject(
                              orgId,
                              request.joinRequestId,
                            );
                          })
                        }
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <span className="bp-anno text-[8px] text-bp-graphite">
                      Owner approval required
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
