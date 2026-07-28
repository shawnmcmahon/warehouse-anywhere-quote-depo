import { useParams } from "react-router";
import { ButtonLink } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { GuestFrame } from "../ui/GuestFrame";
import { EmptyState, LoadingState } from "../ui/States";
import { HeadRow, Row, TBody, THead, TH, TD, Table } from "../ui/Table";
import { day, truncate } from "../lib/format";
import { usePublicOrganization } from "../lib/data";

export default function PublicOrgRequests() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: org, loading, error } = usePublicOrganization(slug);

  if (loading) {
    return (
      <GuestFrame>
        <LoadingState label="Loading open requests" />
      </GuestFrame>
    );
  }

  if (error || !org) {
    return (
      <GuestFrame>
        <EmptyState
          title="This link is not live"
          body={
            error ??
            "The organization may not exist, or the link may be mistyped. Check with whoever sent it to you."
          }
        />
      </GuestFrame>
    );
  }

  const openRequests = org.openRequests ?? [];

  return (
    <GuestFrame>
      <div className="flex flex-col gap-8">
        <div>
          <p className="bp-anno m-0 text-[10px] text-bp-line">Open requests</p>
          <h1 className="bp-display m-0 mt-4 text-[clamp(1.9rem,4.5vw,2.75rem)]">
            {org.name}
          </h1>
          {org.description ? (
            <p className="bp-body m-0 mt-5 max-w-[52ch] text-base text-bp-ink/85">
              {org.description}
            </p>
          ) : null}
          <p className="bp-body m-0 mt-5 max-w-[52ch] text-sm text-bp-graphite">
            Every request below is open for bid. Pick a sheet to price the work
            as described — no account required.
          </p>
        </div>

        {openRequests.length === 0 ? (
          <EmptyState
            title="No open requests right now"
            body="This organization is not accepting bids at the moment. Check back later or contact them directly."
          />
        ) : (
          <Panel
            title="Open sheets"
            annotation={`${openRequests.length} accepting bids`}
            flush
          >
            <div className="px-4 pb-2 sm:px-5">
              <Table minWidth={640}>
                <THead>
                  <HeadRow>
                    <TH>Request</TH>
                    <TH>Raised</TH>
                    <TH align="right">Bid</TH>
                  </HeadRow>
                </THead>
                <TBody>
                  {openRequests.map((request) => (
                    <Row key={request.publicSlug}>
                      <TD>
                        <span className="bp-display block text-base text-bp-ink">
                          {request.title}
                        </span>
                        {request.description ? (
                          <span className="bp-body mt-1 block max-w-[46ch] text-xs text-bp-graphite">
                            {truncate(request.description, 96)}
                          </span>
                        ) : null}
                      </TD>
                      <TD figure className="text-xs">
                        {day(request.createdAt)}
                      </TD>
                      <TD align="right">
                        <ButtonLink
                          to={`/r/${request.publicSlug}`}
                          variant="primary"
                          size="sm"
                        >
                          Submit bid
                        </ButtonLink>
                      </TD>
                    </Row>
                  ))}
                </TBody>
              </Table>
            </div>
          </Panel>
        )}
      </div>
    </GuestFrame>
  );
}
