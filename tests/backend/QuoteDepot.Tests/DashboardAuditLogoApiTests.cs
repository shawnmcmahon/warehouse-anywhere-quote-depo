using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using QuoteDepot.Api.Controllers;
using QuoteDepot.Api.Services;
using QuoteDepot.Tests.Support;

namespace QuoteDepot.Tests;

public class DashboardAuditLogoApiTests : IClassFixture<QuoteDepotWebApplicationFactory>
{
    private readonly QuoteDepotWebApplicationFactory _factory;

    public DashboardAuditLogoApiTests(QuoteDepotWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Dashboard_summarizes_open_requests_pending_quotes_and_joins()
    {
        var owner = Authed("dash-owner", "dash-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Dash Org", "Summary")))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var request = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/requests",
                new CreateRequestBody("Open RFQ", null)))
            .Content.ReadFromJsonAsync<RequestResponse>();
        Assert.NotNull(request);

        var guest = _factory.CreateClient();
        await guest.PostAsJsonAsync(
            $"/api/public/requests/{request.PublicSlug}/quotes",
            new PublicQuoteBody(
                "Vendor",
                500m,
                "OneTime",
                null,
                null,
                "Casey",
                null,
                "casey@vendor.test",
                null,
                "Submitted"));

        var joiner = Authed("dash-joiner", "dash-joiner@example.com");
        await joiner.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/join-requests",
            new CreateJoinRequest("Let me in"));

        var dashboard = await owner.GetFromJsonAsync<List<DashboardOrgResponse>>("/api/dashboard");
        Assert.NotNull(dashboard);
        var row = Assert.Single(dashboard, d => d.OrganizationId == org.Id);
        Assert.Equal("Owner", row.Role);
        Assert.Equal(1, row.OpenRequestCount);
        Assert.Equal(1, row.PendingQuoteCount);
        Assert.Equal(1, row.PendingJoinRequestCount);
    }

    [Fact]
    public async Task Audit_records_mutations_and_member_cannot_read()
    {
        var owner = Authed("audit-owner", "audit-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Audit Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var invite = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/invites",
                new InviteRequest("audit-member@example.com", "Member")))
            .Content.ReadFromJsonAsync<InviteResponse>();
        Assert.NotNull(invite);

        var member = Authed("audit-member", "audit-member@example.com");
        await member.PostAsJsonAsync("/api/orgs/invites/accept", new AcceptInviteRequest(invite.Token));

        var events = await owner.GetFromJsonAsync<List<AuditEventResponse>>($"/api/orgs/{org.Id}/audit");
        Assert.NotNull(events);
        Assert.Contains(events, e => e.Action == AuditActions.OrganizationCreated);
        Assert.Contains(events, e => e.Action == AuditActions.MembershipInvited);
        Assert.Contains(events, e => e.Action == AuditActions.MembershipInviteAccepted);

        var forbidden = await member.GetAsync($"/api/orgs/{org.Id}/audit");
        Assert.Equal(HttpStatusCode.BadRequest, forbidden.StatusCode);
    }

    [Fact]
    public async Task Owner_can_upload_and_anyone_can_fetch_logo()
    {
        var owner = Authed("logo-owner", "logo-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Logo Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        // Minimal valid 1x1 PNG
        var png = Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

        using var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(png);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(fileContent, "file", "logo.png");

        var upload = await owner.PostAsync($"/api/orgs/{org.Id}/logo", form);
        Assert.Equal(HttpStatusCode.OK, upload.StatusCode);
        var updated = await upload.Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(updated);
        Assert.False(string.IsNullOrWhiteSpace(updated.LogoPath));

        var anonymous = _factory.CreateClient();
        var download = await anonymous.GetAsync($"/api/orgs/{org.Id}/logo");
        Assert.Equal(HttpStatusCode.OK, download.StatusCode);
        Assert.Equal("image/png", download.Content.Headers.ContentType?.MediaType);
        var bytes = await download.Content.ReadAsByteArrayAsync();
        Assert.Equal(png, bytes);

        var audit = await owner.GetFromJsonAsync<List<AuditEventResponse>>($"/api/orgs/{org.Id}/audit");
        Assert.NotNull(audit);
        Assert.Contains(audit, e => e.Action == AuditActions.OrganizationLogoUploaded);
    }

    [Fact]
    public async Task Member_cannot_upload_logo()
    {
        var owner = Authed("logo2-owner", "logo2-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Logo2 Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var invite = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/invites",
                new InviteRequest("logo2-member@example.com", "Member")))
            .Content.ReadFromJsonAsync<InviteResponse>();
        Assert.NotNull(invite);

        var member = Authed("logo2-member", "logo2-member@example.com");
        await member.PostAsJsonAsync("/api/orgs/invites/accept", new AcceptInviteRequest(invite.Token));

        using var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes("not-an-image"));
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(fileContent, "file", "logo.png");

        var upload = await member.PostAsync($"/api/orgs/{org.Id}/logo", form);
        Assert.Equal(HttpStatusCode.BadRequest, upload.StatusCode);
    }

    private HttpClient Authed(string sub, string email, string? name = null)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", DevJwt.Create(sub, email, name));
        return client;
    }
}
