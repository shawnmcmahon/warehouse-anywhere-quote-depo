using QuoteDepot.Domain.Enums;
using QuoteDepot.Domain.Exceptions;

namespace QuoteDepot.Domain.Authorization;

public static class OrgPermissions
{
    public static bool CanManageMembership(OrgRole role) =>
        role is OrgRole.Owner or OrgRole.Admin;

    public static bool CanInvite(OrgRole role) => CanManageMembership(role);

    public static bool CanApproveJoinRequests(OrgRole role) => CanManageMembership(role);

    public static bool CanChangeRoles(OrgRole role) => role == OrgRole.Owner;

    public static bool CanUpdateOrgSettings(OrgRole role) => role == OrgRole.Owner;

    public static bool CanViewAudit(OrgRole role) =>
        role is OrgRole.Owner or OrgRole.Admin;

    public static bool CanManageRequests(OrgRole role) =>
        role is OrgRole.Owner or OrgRole.Admin or OrgRole.Member;

    public static bool CanManageQuotes(OrgRole role) =>
        role is OrgRole.Owner or OrgRole.Admin;

    public static bool CanAcceptQuotes(OrgRole role) => CanManageQuotes(role);

    public static void Ensure(bool allowed, string message)
    {
        if (!allowed)
        {
            throw new DomainException(message);
        }
    }

    public static bool CanAssignRole(OrgRole actorRole, OrgRole targetRole)
    {
        if (targetRole == OrgRole.Owner)
        {
            return false;
        }

        return actorRole switch
        {
            OrgRole.Owner => targetRole is OrgRole.Admin or OrgRole.Member,
            OrgRole.Admin => targetRole == OrgRole.Member,
            _ => false,
        };
    }
}
