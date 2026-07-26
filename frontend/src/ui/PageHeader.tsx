import type { ReactNode } from "react";
import { Link } from "react-router";

export type Crumb = { label: string; to?: string };

type PageHeaderProps = {
  /** Mono kicker above the title — the sheet reference or section. */
  eyebrow?: string;
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      {crumbs && crumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="bp-anno m-0 flex flex-wrap items-center gap-2 p-0 text-[9px] text-bp-graphite">
            {crumbs.map((crumb, index) => (
              <li key={crumb.label} className="flex items-center gap-2">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-bp-line">
                    /
                  </span>
                ) : null}
                {crumb.to ? (
                  <Link
                    to={crumb.to}
                    className="bp-focus hover:text-bp-line hover:underline hover:decoration-dotted hover:underline-offset-4"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-bp-ink">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-6 sm:gap-y-4">
        <div className="min-w-0 sm:flex-1">
          {eyebrow ? (
            <p className="bp-anno m-0 mb-2 text-[10px] text-bp-line">{eyebrow}</p>
          ) : null}
          <h1 className="bp-display m-0 text-[clamp(1.75rem,4vw,2.75rem)]">
            {title}
          </h1>
          {description ? (
            <p className="bp-body m-0 mt-3 max-w-[62ch] text-sm text-bp-graphite">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
            {actions}
          </div>
        ) : null}
      </div>

      {children}
    </header>
  );
}
