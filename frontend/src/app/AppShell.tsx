import { Link, NavLink, Outlet, useMatch, useNavigate } from "react-router-dom";
import { cx } from "../lib/cx";
import { currentUser, dashboardOrgs } from "../lib/fixtures";

/**
 * The signed-in frame.
 *
 * The header is the plotter strip from the landing sheet, kept at the same
 * weight and split into two rules: identity and account on the top rail, the
 * active organization and its sections on the second. Section navigation only
 * appears once you are inside an organization, because outside one there is
 * nothing to navigate between.
 */

function navClass({ isActive }: { isActive: boolean }): string {
  return cx(
    "bp-anno bp-focus -mb-px border-b-2 px-1 py-2.5 text-[10px] transition-colors duration-150",
    isActive
      ? "border-bp-hazard text-bp-ink"
      : "border-transparent text-bp-graphite hover:text-bp-line",
  );
}

export function AppShell() {
  const navigate = useNavigate();
  // A layout route only sees its own params, so read the org off the URL.
  const orgMatch = useMatch("/app/orgs/:orgId/*");
  const activeOrg = dashboardOrgs.find(
    (org) => org.organizationId === orgMatch?.params.orgId,
  );

  return (
    <div className="flex min-h-screen flex-col bg-bp-vellum text-bp-ink">
      <a
        href="#main"
        className="bp-anno sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-bp-ink focus:px-4 focus:py-2 focus:text-[10px] focus:text-bp-hazard"
      >
        Skip to content
      </a>

      <header className="border-b border-bp-ink bg-bp-stock">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-2.5 lg:px-8">
          <Link
            to="/app"
            className="bp-focus flex items-center gap-3 no-underline"
          >
            <span className="flex h-6 w-6 items-center justify-center border border-bp-ink bg-bp-ink text-[10px] font-bold text-bp-hazard">
              QD
            </span>
            <span className="bp-display text-base text-bp-ink">Quote Depot</span>
          </Link>

          <div className="bp-anno flex flex-wrap items-center gap-x-5 gap-y-1 text-[9px] text-bp-graphite">
            <span className="normal-case tracking-normal">
              {currentUser.email}
            </span>
            <Link to="/" className="bp-focus hover:text-bp-line">
              Sign out
            </Link>
          </div>
        </div>
      </header>

      {activeOrg ? (
        <div className="border-b border-bp-ink bg-bp-vellum">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 lg:px-8">
            <div className="flex items-center gap-3 py-2">
              <label
                htmlFor="org-switcher"
                className="bp-anno text-[8px] text-bp-graphite"
              >
                Organization
              </label>
              <select
                id="org-switcher"
                value={activeOrg.organizationId}
                onChange={(event) =>
                  navigate(`/app/orgs/${event.target.value}/requests`)
                }
                className="bp-input bp-data max-w-[240px] px-2 py-1 text-xs"
              >
                {dashboardOrgs.map((org) => (
                  <option key={org.organizationId} value={org.organizationId}>
                    {org.name}
                  </option>
                ))}
              </select>
              <span className="bp-anno border border-bp-graphite/45 px-1.5 py-0.5 text-[8px] text-bp-graphite">
                {activeOrg.role}
              </span>
            </div>

            <nav
              aria-label="Organization sections"
              className="flex items-center gap-6"
            >
              <NavLink
                to={`/app/orgs/${activeOrg.organizationId}/requests`}
                className={navClass}
              >
                Requests
              </NavLink>
              <NavLink
                to={`/app/orgs/${activeOrg.organizationId}/settings`}
                className={navClass}
              >
                Settings
              </NavLink>
            </nav>
          </div>
        </div>
      ) : null}

      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-5 sm:py-10 lg:px-8 lg:py-14">
          <Outlet />
        </div>
      </main>

      <footer className="mt-auto border-t border-bp-ink bg-bp-stock">
        <div className="bp-anno mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3 text-[8px] text-bp-graphite lg:px-8">
          <span>Quote Depot</span>
          <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link to="/1" className="bp-focus hover:text-bp-line">
              Exploration 01
            </Link>
            <Link to="/2" className="bp-focus hover:text-bp-line">
              02
            </Link>
            <Link to="/3" className="bp-focus hover:text-bp-line">
              03
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
