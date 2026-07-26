import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  QUOTE_TRANSITIONS,
  REQUEST_TRANSITIONS,
  type OrgRole,
  type QuoteStatus,
  type QuoteUnit,
  type RequestStatus,
} from "./api-types";
import {
  createInitialState,
  currentUser as seedUser,
  type FixtureState,
} from "./fixtures";

type NewQuoteInput = {
  businessName: string;
  amount: number;
  unit: QuoteUnit;
  startAt: string | null;
  endAt: string | null;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string;
  notes: string | null;
};

type FixtureAction =
  | {
      type: "CREATE_REQUEST";
      orgId: string;
      title: string;
      description: string | null;
    }
  | { type: "TRANSITION_REQUEST"; requestId: string; status: RequestStatus }
  | { type: "TRANSITION_QUOTE"; quoteId: string; status: QuoteStatus }
  | { type: "ACCEPT_QUOTE"; quoteId: string }
  | { type: "SUBMIT_QUOTE"; requestId: string; quote: NewQuoteInput }
  | {
      type: "UPDATE_ORG";
      orgId: string;
      name: string;
      description: string | null;
    }
  | { type: "CREATE_INVITE"; orgId: string; email: string; role: OrgRole }
  | { type: "REVOKE_INVITE"; inviteId: string }
  | { type: "APPROVE_JOIN"; joinRequestId: string }
  | { type: "REJECT_JOIN"; joinRequestId: string }
  | { type: "CREATE_ORG"; name: string; description: string | null }
  | { type: "REVOKE_MEMBER"; membershipId: string }
  | { type: "RESTORE_MEMBER"; membershipId: string };

function newId(): string {
  return crypto.randomUUID();
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
  return `${base || "request"}-${Math.random().toString(36).slice(2, 6)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function appendAudit(
  _state: FixtureState,
  orgId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadataJson: string | null = null,
): OrgScopedAuditPatch {
  return {
    id: newId(),
    organizationId: orgId,
    actorUserId: seedUser.userId,
    actorEmail: seedUser.email,
    action,
    entityType,
    entityId,
    occurredAt: nowIso(),
    metadataJson,
  };
}

type OrgScopedAuditPatch = FixtureState["auditEvents"][number];

function recalcDashboardCounts(state: FixtureState, orgId: string): FixtureState {
  const orgRequests = state.requests.filter((r) => r.organizationId === orgId);
  const openRequestCount = orgRequests.filter((r) => r.status === "Open").length;
  const requestIds = new Set(orgRequests.map((r) => r.id));
  const pendingQuoteCount = state.quotes.filter(
    (q) =>
      requestIds.has(q.requestId) &&
      (q.status === "Submitted" || q.status === "UnderReview"),
  ).length;
  const pendingJoinRequestCount = state.joinRequests.filter(
    (j) => j.organizationId === orgId && j.status === "Pending",
  ).length;

  return {
    ...state,
    dashboardOrgs: state.dashboardOrgs.map((org) =>
      org.organizationId === orgId
        ? { ...org, openRequestCount, pendingQuoteCount, pendingJoinRequestCount }
        : org,
    ),
  };
}

function fixtureReducer(state: FixtureState, action: FixtureAction): FixtureState {
  switch (action.type) {
    case "CREATE_REQUEST": {
      const requestId = newId();
      const request = {
        id: requestId,
        organizationId: action.orgId,
        title: action.title,
        description: action.description,
        publicSlug: slugify(action.title),
        status: "Open" as const,
        createdAt: nowIso(),
      };
      const audit = appendAudit(
        state,
        action.orgId,
        "request.created",
        "Request",
        requestId,
      );
      const next = recalcDashboardCounts(
        {
          ...state,
          requests: [request, ...state.requests],
          auditEvents: [audit, ...state.auditEvents],
        },
        action.orgId,
      );
      return next;
    }

    case "TRANSITION_REQUEST": {
      const request = state.requests.find((r) => r.id === action.requestId);
      if (!request) return state;
      const allowed = REQUEST_TRANSITIONS[request.status];
      if (!allowed.includes(action.status)) return state;

      const audit = appendAudit(
        state,
        request.organizationId,
        "request.status_changed",
        "Request",
        request.id,
        JSON.stringify({ from: request.status, to: action.status }),
      );
      const next = recalcDashboardCounts(
        {
          ...state,
          requests: state.requests.map((r) =>
            r.id === action.requestId ? { ...r, status: action.status } : r,
          ),
          auditEvents: [audit, ...state.auditEvents],
        },
        request.organizationId,
      );
      return next;
    }

    case "TRANSITION_QUOTE": {
      const quote = state.quotes.find((q) => q.id === action.quoteId);
      if (!quote) return state;
      const allowed = QUOTE_TRANSITIONS[quote.status];
      if (!allowed.includes(action.status)) return state;

      const request = state.requests.find((r) => r.id === quote.requestId);
      if (!request) return state;

      const audit = appendAudit(
        state,
        request.organizationId,
        "quote.status_changed",
        "Quote",
        quote.id,
        JSON.stringify({ from: quote.status, to: action.status }),
      );
      return {
        ...state,
        quotes: state.quotes.map((q) =>
          q.id === action.quoteId ? { ...q, status: action.status } : q,
        ),
        auditEvents: [audit, ...state.auditEvents],
      };
    }

    case "ACCEPT_QUOTE": {
      const quote = state.quotes.find((q) => q.id === action.quoteId);
      if (!quote || !QUOTE_TRANSITIONS[quote.status].includes("Accepted")) {
        return state;
      }

      const request = state.requests.find((r) => r.id === quote.requestId);
      if (!request) return state;

      const acceptAudit = appendAudit(
        state,
        request.organizationId,
        "quote.status_changed",
        "Quote",
        quote.id,
        JSON.stringify({ from: quote.status, to: "Accepted" }),
      );
      const closeAudit = appendAudit(
        state,
        request.organizationId,
        "request.status_changed",
        "Request",
        request.id,
        JSON.stringify({ from: request.status, to: "Closed" }),
      );

      const next = recalcDashboardCounts(
        {
          ...state,
          quotes: state.quotes.map((q) => {
            if (q.id === action.quoteId) return { ...q, status: "Accepted" as const };
            if (
              q.requestId === quote.requestId &&
              q.status !== "Rejected" &&
              q.status !== "Accepted"
            ) {
              return { ...q, status: "Rejected" as const };
            }
            return q;
          }),
          requests: state.requests.map((r) =>
            r.id === quote.requestId ? { ...r, status: "Closed" as const } : r,
          ),
          auditEvents: [closeAudit, acceptAudit, ...state.auditEvents],
        },
        request.organizationId,
      );
      return next;
    }

    case "SUBMIT_QUOTE": {
      const request = state.requests.find((r) => r.id === action.requestId);
      if (!request || request.status !== "Open") return state;

      const quoteId = newId();
      const quote = {
        id: quoteId,
        requestId: action.requestId,
        ...action.quote,
        status: "Submitted" as const,
        submittedByUserId: null,
      };
      const audit = appendAudit(
        state,
        request.organizationId,
        "quote.submitted",
        "Quote",
        quoteId,
        JSON.stringify({
          businessName: action.quote.businessName,
          amount: action.quote.amount,
        }),
      );
      return recalcDashboardCounts(
        {
          ...state,
          quotes: [...state.quotes, quote],
          auditEvents: [audit, ...state.auditEvents],
        },
        request.organizationId,
      );
    }

    case "UPDATE_ORG": {
      const org = state.organizations[action.orgId];
      if (!org) return state;

      const audit = appendAudit(
        state,
        action.orgId,
        "organization.updated",
        "Organization",
        action.orgId,
      );
      return {
        ...state,
        organizations: {
          ...state.organizations,
          [action.orgId]: {
            ...org,
            name: action.name,
            description: action.description,
          },
        },
        dashboardOrgs: state.dashboardOrgs.map((item) =>
          item.organizationId === action.orgId
            ? { ...item, name: action.name, description: action.description }
            : item,
        ),
        auditEvents: [audit, ...state.auditEvents],
      };
    }

    case "CREATE_INVITE": {
      const inviteId = newId();
      const invite = {
        inviteId,
        organizationId: action.orgId,
        email: action.email,
        role: action.role,
        status: "Pending" as const,
        token: `inv_${Math.random().toString(36).slice(2, 14)}`,
      };
      const audit = appendAudit(
        state,
        action.orgId,
        "membership.invited",
        "Invite",
        inviteId,
        JSON.stringify({ email: action.email, role: action.role }),
      );
      return {
        ...state,
        invites: [...state.invites, invite],
        auditEvents: [audit, ...state.auditEvents],
      };
    }

    case "REVOKE_INVITE": {
      const invite = state.invites.find((i) => i.inviteId === action.inviteId);
      if (!invite) return state;
      return {
        ...state,
        invites: state.invites.filter((i) => i.inviteId !== action.inviteId),
      };
    }

    case "APPROVE_JOIN": {
      const join = state.joinRequests.find(
        (j) => j.joinRequestId === action.joinRequestId,
      );
      if (!join || join.status !== "Pending") return state;

      const membershipId = newId();
      const member = {
        membershipId,
        organizationId: join.organizationId,
        userId: join.userId,
        email: join.email,
        name: null,
        role: "Member" as const,
        status: "Active" as const,
      };
      const audit = appendAudit(
        state,
        join.organizationId,
        "membership.approved",
        "JoinRequest",
        join.joinRequestId,
      );
      return recalcDashboardCounts(
        {
          ...state,
          joinRequests: state.joinRequests.map((j) =>
            j.joinRequestId === action.joinRequestId
              ? { ...j, status: "Approved" as const }
              : j,
          ),
          members: [...state.members, member],
          auditEvents: [audit, ...state.auditEvents],
        },
        join.organizationId,
      );
    }

    case "REJECT_JOIN": {
      const join = state.joinRequests.find(
        (j) => j.joinRequestId === action.joinRequestId,
      );
      if (!join || join.status !== "Pending") return state;

      const audit = appendAudit(
        state,
        join.organizationId,
        "membership.rejected",
        "JoinRequest",
        join.joinRequestId,
      );
      return recalcDashboardCounts(
        {
          ...state,
          joinRequests: state.joinRequests.map((j) =>
            j.joinRequestId === action.joinRequestId
              ? { ...j, status: "Rejected" as const }
              : j,
          ),
          auditEvents: [audit, ...state.auditEvents],
        },
        join.organizationId,
      );
    }

    case "CREATE_ORG": {
      const orgId = newId();
      const org = {
        id: orgId,
        name: action.name,
        description: action.description,
        ownerUserId: seedUser.userId,
        logoPath: null,
      };
      const membership = {
        membershipId: newId(),
        organizationId: orgId,
        userId: seedUser.userId,
        email: seedUser.email,
        name: seedUser.name,
        role: "Owner" as const,
        status: "Active" as const,
      };
      const dashboardOrg = {
        organizationId: orgId,
        name: action.name,
        description: action.description,
        logoPath: null,
        role: "Owner" as const,
        openRequestCount: 0,
        pendingQuoteCount: 0,
        pendingJoinRequestCount: 0,
      };
      const audit = appendAudit(
        state,
        orgId,
        "organization.created",
        "Organization",
        orgId,
      );
      return {
        ...state,
        organizations: { ...state.organizations, [orgId]: org },
        dashboardOrgs: [...state.dashboardOrgs, dashboardOrg],
        members: [...state.members, membership],
        currentUser: {
          ...state.currentUser,
          memberships: [
            ...state.currentUser.memberships,
            {
              organizationId: orgId,
              organizationName: action.name,
              role: "Owner" as const,
              status: "Active" as const,
            },
          ],
        },
        auditEvents: [audit, ...state.auditEvents],
      };
    }

    case "REVOKE_MEMBER": {
      return {
        ...state,
        members: state.members.map((m) =>
          m.membershipId === action.membershipId
            ? { ...m, status: "Revoked" as const }
            : m,
        ),
      };
    }

    case "RESTORE_MEMBER": {
      return {
        ...state,
        members: state.members.map((m) =>
          m.membershipId === action.membershipId
            ? { ...m, status: "Active" as const }
            : m,
        ),
      };
    }

    default:
      return state;
  }
}

type FixtureStoreValue = {
  state: FixtureState;
  dispatch: React.Dispatch<FixtureAction>;
};

const FixtureStoreContext = createContext<FixtureStoreValue | null>(null);

export function FixtureStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    fixtureReducer,
    undefined,
    createInitialState,
  );
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <FixtureStoreContext.Provider value={value}>
      {children}
    </FixtureStoreContext.Provider>
  );
}

export function useFixtureStore(): FixtureStoreValue {
  const value = useContext(FixtureStoreContext);
  if (!value) {
    throw new Error("useFixtureStore must be used within FixtureStoreProvider");
  }
  return value;
}

export type { FixtureAction, NewQuoteInput };
