using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using QuoteDepot.Api.Controllers;
using QuoteDepot.Tests.Support;

namespace QuoteDepot.Tests;

public class RequestQuoteApiTests : IClassFixture<QuoteDepotWebApplicationFactory>
{
    private readonly QuoteDepotWebApplicationFactory _factory;

    public RequestQuoteApiTests(QuoteDepotWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Guest_can_submit_quote_and_admin_accepts_exclusively()
    {
        var owner = Authed("rq-owner", "rq-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Quote Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var request = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/requests",
                new CreateRequestBody("Pallet racking", "Need 40 bays")))
            .Content.ReadFromJsonAsync<RequestResponse>();
        Assert.NotNull(request);
        Assert.False(string.IsNullOrWhiteSpace(request.PublicSlug));

        var guest = _factory.CreateClient();
        var publicInfo = await guest.GetFromJsonAsync<PublicRequestResponse>(
            $"/api/public/requests/{request.PublicSlug}");
        Assert.NotNull(publicInfo);
        Assert.True(publicInfo.AcceptingQuotes);

        var q1 = await (await guest.PostAsJsonAsync(
                $"/api/public/requests/{request.PublicSlug}/quotes",
                new PublicQuoteBody(
                    "Vendor A",
                    1000m,
                    "OneTime",
                    null,
                    null,
                    "Alice",
                    null,
                    "alice@vendor.test",
                    null,
                    "Submitted")))
            .Content.ReadFromJsonAsync<QuoteResponse>();
        Assert.NotNull(q1);

        var q2 = await (await guest.PostAsJsonAsync(
                $"/api/public/requests/{request.PublicSlug}/quotes",
                new PublicQuoteBody(
                    "Vendor B",
                    900m,
                    "Monthly",
                    null,
                    null,
                    "Bob",
                    "555-0100",
                    "bob@vendor.test",
                    "Includes install",
                    "Submitted")))
            .Content.ReadFromJsonAsync<QuoteResponse>();
        Assert.NotNull(q2);

        var review1 = await owner.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{q1.Id}/status",
            new TransitionQuoteBody("UnderReview"));
        Assert.Equal(HttpStatusCode.OK, review1.StatusCode);

        var review2 = await owner.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{q2.Id}/status",
            new TransitionQuoteBody("UnderReview"));
        Assert.Equal(HttpStatusCode.OK, review2.StatusCode);

        var accept = await owner.PostAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{q1.Id}/accept",
            content: null);
        Assert.Equal(HttpStatusCode.NoContent, accept.StatusCode);

        var quotes = await owner.GetFromJsonAsync<List<QuoteResponse>>(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes");
        Assert.NotNull(quotes);
        Assert.Equal("Accepted", quotes.Single(q => q.Id == q1.Id).Status);
        Assert.Equal("Rejected", quotes.Single(q => q.Id == q2.Id).Status);

        var closed = await owner.GetFromJsonAsync<RequestResponse>(
            $"/api/orgs/{org.Id}/requests/{request.Id}");
        Assert.NotNull(closed);
        Assert.Equal("Closed", closed.Status);

        var lateSubmit = await guest.PostAsJsonAsync(
            $"/api/public/requests/{request.PublicSlug}/quotes",
            new PublicQuoteBody(
                "Vendor C",
                800m,
                "OneTime",
                null,
                null,
                "Carol",
                null,
                "carol@vendor.test",
                null,
                null));
        Assert.Equal(HttpStatusCode.BadRequest, lateSubmit.StatusCode);
    }

    [Fact]
    public async Task Member_cannot_transition_or_accept_quote()
    {
        var owner = Authed("rq-owner2", "rq-owner2@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Member Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var invite = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/invites",
                new InviteRequest("rq-member@example.com", "Member")))
            .Content.ReadFromJsonAsync<InviteResponse>();
        Assert.NotNull(invite);

        var member = Authed("rq-member", "rq-member@example.com");
        await member.PostAsJsonAsync("/api/orgs/invites/accept", new AcceptInviteRequest(invite.Token));

        var request = await (await member.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/requests",
                new CreateRequestBody("Member RFQ", null)))
            .Content.ReadFromJsonAsync<RequestResponse>();
        Assert.NotNull(request);

        var guest = _factory.CreateClient();
        var quote = await (await guest.PostAsJsonAsync(
                $"/api/public/requests/{request.PublicSlug}/quotes",
                new PublicQuoteBody(
                    "Vendor",
                    10m,
                    "OneTime",
                    null,
                    null,
                    "Pat",
                    null,
                    "pat@test.com",
                    null,
                    "Submitted")))
            .Content.ReadFromJsonAsync<QuoteResponse>();
        Assert.NotNull(quote);

        var memberTransition = await member.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{quote.Id}/status",
            new TransitionQuoteBody("UnderReview"));
        Assert.Equal(HttpStatusCode.BadRequest, memberTransition.StatusCode);

        await owner.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{quote.Id}/status",
            new TransitionQuoteBody("UnderReview"));

        var accept = await member.PostAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{quote.Id}/accept",
            content: null);
        Assert.Equal(HttpStatusCode.BadRequest, accept.StatusCode);
    }

    [Fact]
    public async Task Public_quote_rejects_undefined_unit_values()
    {
        var owner = Authed("rq-owner3", "rq-owner3@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Unit Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);
        var request = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/requests",
                new CreateRequestBody("Unit RFQ", null)))
            .Content.ReadFromJsonAsync<RequestResponse>();
        Assert.NotNull(request);

        var guest = _factory.CreateClient();
        var response = await guest.PostAsJsonAsync(
            $"/api/public/requests/{request.PublicSlug}/quotes",
            new PublicQuoteBody(
                "Vendor",
                10m,
                "999",
                null,
                null,
                "Pat",
                null,
                "pat@test.com",
                null,
                null));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Admin_can_transition_and_accept_quote()
    {
        var owner = Authed("rq-admin-owner", "rq-admin-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Admin Quote Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var invite = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/invites",
                new InviteRequest("rq-admin@example.com", "Admin")))
            .Content.ReadFromJsonAsync<InviteResponse>();
        Assert.NotNull(invite);

        var admin = Authed("rq-admin", "rq-admin@example.com");
        await admin.PostAsJsonAsync("/api/orgs/invites/accept", new AcceptInviteRequest(invite.Token));

        var request = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/requests",
                new CreateRequestBody("Admin RFQ", null)))
            .Content.ReadFromJsonAsync<RequestResponse>();
        Assert.NotNull(request);

        var guest = _factory.CreateClient();
        var quote = await (await guest.PostAsJsonAsync(
                $"/api/public/requests/{request.PublicSlug}/quotes",
                new PublicQuoteBody(
                    "Vendor",
                    250m,
                    "OneTime",
                    null,
                    null,
                    "Ada",
                    null,
                    "ada@vendor.test",
                    null,
                    "Submitted")))
            .Content.ReadFromJsonAsync<QuoteResponse>();
        Assert.NotNull(quote);

        var review = await admin.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{quote.Id}/status",
            new TransitionQuoteBody("UnderReview"));
        Assert.Equal(HttpStatusCode.OK, review.StatusCode);

        var accept = await admin.PostAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{quote.Id}/accept",
            content: null);
        Assert.Equal(HttpStatusCode.NoContent, accept.StatusCode);

        var quotes = await admin.GetFromJsonAsync<List<QuoteResponse>>(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes");
        Assert.NotNull(quotes);
        Assert.Equal("Accepted", Assert.Single(quotes).Status);
    }

    [Fact]
    public async Task Owner_can_reject_quote_via_status()
    {
        var owner = Authed("rq-reject-owner", "rq-reject-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Reject Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var request = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/requests",
                new CreateRequestBody("Reject RFQ", null)))
            .Content.ReadFromJsonAsync<RequestResponse>();
        Assert.NotNull(request);

        var guest = _factory.CreateClient();
        var quote = await (await guest.PostAsJsonAsync(
                $"/api/public/requests/{request.PublicSlug}/quotes",
                new PublicQuoteBody(
                    "Vendor",
                    100m,
                    "OneTime",
                    null,
                    null,
                    "Rej",
                    null,
                    "rej@vendor.test",
                    null,
                    "Submitted")))
            .Content.ReadFromJsonAsync<QuoteResponse>();
        Assert.NotNull(quote);

        var reject = await owner.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{quote.Id}/status",
            new TransitionQuoteBody("Rejected"));
        Assert.Equal(HttpStatusCode.OK, reject.StatusCode);
        var body = await reject.Content.ReadFromJsonAsync<QuoteResponse>();
        Assert.NotNull(body);
        Assert.Equal("Rejected", body.Status);
    }

    [Fact]
    public async Task Accept_via_status_endpoint_is_rejected()
    {
        var owner = Authed("rq-status-accept", "rq-status-accept@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Status Accept Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var request = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/requests",
                new CreateRequestBody("Status Accept RFQ", null)))
            .Content.ReadFromJsonAsync<RequestResponse>();
        Assert.NotNull(request);

        var guest = _factory.CreateClient();
        var quote = await (await guest.PostAsJsonAsync(
                $"/api/public/requests/{request.PublicSlug}/quotes",
                new PublicQuoteBody(
                    "Vendor",
                    50m,
                    "OneTime",
                    null,
                    null,
                    "Sam",
                    null,
                    "sam@vendor.test",
                    null,
                    "Submitted")))
            .Content.ReadFromJsonAsync<QuoteResponse>();
        Assert.NotNull(quote);

        await owner.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{quote.Id}/status",
            new TransitionQuoteBody("UnderReview"));

        var viaStatus = await owner.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{quote.Id}/status",
            new TransitionQuoteBody("Accepted"));
        Assert.Equal(HttpStatusCode.BadRequest, viaStatus.StatusCode);

        var submittedToAccepted = await (await guest.PostAsJsonAsync(
                $"/api/public/requests/{request.PublicSlug}/quotes",
                new PublicQuoteBody(
                    "Vendor 2",
                    60m,
                    "OneTime",
                    null,
                    null,
                    "Sam2",
                    null,
                    "sam2@vendor.test",
                    null,
                    "Submitted")))
            .Content.ReadFromJsonAsync<QuoteResponse>();
        Assert.NotNull(submittedToAccepted);

        var illegal = await owner.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{submittedToAccepted.Id}/status",
            new TransitionQuoteBody("Accepted"));
        Assert.Equal(HttpStatusCode.BadRequest, illegal.StatusCode);
    }

    [Fact]
    public async Task Non_member_cannot_access_org_quotes()
    {
        var owner = Authed("rq-iso-owner", "rq-iso-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Iso Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var request = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/requests",
                new CreateRequestBody("Iso RFQ", null)))
            .Content.ReadFromJsonAsync<RequestResponse>();
        Assert.NotNull(request);

        var outsider = Authed("rq-outsider", "rq-outsider@example.com");
        var list = await outsider.GetAsync($"/api/orgs/{org.Id}/requests/{request.Id}/quotes");
        Assert.Equal(HttpStatusCode.BadRequest, list.StatusCode);
    }

    [Fact]
    public async Task Guest_cannot_submit_after_request_cancelled()
    {
        var owner = Authed("rq-cancel-owner", "rq-cancel-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Cancel Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var request = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/requests",
                new CreateRequestBody("Cancel RFQ", null)))
            .Content.ReadFromJsonAsync<RequestResponse>();
        Assert.NotNull(request);

        var cancel = await owner.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/status",
            new TransitionRequestBody("Cancelled"));
        Assert.Equal(HttpStatusCode.OK, cancel.StatusCode);

        var guest = _factory.CreateClient();
        var submit = await guest.PostAsJsonAsync(
            $"/api/public/requests/{request.PublicSlug}/quotes",
            new PublicQuoteBody(
                "Vendor",
                10m,
                "OneTime",
                null,
                null,
                "Pat",
                null,
                "pat@cancel.test",
                null,
                "Submitted"));
        Assert.Equal(HttpStatusCode.BadRequest, submit.StatusCode);
    }

    [Fact]
    public async Task Public_draft_quote_can_be_moved_to_under_review()
    {
        var owner = Authed("rq-draft-owner", "rq-draft-owner@example.com");
        var org = await (await owner.PostAsJsonAsync("/api/orgs", new CreateOrgRequest("Draft Org", null)))
            .Content.ReadFromJsonAsync<OrgResponse>();
        Assert.NotNull(org);

        var request = await (await owner.PostAsJsonAsync(
                $"/api/orgs/{org.Id}/requests",
                new CreateRequestBody("Draft RFQ", null)))
            .Content.ReadFromJsonAsync<RequestResponse>();
        Assert.NotNull(request);

        var guest = _factory.CreateClient();
        var quote = await (await guest.PostAsJsonAsync(
                $"/api/public/requests/{request.PublicSlug}/quotes",
                new PublicQuoteBody(
                    "Vendor",
                    75m,
                    "Weekly",
                    null,
                    null,
                    "Dee",
                    null,
                    "dee@vendor.test",
                    null,
                    "Draft")))
            .Content.ReadFromJsonAsync<QuoteResponse>();
        Assert.NotNull(quote);
        Assert.Equal("Draft", quote.Status);

        var submit = await owner.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{quote.Id}/status",
            new TransitionQuoteBody("Submitted"));
        Assert.Equal(HttpStatusCode.OK, submit.StatusCode);

        var review = await owner.PostAsJsonAsync(
            $"/api/orgs/{org.Id}/requests/{request.Id}/quotes/{quote.Id}/status",
            new TransitionQuoteBody("UnderReview"));
        Assert.Equal(HttpStatusCode.OK, review.StatusCode);
        var body = await review.Content.ReadFromJsonAsync<QuoteResponse>();
        Assert.NotNull(body);
        Assert.Equal("UnderReview", body.Status);
    }

    private HttpClient Authed(string sub, string email)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", DevJwt.Create(sub, email));
        return client;
    }
}
