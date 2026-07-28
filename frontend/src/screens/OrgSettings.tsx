import { useState } from "react";
import { useParams } from "react-router";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { SelectField, TextAreaField, TextField } from "../ui/Field";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import {
  JoinRequestStatusBadge,
  MembershipStatusBadge,
} from "../ui/StatusBadge";
import { HeadRow, Row, TBody, THead, TH, TD, Table } from "../ui/Table";
import { auditDescription, dayTime, initials } from "../lib/format";
import type { OrgRole } from "../lib/api-types";
import {
  endpoints,
  useCanManageOrg,
  useDataRefresh,
  useOrg,
  useOrgAuditEvents,
  useOrgInvites,
  useOrgJoinRequests,
  useOrgMembers,
  useOrgRole,
} from "../lib/data";

const ROLE_OPTIONS = [
  { value: "Admin", label: "Admin" },
  { value: "Member", label: "Member" },
];

const ROLE_DUTY: Record<OrgRole, string> = {
  Owner: "Full control, including transferring or deleting the organization.",
  Admin: "Manages members, requests and bids. Cannot remove the owner.",
  Member: "Raises and manages requests. Cannot manage membership.",
};

export default function OrgSettings() {
  const { orgId = "" } = useParams<{ orgId: string }>();
  const role = useOrgRole(orgId);
  const canManage = useCanManageOrg(orgId);
  const isOwner = role === "Owner";
  const orgQuery = useOrg(orgId);
  const membersQuery = useOrgMembers(orgId);
  const invitesQuery = useOrgInvites(orgId);
  const joinRequestsQuery = useOrgJoinRequests(orgId);
  const auditQuery = useOrgAuditEvents(orgId);
  const { invalidate } = useDataRefresh();
  const [inviting, setInviting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (
    orgQuery.loading ||
    membersQuery.loading ||
    invitesQuery.loading ||
    joinRequestsQuery.loading ||
    auditQuery.loading
  ) {
    return <LoadingState label="Loading settings" />;
  }

  if (
    orgQuery.error ||
    membersQuery.error ||
    invitesQuery.error ||
    joinRequestsQuery.error ||
    auditQuery.error
  ) {
    return (
      <ErrorState
        title="Could not load settings"
        body={
          orgQuery.error ??
          membersQuery.error ??
          invitesQuery.error ??
          joinRequestsQuery.error ??
          auditQuery.error ??
          "Unknown error"
        }
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

  if (!canManage) {
    return (
      <EmptyState
        title="Settings are restricted"
        body="Only owners and admins can manage organization settings, membership and invites."
      />
    );
  }

  const members = membersQuery.data ?? [];
  const invites = invitesQuery.data ?? [];
  const joinRequests = joinRequestsQuery.data ?? [];
  const auditEvents = auditQuery.data ?? [];
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
        title="Settings"
        description="Membership, identity and the change record for this organization."
        crumbs={[
          { label: "Dashboard", to: "/app" },
          { label: org.name, to: `/app/orgs/${orgId}/requests` },
          { label: "Settings" },
        ]}
      />

      {error ? <ErrorState title="Action failed" body={error} /> : null}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel title="Organization" annotation="Shown to vendors on public links">
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void runMutation(async () => {
                await endpoints.orgs.update(orgId, {
                  name: String(data.get("name") ?? "").trim(),
                  description:
                    String(data.get("description") ?? "").trim() || null,
                });
              });
            }}
          >
            <TextField
              label="Name"
              name="name"
              defaultValue={org.name}
              required
              disabled={!isOwner}
            />
            <TextAreaField
              label="Description"
              name="description"
              optional
              rows={3}
              defaultValue={org.description ?? ""}
              hint="One or two lines about what your organization does."
              disabled={!isOwner}
            />

            {isOwner ? (
              <div className="flex flex-col gap-2">
                <span className="bp-anno text-[9px] text-bp-ink">Logo</span>
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="bp-display flex h-16 w-16 shrink-0 items-center justify-center border border-bp-ink bg-bp-ink text-lg text-bp-hazard"
                  >
                    {org.logoPath ? (
                      <img
                        src={endpoints.orgs.logoUrl(orgId)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials(org.name)
                    )}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="file"
                      name="logo"
                      accept="image/png,image/jpeg,image/webp"
                      aria-label="Upload a logo"
                      disabled={busy}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        void runMutation(async () => {
                          await endpoints.orgs.uploadLogo(orgId, file);
                        });
                      }}
                      className="bp-body bp-focus max-w-full text-xs text-bp-graphite file:mr-3 file:cursor-pointer file:border file:border-bp-ink file:bg-bp-stock file:px-3 file:py-1.5 file:font-medium file:text-bp-ink hover:file:bg-bp-ink hover:file:text-bp-vellum"
                    />
                    <p className="bp-body m-0 text-xs text-bp-graphite">
                      PNG, JPEG or WebP, up to 2 MB.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {isOwner ? (
              <div>
                <Button type="submit" variant="secondary" size="md" disabled={busy}>
                  Save changes
                </Button>
              </div>
            ) : (
              <p className="bp-body m-0 text-sm text-bp-graphite">
                Only the owner can change the organization name and description.
              </p>
            )}
          </form>
        </Panel>

        <Panel
          title="Invites"
          annotation={`${invites.length} pending`}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setInviting((open) => !open)}
              aria-expanded={inviting}
            >
              {inviting ? "Cancel" : "Invite someone"}
            </Button>
          }
        >
          {inviting ? (
            <form
              className="mb-5 flex flex-col gap-4 border border-bp-ink bg-bp-vellum p-4"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                void runMutation(async () => {
                  await endpoints.orgs.invites.create(orgId, {
                    email: String(data.get("email") ?? "").trim(),
                    role: String(data.get("role") ?? "Member") as OrgRole,
                  });
                  setInviting(false);
                  event.currentTarget.reset();
                });
              }}
            >
              <TextField
                label="Email"
                name="email"
                type="email"
                required
                placeholder="name@company.com"
              />
              <SelectField
                label="Role"
                name="role"
                options={ROLE_OPTIONS}
                defaultValue="Member"
                hint={ROLE_DUTY.Member}
              />
              <div>
                <Button type="submit" variant="primary" size="sm" disabled={busy}>
                  Send invite
                </Button>
              </div>
            </form>
          ) : null}

          {invites.length === 0 ? (
            <p className="bp-body m-0 text-sm text-bp-graphite">
              No invites are outstanding.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-px border border-bp-ink bg-bp-ink p-0">
              {invites.map((invite) => (
                <li
                  key={invite.inviteId}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-bp-vellum px-3 py-2.5"
                >
                  <span className="bp-data min-w-0 break-all text-xs text-bp-ink">
                    {invite.email}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="bp-anno border border-bp-graphite/45 px-1.5 py-0.5 text-[8px] text-bp-graphite">
                      {invite.role}
                    </span>
                    <Button
                      variant="quiet"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void runMutation(async () => {
                          await endpoints.orgs.invites.revoke(
                            orgId,
                            invite.inviteId,
                          );
                        })
                      }
                    >
                      Revoke
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Members" annotation={`${members.length} active`} flush>
        <div className="px-4 pb-2 sm:px-5">
          <Table minWidth={720}>
            <THead>
              <HeadRow>
                <TH>Member</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH align="right">Manage</TH>
              </HeadRow>
            </THead>
            <TBody>
              {members.map((member) => {
                const isMemberOwner = member.role === "Owner";
                return (
                  <Row key={member.membershipId}>
                    <TD>
                      <span className="bp-body block text-sm text-bp-ink">
                        {member.name ?? "Unnamed member"}
                      </span>
                      <span className="bp-data block text-xs text-bp-graphite">
                        {member.email}
                      </span>
                    </TD>
                    <TD>
                      {isMemberOwner || role !== "Owner" ? (
                        <span className="bp-anno text-[9px] text-bp-graphite">
                          {member.role}
                        </span>
                      ) : (
                        <select
                          defaultValue={member.role}
                          aria-label={`Role for ${member.name ?? member.email}`}
                          className="bp-input bp-data max-w-[120px] px-2 py-1 text-xs"
                          disabled={busy}
                          onChange={(event) => {
                            const nextRole = event.target.value as OrgRole;
                            void runMutation(async () => {
                              await endpoints.orgs.members.changeRole(
                                orgId,
                                member.membershipId,
                                nextRole,
                              );
                            });
                          }}
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </TD>
                    <TD>
                      <MembershipStatusBadge status={member.status} />
                    </TD>
                    <TD align="right">
                      {isMemberOwner ? (
                        <span className="bp-anno text-[8px] text-bp-graphite">
                          Owner cannot be removed
                        </span>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void runMutation(async () => {
                              await endpoints.orgs.members.revoke(
                                orgId,
                                member.membershipId,
                              );
                            })
                          }
                        >
                          Revoke access
                        </Button>
                      )}
                    </TD>
                  </Row>
                );
              })}
            </TBody>
          </Table>
        </div>
      </Panel>

      <Panel
        title="Join requests"
        annotation={
          pendingJoins.length > 0
            ? `${pendingJoins.length} waiting on you`
            : "Nothing waiting"
        }
      >
        {pendingJoins.length === 0 ? (
          <p className="bp-body m-0 text-sm text-bp-graphite">
            Nobody is asking to join right now. People who find your
            organization can request access, and it will appear here.
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
                      Only the owner can approve or reject
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Revision history"
        annotation={`Last ${auditEvents.length} changes`}
        flush
      >
        <div className="px-4 pb-2 sm:px-5">
          <Table minWidth={760}>
            <THead>
              <HeadRow>
                <TH className="w-16">Rev</TH>
                <TH className="w-40">Date</TH>
                <TH>Description</TH>
                <TH>Record</TH>
                <TH>By</TH>
              </HeadRow>
            </THead>
            <TBody>
              {auditEvents.map((event, index) => (
                <Row key={event.id}>
                  <TD figure className="text-xs text-bp-line">
                    {String(auditEvents.length - index).padStart(3, "0")}
                  </TD>
                  <TD figure className="text-xs text-bp-graphite">
                    {dayTime(event.occurredAt)}
                  </TD>
                  <TD className="text-sm">{auditDescription(event.action)}</TD>
                  <TD figure className="text-xs text-bp-graphite">
                    {event.entityType}
                  </TD>
                  <TD figure className="text-xs text-bp-graphite">
                    {event.actorEmail ?? (
                      <span className="bp-anno text-[8px] text-bp-line">
                        Guest
                      </span>
                    )}
                  </TD>
                </Row>
              ))}
            </TBody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}
