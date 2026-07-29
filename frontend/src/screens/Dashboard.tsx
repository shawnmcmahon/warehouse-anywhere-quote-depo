import { Link } from "react-router";
import { useState } from "react";
import { PageHeader } from "../ui/PageHeader";
import { Button, ButtonLink } from "../ui/Button";
import { EmptyState, ErrorState, LoadingState, Notice } from "../ui/States";
import { cx } from "../lib/cx";
import { canManageOrg } from "../lib/api-types";
import { publicOrgUrl } from "../lib/format";
import type { DashboardOrgResponse } from "../lib/api-types";
import { useDashboardOrgs } from "../lib/data";

function CountCell({
  label,
  value,
  to,
  decision = false,
}: {
  label: string;
  value: number;
  to: string;
  decision?: boolean;
}) {
  const waiting = decision && value > 0;
  return (
    <Link
      to={to}
      className={cx(
        "bp-focus relative flex flex-col justify-between gap-2 bg-bp-vellum px-3 pb-3 pt-3.5 no-underline transition-colors hover:bg-bp-stock",
      )}
    >
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
    </Link>
  );
}

function OrgCard({ org }: { org: DashboardOrgResponse }) {
  const manages = canManageOrg(org.role);
  const waiting =
    org.pendingQuoteCount + org.pendingJoinRequestCount;
  const [copied, setCopied] = useState(false);
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
        <div className="flex flex-wrap items-center gap-3">
          <span className="bp-anno border border-bp-graphite/45 px-1.5 py-0.5 text-[8px] text-bp-graphite">
            {org.role}
          </span>
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
      </header>

      <div className="p-4">
        {org.description ? (
          <p className="bp-body m-0 mb-4 max-w-[54ch] text-sm text-bp-graphite">
            {org.description}
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-px border border-bp-ink bg-bp-ink">
          <CountCell
            label="Open requests"
            value={org.openRequestCount}
            to={`/app/orgs/${org.organizationId}/requests`}
          />
          <CountCell
            label="Quotes to review"
            value={org.pendingQuoteCount}
            to={`/app/orgs/${org.organizationId}/quotes`}
            decision
          />
          <CountCell
            label="Join requests"
            value={org.pendingJoinRequestCount}
            to={`/app/orgs/${org.organizationId}/join-requests`}
            decision
          />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink
              to={`/app/orgs/${org.organizationId}/requests`}
              variant={waiting > 0 ? "primary" : "secondary"}
              size="sm"
            >
              {waiting > 0
                ? `Review ${waiting} item${waiting === 1 ? "" : "s"}`
                : "View requests"}
            </ButtonLink>
            <Button variant="secondary" size="sm" onClick={copyVendorLink}>
              Copy vendor link
            </Button>
            <span className="bp-data text-xs text-bp-graphite">
              /o/{org.publicSlug}
            </span>
          </div>
          {copied ? (
            <Notice>Vendor link copied to your clipboard.</Notice>
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
      sum + org.pendingQuoteCount + org.pendingJoinRequestCount,
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
