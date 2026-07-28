import type {
  AuditEventResponse,
  BootstrapResponse,
  DashboardOrgResponse,
  InviteResponse,
  JoinRequestResponse,
  MemberResponse,
  OrgResponse,
  OrgRole,
  PublicRequestResponse,
  PublicOrganizationResponse,
  PendingQuoteResponse,
  QuoteResponse,
  QuoteStatus,
  QuoteUnit,
  RequestResponse,
  RequestStatus,
} from "../api-types";
import { api, apiForm } from "./client";

export const endpoints = {
  me: {
    bootstrap: () => api<BootstrapResponse>("/me/bootstrap", { method: "POST" }),
  },
  dashboard: {
    list: () => api<DashboardOrgResponse[]>("/dashboard"),
  },
  orgs: {
    list: () => api<OrgResponse[]>("/orgs"),
    get: (orgId: string) => api<OrgResponse>(`/orgs/${orgId}`),
    create: (body: { name: string; description?: string | null }) =>
      api<OrgResponse>("/orgs", { method: "POST", body }),
    update: (
      orgId: string,
      body: { name: string; description?: string | null },
    ) => api<OrgResponse>(`/orgs/${orgId}`, { method: "PUT", body }),
    uploadLogo: (orgId: string, file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiForm<OrgResponse>(`/orgs/${orgId}/logo`, form);
    },
    logoUrl: (orgId: string) => `/api/orgs/${orgId}/logo`,
    members: {
      list: (orgId: string) =>
        api<MemberResponse[]>(`/orgs/${orgId}/members`),
      changeRole: (orgId: string, membershipId: string, role: OrgRole) =>
        api<void>(`/orgs/${orgId}/members/${membershipId}/role`, {
          method: "PATCH",
          body: { role },
        }),
      revoke: (orgId: string, membershipId: string) =>
        api<void>(`/orgs/${orgId}/members/${membershipId}`, {
          method: "DELETE",
        }),
    },
    invites: {
      list: (orgId: string) =>
        api<InviteResponse[]>(`/orgs/${orgId}/invites`),
      create: (orgId: string, body: { email: string; role: OrgRole }) =>
        api<InviteResponse>(`/orgs/${orgId}/invites`, {
          method: "POST",
          body,
        }),
      revoke: (orgId: string, inviteId: string) =>
        api<void>(`/orgs/${orgId}/invites/${inviteId}`, {
          method: "DELETE",
        }),
      accept: (token: string) =>
        api<MemberResponse>("/orgs/invites/accept", {
          method: "POST",
          body: { token },
        }),
    },
    joinRequests: {
      create: (orgId: string, body: { message?: string | null }) =>
        api<JoinRequestResponse>(`/orgs/${orgId}/join-requests`, {
          method: "POST",
          body,
        }),
      list: (orgId: string) =>
        api<JoinRequestResponse[]>(`/orgs/${orgId}/join-requests`),
      approve: (orgId: string, joinRequestId: string) =>
        api<void>(
          `/orgs/${orgId}/join-requests/${joinRequestId}/approve`,
          { method: "POST" },
        ),
      reject: (orgId: string, joinRequestId: string) =>
        api<void>(
          `/orgs/${orgId}/join-requests/${joinRequestId}/reject`,
          { method: "POST" },
        ),
    },
    audit: {
      list: (orgId: string, take = 100) =>
        api<AuditEventResponse[]>(`/orgs/${orgId}/audit?take=${take}`),
    },
    requests: {
      list: (orgId: string) =>
        api<RequestResponse[]>(`/orgs/${orgId}/requests`),
      get: (orgId: string, requestId: string) =>
        api<RequestResponse>(`/orgs/${orgId}/requests/${requestId}`),
      create: (
        orgId: string,
        body: { title: string; description?: string | null },
      ) =>
        api<RequestResponse>(`/orgs/${orgId}/requests`, {
          method: "POST",
          body,
        }),
      transition: (
        orgId: string,
        requestId: string,
        status: RequestStatus,
      ) =>
        api<RequestResponse>(
          `/orgs/${orgId}/requests/${requestId}/status`,
          { method: "POST", body: { status } },
        ),
      quotes: {
        list: (orgId: string, requestId: string) =>
          api<QuoteResponse[]>(
            `/orgs/${orgId}/requests/${requestId}/quotes`,
          ),
        transition: (
          orgId: string,
          requestId: string,
          quoteId: string,
          status: QuoteStatus,
        ) =>
          api<QuoteResponse>(
            `/orgs/${orgId}/requests/${requestId}/quotes/${quoteId}/status`,
            { method: "POST", body: { status } },
          ),
        accept: (orgId: string, requestId: string, quoteId: string) =>
          api<void>(
            `/orgs/${orgId}/requests/${requestId}/quotes/${quoteId}/accept`,
            { method: "POST" },
          ),
      },
    },
    quotes: {
      listPending: (orgId: string) =>
        api<PendingQuoteResponse[]>(`/orgs/${orgId}/quotes/pending`),
    },
  },
  public: {
    getOrganization: (slug: string) =>
      api<PublicOrganizationResponse>(`/public/orgs/${slug}`, { auth: false }),
    getRequest: (slug: string) =>
      api<PublicRequestResponse>(`/public/requests/${slug}`, { auth: false }),
    submitQuote: (
      slug: string,
      body: {
        businessName: string;
        amount: number;
        unit: QuoteUnit;
        startAt: string | null;
        endAt: string | null;
        contactName: string;
        contactPhone: string | null;
        contactEmail: string;
        notes: string | null;
        status?: "Draft" | "Submitted" | null;
      },
    ) =>
      api<QuoteResponse>(`/public/requests/${slug}/quotes`, {
        method: "POST",
        auth: false,
        body,
      }),
  },
};
