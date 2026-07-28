using Microsoft.EntityFrameworkCore;
using QuoteDepot.Domain.Entities;
using QuoteDepot.Domain.Enums;
using QuoteDepot.Infrastructure.Data;

namespace QuoteDepot.Tests;

public class AppDbContextTests
{
    [Fact]
    public async Task Can_persist_org_request_and_quote_graph()
    {
        await using var db = CreateContext();
        await db.Database.EnsureCreatedAsync();

        var user = new User
        {
            CognitoSub = "sub-123",
            Email = "owner@example.com",
            Name = "Owner",
        };
        var org = new Organization
        {
            Name = "Depot Co",
            PublicSlug = "depot-co-test",
            OwnerUserId = user.Id,
            Owner = user,
        };
        var membership = new OrganizationMembership
        {
            OrganizationId = org.Id,
            UserId = user.Id,
            Role = OrgRole.Owner,
            Status = MembershipStatus.Active,
        };
        var request = new Request
        {
            OrganizationId = org.Id,
            CreatedByUserId = user.Id,
            Title = "Cold storage quote",
            PublicSlug = "cold-storage-1",
            Status = RequestStatus.Open,
        };
        var quote = new Quote
        {
            RequestId = request.Id,
            BusinessName = "Vendor LLC",
            Amount = 2500.50m,
            Unit = QuoteUnit.Monthly,
            ContactName = "Sam",
            ContactEmail = "sam@vendor.test",
            Status = QuoteStatus.Submitted,
        };

        db.Users.Add(user);
        db.Organizations.Add(org);
        db.OrganizationMemberships.Add(membership);
        db.Requests.Add(request);
        db.Quotes.Add(quote);
        await db.SaveChangesAsync();

        var loaded = await db.Requests
            .Include(r => r.Quotes)
            .SingleAsync(r => r.PublicSlug == "cold-storage-1");

        Assert.Equal("Cold storage quote", loaded.Title);
        Assert.Single(loaded.Quotes);
        Assert.Equal(2500.50m, loaded.Quotes.First().Amount);
    }

    private static AppDbContext CreateContext()
    {
        var path = Path.Combine(Path.GetTempPath(), $"quotedepot-test-{Guid.NewGuid():N}.db");
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite($"Data Source={path}")
            .Options;
        return new AppDbContext(options);
    }
}
