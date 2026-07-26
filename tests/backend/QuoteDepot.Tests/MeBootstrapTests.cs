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

public class MeBootstrapTests : IClassFixture<QuoteDepotWebApplicationFactory>
{
    private readonly QuoteDepotWebApplicationFactory _factory;

    public MeBootstrapTests(QuoteDepotWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Bootstrap_requires_auth()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsync("/api/me/bootstrap", content: null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Bootstrap_creates_user_and_returns_empty_memberships()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", DevJwt.Create("sub-new", "new@example.com", "New User"));

        var response = await client.PostAsync("/api/me/bootstrap", content: null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<BootstrapResponse>();
        Assert.NotNull(body);
        Assert.Equal("new@example.com", body.Email);
        Assert.Equal("New User", body.Name);
        Assert.Empty(body.Memberships);
        Assert.Empty(body.PendingInvites);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.NotNull(await db.Users.FindAsync(body.UserId));
    }

    [Fact]
    public async Task Bootstrap_is_idempotent_and_syncs_profile()
    {
        var client = _factory.CreateClient();
        var firstToken = DevJwt.Create("sub-sync", "sync@example.com", "Before");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", firstToken);
        var first = await client.PostAsync("/api/me/bootstrap", content: null);
        var firstBody = await first.Content.ReadFromJsonAsync<BootstrapResponse>();
        Assert.NotNull(firstBody);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            DevJwt.Create("sub-sync", "sync@example.com", "After"));
        var second = await client.PostAsync("/api/me/bootstrap", content: null);
        var secondBody = await second.Content.ReadFromJsonAsync<BootstrapResponse>();
        Assert.NotNull(secondBody);
        Assert.Equal(firstBody.UserId, secondBody.UserId);
        Assert.Equal("After", secondBody.Name);
    }

    [Fact]
    public async Task Bootstrap_includes_active_memberships_and_pending_invites()
    {
        var sub = $"sub-{Guid.NewGuid():N}";
        var email = $"{Guid.NewGuid():N}@example.com";

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var owner = new User { CognitoSub = $"owner-{Guid.NewGuid():N}", Email = "owner@example.com" };
            var org = new Organization { Name = "Acme Warehousing", OwnerUserId = owner.Id, Owner = owner };
            db.Users.Add(owner);
            db.Organizations.Add(org);
            db.Invites.Add(new Invite
            {
                OrganizationId = org.Id,
                Email = email,
                Role = OrgRole.Member,
                Status = InviteStatus.Pending,
                InvitedByUserId = owner.Id,
            });
            await db.SaveChangesAsync();
        }

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", DevJwt.Create(sub, email, "Invitee"));

        var response = await client.PostAsync("/api/me/bootstrap", content: null);
        var body = await response.Content.ReadFromJsonAsync<BootstrapResponse>();
        Assert.NotNull(body);
        Assert.Single(body.PendingInvites);
        Assert.Equal("Acme Warehousing", body.PendingInvites[0].OrganizationName);
        Assert.Equal("Member", body.PendingInvites[0].Role);
    }

    [Fact]
    public async Task Bootstrap_matches_pending_invites_case_insensitively()
    {
        var sub = $"sub-{Guid.NewGuid():N}";

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var owner = new User { CognitoSub = $"owner-{Guid.NewGuid():N}", Email = "owner-case@example.com" };
            var org = new Organization { Name = "Case Org", OwnerUserId = owner.Id, Owner = owner };
            db.Users.Add(owner);
            db.Organizations.Add(org);
            db.Invites.Add(new Invite
            {
                OrganizationId = org.Id,
                Email = "user@example.com",
                Role = OrgRole.Member,
                Status = InviteStatus.Pending,
                InvitedByUserId = owner.Id,
            });
            await db.SaveChangesAsync();
        }

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", DevJwt.Create(sub, "User@Example.com", "Cased"));

        var body = await (await client.PostAsync("/api/me/bootstrap", content: null))
            .Content.ReadFromJsonAsync<BootstrapResponse>();
        Assert.NotNull(body);
        Assert.Equal("user@example.com", body.Email);
        Assert.Single(body.PendingInvites);
        Assert.Equal("Case Org", body.PendingInvites[0].OrganizationName);
    }
}
