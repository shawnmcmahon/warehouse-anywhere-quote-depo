import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { SelectField, TextAreaField, TextField } from "../ui/Field";
import { EmptyState } from "../ui/States";
import {
  JoinRequestStatusBadge,
  MembershipStatusBadge,
} from "../ui/StatusBadge";
import { HeadRow, Row, TBody, THead, TH, TD, Table } from "../ui/Table";
import { auditDescription, dayTime, initials } from "../lib/format";
import type { OrgRole } from "../lib/api-types";
import {
  auditEvents,
  invites,
  joinRequests,
  members,
  organizations,
} from "../lib/fixtures";

/**
 * Everything about the organization itself: who is in it, who wants in, what
 * it looks like, and what has been done to it.
 *
 * The audit panel is set as the drawing's revision table, which is the same
 * artifact doing the same job — a numbered, dated, attributed record of every
 * change to the sheet.
 */

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
  const org = organizations[orgId];
  const [inviting, setInviting] = useState(false);

  if (!org) {
    return (
      <EmptyState
        title="Organization not found"
        body="You may not have access to this organization, or it may have been removed."
      />
    );
  }

  const pendingJoins = joinRequests.filter((item) => item.status === "Pending");
  const activeMembers = members.filter((item) => item.status === "Active");

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

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel title="Organization" annotation="Shown to vendors on public links">
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => event.preventDefault()}
          >
            <TextField label="Name" name="name" defaultValue={org.name} required />
            <TextAreaField
              label="Description"
              name="description"
              optional
              rows={3}
              defaultValue={org.description ?? ""}
              hint="One or two lines about what your organization does."
            />

            <div className="flex flex-col gap-2">
              <span className="bp-anno text-[9px] text-bp-ink">Logo</span>
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="bp-display flex h-16 w-16 shrink-0 items-center justify-center border border-bp-ink bg-bp-ink text-lg text-bp-hazard"
                >
                  {initials(org.name)}
                </span>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="file"
                    name="logo"
                    accept="image/png,image/jpeg,image/webp"
                    aria-label="Upload a logo"
                    className="bp-body bp-focus max-w-full text-xs text-bp-graphite file:mr-3 file:cursor-pointer file:border file:border-bp-ink file:bg-bp-stock file:px-3 file:py-1.5 file:font-medium file:text-bp-ink hover:file:bg-bp-ink hover:file:text-bp-vellum"
                  />
                  <p className="bp-body m-0 text-xs text-bp-graphite">
                    PNG, JPEG or WebP, up to 2 MB.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Button type="submit" variant="secondary" size="md">
                Save changes
              </Button>
            </div>
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
                setInviting(false);
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
                <Button type="submit" variant="primary" size="sm">
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
                    <Button variant="quiet" size="sm">
                      Revoke
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Members"
        annotation={`${activeMembers.length} active`}
        flush
      >
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
                const isOwner = member.role === "Owner";
                const revoked = member.status === "Revoked";
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
                      {isOwner || revoked ? (
                        <span className="bp-anno text-[9px] text-bp-graphite">
                          {member.role}
                        </span>
                      ) : (
                        <select
                          defaultValue={member.role}
                          aria-label={`Role for ${member.name ?? member.email}`}
                          className="bp-input bp-data max-w-[120px] px-2 py-1 text-xs"
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
                      {isOwner ? (
                        <span className="bp-anno text-[8px] text-bp-graphite">
                          Owner cannot be removed
                        </span>
                      ) : revoked ? (
                        <Button variant="quiet" size="sm">
                          Restore
                        </Button>
                      ) : (
                        <Button variant="danger" size="sm">
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
                  <Button variant="primary" size="sm">
                    Approve
                  </Button>
                  <Button variant="danger" size="sm">
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* The audit trail is a revision table, because that is what it is. */}
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
