import { Link } from "react-router";
import { PageHeader } from "../ui/PageHeader";
import { ButtonLink } from "../ui/Button";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { cx } from "../lib/cx";
import { canManageOrg } from "../lib/api-types";
import type { DashboardOrgResponse } from "../lib/api-types";
import { useDashboardOrgs } from "../lib/data";

function CountCell({
  label,
  value,
  decision = false,
}: {
  label: string;
  value: number;
  decision?: boolean;
}) {
  const waiting = decision && value > 0;
  return (
    <div className="relative flex flex-col justify-between gap-2 bg-bp-vellum px-3 pb-3 pt-3.5">
      {waiting ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] bg-bp-hazard"
        />
      ) : null}
      <span
        className={cx(
          "bp-anno text-[8px]",
          waiting ? "text-bp-ink" : "text-bp-graphite",
        )}
      >
        {label}
      </span>
      <span
        className={cx(
          "bp-data text-2xl leading-none",
          value > 0 ? "text-bp-ink" : "text-bp-graphite/60",
        )}
      >
        {String(value).padStart(2, "0")}
      </span>
    </div>
  );
}

function OrgCard({ org }: { org: DashboardOrgResponse }) {
  const manages = canManageOrg(org.role);
  const waiting =
    org.pendingQuoteCount + (manages ? org.pendingJoinRequestCount : 0);

  return (
    <section className="border border-bp-ink bg-bp-sheet">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-bp-ink bg-bp-stock px-4 py-2.5">
        <h2 className="bp-display m-0 text-lg">
          <Link
            to={`/app/orgs/${org.organizationId}/requests`}
            className="bp-focus text-bp-ink no-underline hover:text-bp-line"
          >
            {org.name}
          </Link>
        </h2>
        <span className="bp-anno border border-bp-graphite/45 px-1.5 py-0.5 text-[8px] text-bp-graphite">
          {org.role}
        </span>
      </header>

      <div className="p-4">
        {org.description ? (
          <p className="bp-body m-0 mb-4 max-w-[54ch] text-sm text-bp-graphite">
            {org.description}
          </p>
        ) : null}

        <div
          className={cx(
            "grid gap-px border border-bp-ink bg-bp-ink",
            manages ? "grid-cols-3" : "grid-cols-2",
          )}
        >
          <CountCell label="Open requests" value={org.openRequestCount} />
          <CountCell
            label="Quotes to review"
            value={org.pendingQuoteCount}
            decision
          />
          {manages ? (
            <CountCell
              label="Join requests"
              value={org.pendingJoinRequestCount}
              decision
            />
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ButtonLink
            to={`/app/orgs/${org.organizationId}/requests`}
            variant={waiting > 0 ? "primary" : "secondary"}
            size="sm"
          >
            {waiting > 0
              ? `Review ${waiting} item${waiting === 1 ? "" : "s"}`
              : "View requests"}
          </ButtonLink>
          {manages ? (
            <ButtonLink
              to={`/app/orgs/${org.organizationId}/settings`}
              variant="quiet"
              size="sm"
            >
              Settings
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { data: orgs, loading, error } = useDashboardOrgs();
  const totalWaiting = (orgs ?? []).reduce(
    (sum, org) =>
      sum +
      org.pendingQuoteCount +
      (canManageOrg(org.role) ? org.pendingJoinRequestCount : 0),
    0,
  );

  if (loading) {
    return <LoadingState label="Loading your organizations" />;
  }

  if (error) {
    return <ErrorState title="Could not load dashboard" body={error} />;
  }

  const list = orgs ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Dashboard"
        title="Your organizations"
        description={
          totalWaiting > 0
            ? `${totalWaiting} item${totalWaiting === 1 ? "" : "s"} across your organizations are waiting on a decision.`
            : "Nothing is waiting on a decision right now."
        }
        actions={
          <ButtonLink to="/app/onboarding" variant="secondary" size="md">
            Join or create
          </ButtonLink>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title="No organizations yet"
          body="Create an organization to start raising requests, or ask to join one that already exists."
          action={
            <ButtonLink to="/app/onboarding" variant="primary" size="md">
              Get started
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {list.map((org) => (
            <OrgCard key={org.organizationId} org={org} />
          ))}
        </div>
      )}
    </div>
  );
}
