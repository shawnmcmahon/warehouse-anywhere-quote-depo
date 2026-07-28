import { canManageOrg, type OrgRole } from "../api-types";
import { endpoints } from "../api/endpoints";
import { useAuth } from "../auth/AuthProvider";
import { useDataRefresh } from "./DataProvider";
import { useApiQuery } from "./use-api-query";

export function useBootstrap() {
  const { bootstrap } = useAuth();
  return bootstrap;
}

export function useDashboardOrgs() {
  const { refreshKey } = useDataRefresh();
  const { status } = useAuth();
  const query = useApiQuery(
    () => endpoints.dashboard.list(),
    [refreshKey],
    { skip: status !== "authenticated" },
  );
  return query;
}

export function useOrg(orgId: string) {
  const { refreshKey } = useDataRefresh();
  const { status } = useAuth();
  const query = useApiQuery(
    () => endpoints.orgs.get(orgId),
    [orgId, refreshKey],
    { skip: !orgId || status !== "authenticated" },
  );
  return query;
}

export function useOrgRole(orgId: string): OrgRole | null {
  const { data: orgs } = useDashboardOrgs();
  const org = orgs?.find((item) => item.organizationId === orgId);
  return org?.role ?? null;
}

export function useCanManageOrg(orgId: string): boolean {
  const role = useOrgRole(orgId);
  return role !== null && canManageOrg(role);
}

export function useOrgRequests(orgId: string) {
  const { refreshKey } = useDataRefresh();
  const { status } = useAuth();
  const query = useApiQuery(
    () => endpoints.orgs.requests.list(orgId),
    [orgId, refreshKey],
    { skip: !orgId || status !== "authenticated" },
  );
  return query;
}

export function useRequest(orgId: string, requestId: string) {
  const { refreshKey } = useDataRefresh();
  const { status } = useAuth();
  const query = useApiQuery(
    () => endpoints.orgs.requests.get(orgId, requestId),
    [orgId, requestId, refreshKey],
    { skip: !orgId || !requestId || status !== "authenticated" },
  );
  return query;
}

export function useRequestQuotes(orgId: string, requestId: string) {
  const { refreshKey } = useDataRefresh();
  const { status } = useAuth();
  const query = useApiQuery(
    () => endpoints.orgs.requests.quotes.list(orgId, requestId),
    [orgId, requestId, refreshKey],
    { skip: !orgId || !requestId || status !== "authenticated" },
  );
  return query;
}

export function usePublicRequest(slug: string) {
  const query = useApiQuery(
    () => endpoints.public.getRequest(slug),
    [slug],
    { skip: !slug },
  );
  return query;
}

export function usePublicOrganization(slug: string) {
  const query = useApiQuery(
    () => endpoints.public.getOrganization(slug),
    [slug],
    { skip: !slug },
  );
  return query;
}

export function useOrgPendingQuotes(orgId: string) {
  const { refreshKey } = useDataRefresh();
  const { status } = useAuth();
  const query = useApiQuery(
    () => endpoints.orgs.quotes.listPending(orgId),
    [orgId, refreshKey],
    { skip: !orgId || status !== "authenticated" },
  );
  return query;
}

export function useOrgMembers(orgId: string) {
  const { refreshKey } = useDataRefresh();
  const { status } = useAuth();
  const query = useApiQuery(
    () => endpoints.orgs.members.list(orgId),
    [orgId, refreshKey],
    { skip: !orgId || status !== "authenticated" },
  );
  return query;
}

export function useOrgInvites(orgId: string) {
  const { refreshKey } = useDataRefresh();
  const { status } = useAuth();
  const query = useApiQuery(
    () => endpoints.orgs.invites.list(orgId),
    [orgId, refreshKey],
    { skip: !orgId || status !== "authenticated" },
  );
  return query;
}

export function useOrgJoinRequests(orgId: string) {
  const { refreshKey } = useDataRefresh();
  const { status } = useAuth();
  const query = useApiQuery(
    () => endpoints.orgs.joinRequests.list(orgId),
    [orgId, refreshKey],
    { skip: !orgId || status !== "authenticated" },
  );
  return query;
}

export function useOrgAuditEvents(orgId: string) {
  const { refreshKey } = useDataRefresh();
  const { status } = useAuth();
  const query = useApiQuery(
    () => endpoints.orgs.audit.list(orgId),
    [orgId, refreshKey],
    { skip: !orgId || status !== "authenticated" },
  );
  return query;
}

export function useBrowsableOrgs() {
  const { refreshKey } = useDataRefresh();
  const { status } = useAuth();
  const query = useApiQuery(
    () => endpoints.orgs.list(),
    [refreshKey],
    { skip: status !== "authenticated" },
  );
  return query;
}

export { useDataRefresh } from "./DataProvider";
export { endpoints } from "../api/endpoints";
