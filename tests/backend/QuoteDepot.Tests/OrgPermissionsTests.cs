using QuoteDepot.Domain.Authorization;
using QuoteDepot.Domain.Enums;

namespace QuoteDepot.Tests;

public class OrgPermissionsTests
{
    [Theory]
    [InlineData(OrgRole.Owner, true)]
    [InlineData(OrgRole.Admin, false)]
    [InlineData(OrgRole.Member, false)]
    public void Approve_join_requests_owner_only(OrgRole role, bool expected)
    {
        Assert.Equal(expected, OrgPermissions.CanApproveJoinRequests(role));
        Assert.Equal(expected, OrgPermissions.CanRejectJoinRequests(role));
    }

    [Theory]
    [InlineData(OrgRole.Owner, true)]
    [InlineData(OrgRole.Admin, true)]
    [InlineData(OrgRole.Member, true)]
    public void View_join_requests_all_members(OrgRole role, bool expected)
    {
        Assert.Equal(expected, OrgPermissions.CanViewJoinRequests(role));
    }

    [Theory]
    [InlineData(OrgRole.Owner, true)]
    [InlineData(OrgRole.Admin, true)]
    [InlineData(OrgRole.Member, false)]
    public void Manage_membership_roles(OrgRole role, bool expected)
    {
        Assert.Equal(expected, OrgPermissions.CanManageMembership(role));
        Assert.Equal(expected, OrgPermissions.CanInvite(role));
        Assert.Equal(expected, OrgPermissions.CanManageQuotes(role));
        Assert.Equal(expected, OrgPermissions.CanAcceptQuotes(role));
        Assert.Equal(expected, OrgPermissions.CanViewAudit(role));
    }

    [Theory]
    [InlineData(OrgRole.Owner, true)]
    [InlineData(OrgRole.Admin, false)]
    [InlineData(OrgRole.Member, false)]
    public void Only_owner_updates_settings_and_roles(OrgRole role, bool expected)
    {
        Assert.Equal(expected, OrgPermissions.CanUpdateOrgSettings(role));
        Assert.Equal(expected, OrgPermissions.CanChangeRoles(role));
    }

    [Theory]
    [InlineData(OrgRole.Owner)]
    [InlineData(OrgRole.Admin)]
    [InlineData(OrgRole.Member)]
    public void Manage_requests_allowed_for_all_roles(OrgRole role)
    {
        Assert.True(OrgPermissions.CanManageRequests(role));
    }

    [Theory]
    [InlineData(OrgRole.Owner, OrgRole.Admin, true)]
    [InlineData(OrgRole.Owner, OrgRole.Member, true)]
    [InlineData(OrgRole.Owner, OrgRole.Owner, false)]
    [InlineData(OrgRole.Admin, OrgRole.Member, true)]
    [InlineData(OrgRole.Admin, OrgRole.Admin, false)]
    [InlineData(OrgRole.Member, OrgRole.Member, false)]
    public void Assign_role_matrix(OrgRole actor, OrgRole target, bool expected)
    {
        Assert.Equal(expected, OrgPermissions.CanAssignRole(actor, target));
    }
}
