/**
 * Wire shapes for the QuoteDepot API.
 *
 * These mirror the C# response records exactly, including ASP.NET's default
 * camelCase property naming and the fact that every enum crosses the wire as
 * its PascalCase name rather than an integer. Screens are typed against these
 * so that swapping fixtures for real fetches is a change of data source and
 * nothing else.
 */

export type OrgRole = "Owner" | "Admin" | "Member";
export type MembershipStatus = "Active" | "Revoked";
export type InviteStatus = "Pending" | "Accepted" | "Revoked" | "Expired";
export type JoinRequestStatus = "Pending" | "Approved" | "Rejected";
export type RequestStatus = "Open" | "Closed" | "Cancelled";
export type QuoteStatus =
  | "Draft"
  | "Submitted"
  | "UnderReview"
  | "Accepted"
  | "Rejected";
export type QuoteUnit = "OneTime" | "Monthly" | "Weekly";

/** Every handled API failure returns this shape with a 4xx status. */
export type ApiErrorBody = { error: string };

export type OrgResponse = {
  id: string;
  name: string;
  description: string | null;
  ownerUserId: string;
  logoPath: string | null;
};

export type MemberResponse = {
  membershipId: string;
  userId: string;
  email: string | null;
  name: string | null;
  role: OrgRole;
  status: MembershipStatus;
};

export type InviteResponse = {
  inviteId: string;
  email: string;
  role: OrgRole;
  status: InviteStatus;
  token: string;
};

export type JoinRequestResponse = {
  joinRequestId: string;
  userId: string;
  email: string | null;
  status: JoinRequestStatus;
  message: string | null;
};

export type RequestResponse = {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  publicSlug: string;
  status: RequestStatus;
  createdAt: string;
};

export type QuoteResponse = {
  id: string;
  requestId: string;
  businessName: string;
  amount: number;
  unit: QuoteUnit;
  startAt: string | null;
  endAt: string | null;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string;
  notes: string | null;
  status: QuoteStatus;
  submittedByUserId: string | null;
};

export type PublicRequestResponse = {
  title: string;
  description: string | null;
  status: RequestStatus;
  publicSlug: string;
  acceptingQuotes: boolean;
};

export type DashboardOrgResponse = {
  organizationId: string;
  name: string;
  description: string | null;
  logoPath: string | null;
  role: OrgRole;
  openRequestCount: number;
  pendingQuoteCount: number;
  pendingJoinRequestCount: number;
};

export type AuditEventResponse = {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  occurredAt: string;
  metadataJson: string | null;
};

export type MembershipSummary = {
  organizationId: string;
  organizationName: string;
  role: OrgRole;
  status: MembershipStatus;
};

export type PendingInviteSummary = {
  inviteId: string;
  organizationId: string;
  organizationName: string;
  role: OrgRole;
  email: string;
};

export type JoinRequestSummary = {
  joinRequestId: string;
  organizationId: string;
  organizationName: string;
  status: JoinRequestStatus;
};

export type BootstrapResponse = {
  userId: string;
  email: string;
  name: string | null;
  memberships: MembershipSummary[];
  pendingInvites: PendingInviteSummary[];
  joinRequests: JoinRequestSummary[];
};

/** Transitions the API will accept, mirroring the domain state machines. */
export const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  Draft: ["Submitted"],
  Submitted: ["UnderReview", "Rejected"],
  UnderReview: ["Accepted", "Rejected"],
  Accepted: [],
  Rejected: [],
};

export const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  Open: ["Closed", "Cancelled"],
  Closed: [],
  Cancelled: [],
};

/** Owner and Admin may manage quotes and membership; Member may not. */
export function canManageOrg(role: OrgRole): boolean {
  return role === "Owner" || role === "Admin";
}
