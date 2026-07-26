using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using QuoteDepot.Api.Controllers;
using QuoteDepot.Domain.Entities;
using QuoteDepot.Domain.Enums;
using QuoteDepot.Infrastructure.Data;
using QuoteDepot.Tests.Support;

namespace QuoteDepot.Tests;

public class OrganizationApiTests : IClassFixture<QuoteDepotWebApplicationFactory>
{
    private readonly QuoteDepotWebApplicationFactory _factory;

    public OrganizationApiTests(QuoteDepotWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Owner_can_create_org_invite_and_member_accepts()
    {
        var ownerClient = Authed("owner-sub", "owner@example.com", "Owner");
        var create = await ownerClient.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("North Depot", "Cold storage"));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var org = await create.Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var inviteRes = await ownerClient.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/invites",
            new InviteRequest("member@example.com", "Member"));
        Assert.Equal(HttpStatusCode.OK, inviteRes.StatusCode);
        var invite = await inviteRes.Content.ReadFromJsonAsync<InviteResponse>();
        Assert.NotNull(invite);

        var memberClient = Authed("member-sub", "member@example.com", "Member");
        var accept = await memberClient.PostAsJsonAsync(
            "/api/orgs/invites/accept",
            new AcceptInviteRequest(invite.Token));
        Assert.Equal(HttpStatusCode.OK, accept.StatusCode);

        var members = await ownerClient.GetFromJsonAsync<List<MemberResponse>>($"/api/orgs/{org.Id}/members");
        Assert.NotNull(members);
        Assert.Equal(2, members.Count);
        Assert.Contains(members, m => m.Email == "member@example.com" && m.Role == "Member");
    }

    [Fact]
    public async Task Join_request_approve_and_member_cannot_invite()
    {
        var ownerClient = Authed("owner2", "owner2@example.com");
        var org = await (await ownerClient.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("South Depot", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var joinerClient = Authed("joiner", "joiner@example.com");
        var join = await joinerClient.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/join-requests",
            new CreateJoinRequest("Please add me"));
        Assert.Equal(HttpStatusCode.OK, join.StatusCode);
        var joinRequest = await join.Content.ReadFromJsonAsync<JoinRequestResponse>();
        Assert.NotNull(joinRequest);

        var approve = await ownerClient.PostAsync(
            $"/api/orgs/{org.Id}/join-requests/{joinRequest.JoinRequestId}/approve",
            content: null);
        Assert.Equal(HttpStatusCode.NoContent, approve.StatusCode);

        var inviteAsMember = await joinerClient.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/invites",
            new InviteRequest("other@example.com", "Member"));
        Assert.Equal(HttpStatusCode.BadRequest, inviteAsMember.StatusCode);
    }

    [Fact]
    public async Task Admin_cannot_revoke_owner()
    {
        var ownerClient = Authed("owner3", "owner3@example.com");
        var org = await (await ownerClient.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("East Depot", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var invite = await (await ownerClient.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/invites",
                new InviteRequest("admin@example.com", "Admin")))
            .Content.ReadFromJsonAsync<InviteResponse>();
        Assert.NotNull(invite);

        var adminClient = Authed("admin-sub", "admin@example.com");
        await adminClient.PostAsJsonAsync("/api/orgs/invites/accept", new AcceptInviteRequest(invite.Token));

        var members = await ownerClient.GetFromJsonAsync<List<MemberResponse>>($"/api/orgs/{org.Id}/members");
        Assert.NotNull(members);
        var ownerMembership = members.Single(m => m.Role == "Owner");

        var revoke = await adminClient.DeleteAsync($"/api/orgs/{org.Id}/members/{ownerMembership.MembershipId}");
        Assert.Equal(HttpStatusCode.BadRequest, revoke.StatusCode);
    }

    [Fact]
    public async Task Owner_can_resend_invite_after_expiry()
    {
        var owner = Authed("expire-owner", "expire-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Expire Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var ownerUser = db.Users.Single(u => u.Email == "expire-owner@example.com");
            db.Invites.Add(new Invite
            {
                OrganizationId = org.Id,
                Email = "stale@example.com",
                Role = OrgRole.Member,
                Status = InviteStatus.Pending,
                InvitedByUserId = ownerUser.Id,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(-1),
            });
            await db.SaveChangesAsync();
        }

        var resend = await owner.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/invites",
            new InviteRequest("stale@example.com", "Member"));
        Assert.Equal(HttpStatusCode.OK, resend.StatusCode);
    }

    [Fact]
    public async Task Owner_can_change_member_role_admin_cannot()
    {
        var owner = Authed("role-owner", "role-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Role Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var adminInvite = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/invites",
                new InviteRequest("role-admin@example.com", "Admin")))
            .Content.ReadFromJsonAsync<InviteResponse>();
        Assert.NotNull(adminInvite);
        var admin = Authed("role-admin", "role-admin@example.com");
        await admin.PostAsJsonAsync("/api/orgs/invites/accept", new AcceptInviteRequest(adminInvite.Token));

        var memberInvite = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/invites",
                new InviteRequest("role-member@example.com", "Member")))
            .Content.ReadFromJsonAsync<InviteResponse>();
        Assert.NotNull(memberInvite);
        var member = Authed("role-member", "role-member@example.com");
        await member.PostAsJsonAsync("/api/orgs/invites/accept", new AcceptInviteRequest(memberInvite.Token));

        var members = await owner.GetFromJsonAsync<List<MemberResponse>>($"/api/orgs/{org.Id}/members");
        Assert.NotNull(members);
        var memberMembership = members.Single(m => m.Email == "role-member@example.com");

        var adminChange = await admin.PatchAsJsonAsync(
            $"/api/orgs/{org.Id}/members/{memberMembership.MembershipId}/role",
            new ChangeRoleRequest("Admin"));
        Assert.Equal(HttpStatusCode.BadRequest, adminChange.StatusCode);

        var ownerChange = await owner.PatchAsJsonAsync(
            $"/api/orgs/{org.Id}/members/{memberMembership.MembershipId}/role",
            new ChangeRoleRequest("Admin"));
        Assert.Equal(HttpStatusCode.NoContent, ownerChange.StatusCode);

        members = await owner.GetFromJsonAsync<List<MemberResponse>>($"/api/orgs/{org.Id}/members");
        Assert.NotNull(members);
        Assert.Equal("Admin", members.Single(m => m.Email == "role-member@example.com").Role);
    }

    [Fact]
    public async Task Admin_cannot_invite_as_admin()
    {
        var owner = Authed("invite-admin-owner", "invite-admin-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Invite Admin Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var invite = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/invites",
                new InviteRequest("invite-admin@example.com", "Admin")))
            .Content.ReadFromJsonAsync<InviteResponse>();
        Assert.NotNull(invite);

        var admin = Authed("invite-admin", "invite-admin@example.com");
        await admin.PostAsJsonAsync("/api/orgs/invites/accept", new AcceptInviteRequest(invite.Token));

        var asAdmin = await admin.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/invites",
            new InviteRequest("peer@example.com", "Admin"));
        Assert.Equal(HttpStatusCode.BadRequest, asAdmin.StatusCode);

        var asMember = await admin.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/invites",
            new InviteRequest("peer@example.com", "Member"));
        Assert.Equal(HttpStatusCode.OK, asMember.StatusCode);
    }

    [Fact]
    public async Task Approving_join_does_not_demote_existing_admin()
    {
        var owner = Authed("demote-owner", "demote-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Role Preserve Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var admin = Authed("demote-admin", "demote-admin@example.com");
        var join = await (await admin.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/join-requests",
                new CreateJoinRequest("hi")))
            .Content.ReadFromJsonAsync<JoinRequestResponse>();
        Assert.NotNull(join);

        var invite = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/invites",
                new InviteRequest("demote-admin@example.com", "Admin")))
            .Content.ReadFromJsonAsync<InviteResponse>();
        Assert.NotNull(invite);
        await admin.PostAsJsonAsync("/api/orgs/invites/accept", new AcceptInviteRequest(invite.Token));

        var approve = await owner.PostAsync(
            $"/api/orgs/{org.Id}/join-requests/{join.JoinRequestId}/approve",
            content: null);
        Assert.Equal(HttpStatusCode.NoContent, approve.StatusCode);

        var members = await owner.GetFromJsonAsync<List<MemberResponse>>($"/api/orgs/{org.Id}/members");
        Assert.NotNull(members);
        Assert.Equal("Admin", members.Single(m => m.Email == "demote-admin@example.com").Role);
    }

    private HttpClient Authed(string sub, string email, string? name = null)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", DevJwt.Create(sub, email, name));
        return client;
    }
}
