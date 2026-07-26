/**
 * Placeholder data, typed against the real wire shapes in `api-types`.
 *
 * This is the seam for wiring the app to the API: screens read through the
 * data hooks in `lib/data`, which today delegate here. Replacing a hook's
 * internals with a fetch is a one-line change per hook and touches no markup.
 *
 * The records continue the worked example from the design explorations — the
 * Reno–Sparks overflow storage request and its three bids — so the app screens
 * and the landing page describe the same job.
 */

import type {
  AuditEventResponse,
  BootstrapResponse,
  DashboardOrgResponse,
  InviteResponse,
  JoinRequestResponse,
  MemberResponse,
  OrgResponse,
  PublicRequestResponse,
  QuoteResponse,
  RequestResponse,
} from "./api-types";

export const CASCADE_ORG_ID = "8f14e45f-ceea-467a-9575-1b2c3d4e5f60";
export const HARBOR_ORG_ID = "3c59dc04-8e88-4504-9b9d-2f4a5b6c7d80";
export const FLAGSHIP_REQUEST_ID = "b6d767d2-f8ed-4cb9-9b30-1a2b3c4d5e6f";
export const FLAGSHIP_PUBLIC_SLUG = "overflow-pallet-storage-reno-4f2a";

/** Fixture-only scope key — the API returns org-scoped lists instead. */
export type OrgScopedMember = MemberResponse & { organizationId: string };
export type OrgScopedInvite = InviteResponse & { organizationId: string };
export type OrgScopedJoinRequest = JoinRequestResponse & { organizationId: string };
export type OrgScopedAuditEvent = AuditEventResponse & { organizationId: string };

export type FixtureState = {
  currentUser: BootstrapResponse;
  dashboardOrgs: DashboardOrgResponse[];
  organizations: Record<string, OrgResponse>;
  requests: RequestResponse[];
  quotes: QuoteResponse[];
  members: OrgScopedMember[];
  invites: OrgScopedInvite[];
  joinRequests: OrgScopedJoinRequest[];
  auditEvents: OrgScopedAuditEvent[];
  browsableOrgs: OrgResponse[];
};

export const currentUser: BootstrapResponse = {
  userId: "1679091c-5a88-4faf-b3a6-9f2b4c8d1e70",
  email: "dana.whitfield@cascadedist.com",
  name: "Dana Whitfield",
  memberships: [
    {
      organizationId: CASCADE_ORG_ID,
      organizationName: "Cascade Distribution",
      role: "Owner",
      status: "Active",
    },
    {
      organizationId: HARBOR_ORG_ID,
      organizationName: "Harbor Freight Co-op",
      role: "Member",
      status: "Active",
    },
  ],
  pendingInvites: [],
  joinRequests: [],
};

export const dashboardOrgs: DashboardOrgResponse[] = [
  {
    organizationId: CASCADE_ORG_ID,
    name: "Cascade Distribution",
    description: "Regional distribution, seven DCs across the Great Basin.",
    logoPath: null,
    role: "Owner",
    openRequestCount: 3,
    pendingQuoteCount: 4,
    pendingJoinRequestCount: 2,
  },
  {
    organizationId: HARBOR_ORG_ID,
    name: "Harbor Freight Co-op",
    description: "Shared drayage and cross-dock capacity for member shippers.",
    logoPath: null,
    role: "Member",
    openRequestCount: 1,
    pendingQuoteCount: 0,
    pendingJoinRequestCount: 0,
  },
];

export const organizations: Record<string, OrgResponse> = {
  [CASCADE_ORG_ID]: {
    id: CASCADE_ORG_ID,
    name: "Cascade Distribution",
    description: "Regional distribution, seven DCs across the Great Basin.",
    ownerUserId: currentUser.userId,
    logoPath: null,
  },
  [HARBOR_ORG_ID]: {
    id: HARBOR_ORG_ID,
    name: "Harbor Freight Co-op",
    description: "Shared drayage and cross-dock capacity for member shippers.",
    ownerUserId: "9bf31c7f-f062-4bd4-a4de-5e0a1b2c3d40",
    logoPath: null,
  },
};

export const requests: RequestResponse[] = [
  {
    id: FLAGSHIP_REQUEST_ID,
    organizationId: CASCADE_ORG_ID,
    title: "Overflow pallet storage + weekly outbound",
    description:
      "1,200 pallet positions in the Reno–Sparks corridor for a six month peak. Racked storage, weekly outbound to eleven stores, EDI 856 on despatch. Certificate of insurance required before award.",
    publicSlug: FLAGSHIP_PUBLIC_SLUG,
    status: "Open",
    createdAt: "2026-04-02T16:20:00+00:00",
  },
  {
    id: "c74d97b0-1eae-4b3d-a8b7-6d9c0e1f2a30",
    organizationId: CASCADE_ORG_ID,
    title: "Drayage — Port of Oakland to Sparks DC",
    description:
      "Forty-foot containers, eighteen pulls a week, live unload at the Sparks dock between 06:00 and 14:00.",
    publicSlug: "drayage-oakland-sparks-91bc",
    status: "Open",
    createdAt: "2026-04-09T14:05:00+00:00",
  },
  {
    id: "70efdf2e-c9b0-4a1e-9b2c-3d4e5f607182",
    organizationId: CASCADE_ORG_ID,
    title: "Returns processing and disposition",
    description:
      "Inspect, grade and disposition roughly 400 units a week across three condition codes.",
    publicSlug: "returns-processing-2d7e",
    status: "Open",
    createdAt: "2026-04-14T09:40:00+00:00",
  },
  {
    id: "6f4922f4-5568-4a1e-8e2b-1f3a4b5c6d70",
    organizationId: CASCADE_ORG_ID,
    title: "Seasonal cross-dock, Q4 inbound surge",
    description: "Closed on award to Basin Logistics Partners.",
    publicSlug: "seasonal-crossdock-q4-8a13",
    status: "Closed",
    createdAt: "2025-11-18T11:00:00+00:00",
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    organizationId: HARBOR_ORG_ID,
    title: "Shared cross-dock — member inbound",
    description:
      "Consolidated inbound for co-op members, two shifts a day, palletized freight only.",
    publicSlug: "harbor-crossdock-inbound-3c8f",
    status: "Open",
    createdAt: "2026-04-10T11:30:00+00:00",
  },
];

export const quotes: QuoteResponse[] = [
  {
    id: "1f0e3dad-9990-4b0f-8e5c-2a3b4c5d6e70",
    requestId: FLAGSHIP_REQUEST_ID,
    businessName: "Sierra Warehousing",
    amount: 8.4,
    unit: "Monthly",
    startAt: "2026-05-01T00:00:00+00:00",
    endAt: "2026-10-31T00:00:00+00:00",
    contactName: "Marisol Vega",
    contactPhone: "+1 775 555 0142",
    contactEmail: "mvega@sierrawarehousing.com",
    notes:
      "1,200 positions available in the Sparks facility. COI on file, EDI 856 supported, 12 day lead to first receipt.",
    status: "UnderReview",
    submittedByUserId: null,
  },
  {
    id: "98f13708-2104-4bcd-9a1f-3b4c5d6e7f80",
    requestId: FLAGSHIP_REQUEST_ID,
    businessName: "Basin Logistics Partners",
    amount: 8.95,
    unit: "Monthly",
    startAt: "2026-05-11T00:00:00+00:00",
    endAt: "2026-10-31T00:00:00+00:00",
    contactName: "Errol Banks",
    contactPhone: "+1 775 555 0198",
    contactEmail: "ebanks@basinlp.com",
    notes:
      "1,200 positions, climate controlled aisles. Two docks reserved for the account.",
    status: "Submitted",
    submittedByUserId: null,
  },
  {
    id: "3c59dc04-8e88-4504-9b9d-4c5d6e7f8091",
    requestId: FLAGSHIP_REQUEST_ID,
    businessName: "Truckee Freight Works",
    amount: 7.9,
    unit: "Monthly",
    startAt: "2026-05-31T00:00:00+00:00",
    endAt: "2026-10-31T00:00:00+00:00",
    contactName: "Priya Raman",
    contactPhone: "+1 530 555 0177",
    contactEmail: "praman@truckeefreight.com",
    notes:
      "900 positions available at this rate. No certificate of insurance on file yet. 31 day lead to first receipt.",
    status: "Submitted",
    submittedByUserId: null,
  },
  {
    id: "b6d767d2-f8ed-4cb9-9b30-5d6e7f809112",
    requestId: FLAGSHIP_REQUEST_ID,
    businessName: "Washoe Storage Co.",
    amount: 9.6,
    unit: "Monthly",
    startAt: "2026-05-04T00:00:00+00:00",
    endAt: "2026-10-31T00:00:00+00:00",
    contactName: "Glen Ostrowski",
    contactPhone: null,
    contactEmail: "glen@washoestorage.com",
    notes: "Withdrawn — capacity committed elsewhere.",
    status: "Rejected",
    submittedByUserId: null,
  },
];

/** Positions the flagship request asks for, used to extend the bid figures. */
export const REQUIRED_POSITIONS = 1200;

/** Positions each bidder can actually supply, quoted in their notes. */
export const quotedPositions: Record<string, number> = {
  "Sierra Warehousing": 1200,
  "Basin Logistics Partners": 1200,
  "Truckee Freight Works": 900,
  "Washoe Storage Co.": 1200,
};

export const members: OrgScopedMember[] = [
  {
    membershipId: "aab32389-1b7c-4f2d-8e3a-6e7f80911223",
    organizationId: CASCADE_ORG_ID,
    userId: currentUser.userId,
    email: currentUser.email,
    name: "Dana Whitfield",
    role: "Owner",
    status: "Active",
  },
  {
    membershipId: "9bf31c7f-f062-4bd4-a4de-7f8091122334",
    organizationId: CASCADE_ORG_ID,
    userId: "c9f0f895-fb98-4b1d-9b0a-8091122334455",
    email: "theo.marsh@cascadedist.com",
    name: "Theo Marsh",
    role: "Admin",
    status: "Active",
  },
  {
    membershipId: "45c48cce-2e2d-4fbd-aa1f-911223344556",
    organizationId: CASCADE_ORG_ID,
    userId: "d3d94468-02a4-4a9b-8f4a-1122334455667",
    email: "rae.okonkwo@cascadedist.com",
    name: "Rae Okonkwo",
    role: "Member",
    status: "Active",
  },
  {
    membershipId: "6512bd43-d9ca-4e79-9a1e-223344556677",
    organizationId: CASCADE_ORG_ID,
    userId: "c20ad4d7-6fe9-4779-9a1e-334455667788",
    email: "former.planner@cascadedist.com",
    name: "Jules Ferrante",
    role: "Member",
    status: "Revoked",
  },
  {
    membershipId: "d4c74594-8b1c-4e9a-9f2e-33445566778899",
    organizationId: HARBOR_ORG_ID,
    userId: currentUser.userId,
    email: currentUser.email,
    name: "Dana Whitfield",
    role: "Member",
    status: "Active",
  },
];

export const invites: OrgScopedInvite[] = [
  {
    inviteId: "c51ce410-c124-4f13-9b2a-445566778899",
    organizationId: CASCADE_ORG_ID,
    email: "nadia.pratt@cascadedist.com",
    role: "Admin",
    status: "Pending",
    token: "inv_7f3c9a21be4d",
  },
  {
    inviteId: "aab32389-1b7c-4f2d-8e3a-5566778899aa",
    organizationId: CASCADE_ORG_ID,
    email: "sam.iyer@cascadedist.com",
    role: "Member",
    status: "Pending",
    token: "inv_2b8e14d0af95",
  },
];

export const joinRequests: OrgScopedJoinRequest[] = [
  {
    joinRequestId: "9bf31c7f-f062-4bd4-a4de-66778899aabb",
    organizationId: CASCADE_ORG_ID,
    userId: "c74d97b0-1eae-4b3d-a8b7-778899aabbcc",
    email: "l.carrasco@cascadedist.com",
    status: "Pending",
    message: "Starting on the Sparks account Monday — need to raise requests.",
  },
  {
    joinRequestId: "70efdf2e-c9b0-4a1e-9b2c-8899aabbccdd",
    organizationId: CASCADE_ORG_ID,
    userId: "6f4922f4-5568-4a1e-8e2b-99aabbccddee",
    email: "contractor@northbayops.com",
    status: "Pending",
    message: null,
  },
];

export const auditEvents: OrgScopedAuditEvent[] = [
  {
    id: "1f0e3dad-9990-4b0f-8e5c-aabbccddeeff",
    organizationId: CASCADE_ORG_ID,
    actorUserId: null,
    actorEmail: null,
    action: "quote.submitted",
    entityType: "Quote",
    entityId: "3c59dc04-8e88-4504-9b9d-4c5d6e7f8091",
    occurredAt: "2026-04-16T22:14:00+00:00",
    metadataJson: '{"businessName":"Truckee Freight Works","amount":7.90}',
  },
  {
    id: "98f13708-2104-4bcd-9a1f-bbccddeeff00",
    organizationId: CASCADE_ORG_ID,
    actorUserId: currentUser.userId,
    actorEmail: currentUser.email,
    action: "quote.status_changed",
    entityType: "Quote",
    entityId: "1f0e3dad-9990-4b0f-8e5c-2a3b4c5d6e70",
    occurredAt: "2026-04-16T15:02:00+00:00",
    metadataJson: '{"from":"Submitted","to":"UnderReview"}',
  },
  {
    id: "3c59dc04-8e88-4504-9b9d-ccddeeff0011",
    organizationId: CASCADE_ORG_ID,
    actorUserId: null,
    actorEmail: null,
    action: "quote.submitted",
    entityType: "Quote",
    entityId: "98f13708-2104-4bcd-9a1f-3b4c5d6e7f80",
    occurredAt: "2026-04-15T18:47:00+00:00",
    metadataJson: '{"businessName":"Basin Logistics Partners","amount":8.95}',
  },
  {
    id: "b6d767d2-f8ed-4cb9-9b30-ddeeff001122",
    organizationId: CASCADE_ORG_ID,
    actorUserId: currentUser.userId,
    actorEmail: currentUser.email,
    action: "request.updated",
    entityType: "Request",
    entityId: FLAGSHIP_REQUEST_ID,
    occurredAt: "2026-04-11T10:30:00+00:00",
    metadataJson: '{"positions":1200}',
  },
  {
    id: "aab32389-1b7c-4f2d-8e3a-eeff00112233",
    organizationId: CASCADE_ORG_ID,
    actorUserId: "c9f0f895-fb98-4b1d-9b0a-8091122334455",
    actorEmail: "theo.marsh@cascadedist.com",
    action: "membership.invited",
    entityType: "Invite",
    entityId: "c51ce410-c124-4f13-9b2a-445566778899",
    occurredAt: "2026-04-08T09:15:00+00:00",
    metadataJson: '{"email":"nadia.pratt@cascadedist.com","role":"Admin"}',
  },
  {
    id: "45c48cce-2e2d-4fbd-aa1f-ff0011223344",
    organizationId: CASCADE_ORG_ID,
    actorUserId: currentUser.userId,
    actorEmail: currentUser.email,
    action: "request.created",
    entityType: "Request",
    entityId: FLAGSHIP_REQUEST_ID,
    occurredAt: "2026-04-02T16:20:00+00:00",
    metadataJson: null,
  },
];

/** Organizations a signed-in user without a membership can ask to join. */
export const browsableOrgs: OrgResponse[] = [
  organizations[CASCADE_ORG_ID],
  organizations[HARBOR_ORG_ID],
  {
    id: "c20ad4d7-6fe9-4779-9a1e-0011223344556",
    name: "Sierra Grocers Group",
    description: "Cooperative buying and shared warehousing for 40 independents.",
    ownerUserId: "d3d94468-02a4-4a9b-8f4a-112233445566",
    logoPath: null,
  },
];

/** Deep clone of seed data for the in-memory fixture store. */
export function createInitialState(): FixtureState {
  return structuredClone({
    currentUser,
    dashboardOrgs,
    organizations,
    requests,
    quotes,
    members,
    invites,
    joinRequests,
    auditEvents,
    browsableOrgs,
  });
}

export function getMembers(orgId: string, state: FixtureState): OrgScopedMember[] {
  return state.members.filter((member) => member.organizationId === orgId);
}

export function getInvites(orgId: string, state: FixtureState): OrgScopedInvite[] {
  return state.invites.filter((invite) => invite.organizationId === orgId);
}

export function getJoinRequests(
  orgId: string,
  state: FixtureState,
): OrgScopedJoinRequest[] {
  return state.joinRequests.filter((item) => item.organizationId === orgId);
}

export function getAuditEvents(
  orgId: string,
  state: FixtureState,
): OrgScopedAuditEvent[] {
  return state.auditEvents.filter((event) => event.organizationId === orgId);
}

export function getOrgRequests(orgId: string, state: FixtureState): RequestResponse[] {
  return state.requests.filter((request) => request.organizationId === orgId);
}

export function getRequestQuotes(
  requestId: string,
  state: FixtureState,
): QuoteResponse[] {
  return state.quotes.filter((quote) => quote.requestId === requestId);
}

export function getOrgRole(
  orgId: string,
  state: FixtureState,
): import("./api-types").OrgRole | null {
  const org = state.dashboardOrgs.find((item) => item.organizationId === orgId);
  return org?.role ?? null;
}

/** Maps a full request to the public wire shape. */
export function toPublicRequest(request: RequestResponse): PublicRequestResponse {
  return {
    title: request.title,
    description: request.description,
    status: request.status,
    publicSlug: request.publicSlug,
    acceptingQuotes: request.status === "Open",
  };
}
