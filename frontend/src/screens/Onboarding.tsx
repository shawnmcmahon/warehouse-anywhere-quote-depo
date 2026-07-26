import { useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { TextAreaField, TextField } from "../ui/Field";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { cx } from "../lib/cx";
import {
  endpoints,
  useBrowsableOrgs,
  useDataRefresh,
} from "../lib/data";
import { useAuth } from "../lib/auth/AuthProvider";

type Path = "create" | "invite" | "join";

const PATHS: { id: Path; title: string; blurb: string }[] = [
  {
    id: "create",
    title: "Start one",
    blurb: "You run the sourcing. You become the owner and invite the rest.",
  },
  {
    id: "invite",
    title: "Accept an invite",
    blurb: "Someone has already added you. Your invites are listed here.",
  },
  {
    id: "join",
    title: "Ask to join",
    blurb: "Find your organization and request access from an admin.",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { bootstrap, refreshBootstrap } = useAuth();
  const { data: browsableOrgs, loading, error } = useBrowsableOrgs();
  const { invalidate } = useDataRefresh();
  const [path, setPath] = useState<Path>("create");
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const invites = bootstrap?.pendingInvites ?? [];
  const matches = (browsableOrgs ?? []).filter((org) =>
    org.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  async function runMutation(action: () => Promise<void>, redirect?: string) {
    setActionError(null);
    setBusy(true);
    try {
      await action();
      await refreshBootstrap();
      invalidate();
      if (redirect) {
        navigate(redirect, { replace: true });
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading organizations" />;
  }

  if (error) {
    return <ErrorState title="Could not load organizations" body={error} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Getting set up"
        title="Join an organization"
        description="Requests and bids belong to an organization. Pick the way in that matches your situation."
      />

      {actionError ? (
        <ErrorState title="Action failed" body={actionError} />
      ) : null}

      <fieldset className="m-0 border-0 p-0">
        <legend className="bp-anno mb-3 p-0 text-[9px] text-bp-graphite">
          How are you getting in?
        </legend>
        <div className="grid gap-px border border-bp-ink bg-bp-ink sm:grid-cols-3">
          {PATHS.map((option) => {
            const active = path === option.id;
            return (
              <label
                key={option.id}
                className={cx(
                  "flex cursor-pointer gap-3 p-4 transition-colors duration-150",
                  active ? "bg-bp-sheet" : "bg-bp-vellum hover:bg-bp-stock",
                )}
              >
                <input
                  type="radio"
                  name="onboarding-path"
                  value={option.id}
                  checked={active}
                  onChange={() => setPath(option.id)}
                  className="bp-focus mt-1 h-3.5 w-3.5 shrink-0 accent-bp-hazard"
                />
                <span className="min-w-0">
                  <span className="bp-display block text-lg text-bp-ink">
                    {option.title}
                  </span>
                  <span className="bp-body mt-1 block text-sm text-bp-graphite">
                    {option.blurb}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {path === "create" ? (
        <Panel
          title="New organization"
          annotation="You will be the owner"
          className="max-w-3xl"
        >
          <form
            className="flex max-w-xl flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void runMutation(async () => {
                const org = await endpoints.orgs.create({
                  name: String(data.get("name") ?? "").trim(),
                  description:
                    String(data.get("description") ?? "").trim() || null,
                });
                navigate(`/app/orgs/${org.id}/requests`, { replace: true });
              });
            }}
          >
            <TextField
              label="Name"
              name="name"
              required
              placeholder="Cascade Distribution"
              hint="Vendors see this on every public bid link you send."
            />
            <TextAreaField
              label="Description"
              name="description"
              optional
              rows={3}
              placeholder="Regional distribution, seven DCs across the Great Basin."
            />
            <div>
              <Button type="submit" variant="primary" size="lg" disabled={busy}>
                {busy ? "Creating…" : "Create organization"}
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      {path === "invite" ? (
        <Panel
          title="Your invites"
          annotation={`${invites.length} pending`}
          className="max-w-3xl"
        >
          {invites.length === 0 ? (
            <EmptyState
              title="No invites waiting"
              body="Invites are sent to your email address and show up here once an owner or admin adds you. If you are expecting one, check that they used this address."
              action={
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setPath("join")}
                >
                  Ask to join instead
                </Button>
              }
            />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-px border border-bp-ink bg-bp-ink p-0">
              {invites.map((invite) => (
                <li
                  key={invite.inviteId}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 bg-bp-vellum px-4 py-3"
                >
                  <div>
                    <span className="bp-display block text-lg text-bp-ink">
                      {invite.organizationName}
                    </span>
                    <span className="bp-anno mt-1 block text-[8px] text-bp-graphite">
                      Joining as {invite.role}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      void runMutation(
                        async () => {
                          await endpoints.orgs.invites.accept(invite.token);
                        },
                        `/app/orgs/${invite.organizationId}/requests`,
                      )
                    }
                  >
                    Accept invite
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      {path === "join" ? (
        <Panel
          title="Find your organization"
          annotation="An owner or admin approves the request"
          className="max-w-3xl"
        >
          <div className="flex max-w-md flex-col gap-4">
            <TextField
              label="Search"
              name="filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Cascade"
              optional
            />
          </div>

          {matches.length === 0 ? (
            <p className="bp-body m-0 mt-5 text-sm text-bp-graphite">
              No organizations match “{filter}”. Check the spelling, or start
              one yourself.
            </p>
          ) : (
            <ul className="m-0 mt-5 flex list-none flex-col gap-px border border-bp-ink bg-bp-ink p-0">
              {matches.map((org) => (
                <li
                  key={org.id}
                  className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 bg-bp-vellum px-4 py-3"
                >
                  <div className="min-w-0">
                    <span className="bp-display block text-lg text-bp-ink">
                      {org.name}
                    </span>
                    {org.description ? (
                      <span className="bp-body mt-1 block max-w-[52ch] text-sm text-bp-graphite">
                        {org.description}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      void runMutation(async () => {
                        await endpoints.orgs.joinRequests.create(org.id, {
                          message: null,
                        });
                      })
                    }
                  >
                    Request access
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
