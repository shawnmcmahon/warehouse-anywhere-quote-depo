using Microsoft.EntityFrameworkCore;
using QuoteDepot.Domain.Entities;

namespace QuoteDepot.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationMembership> OrganizationMemberships => Set<OrganizationMembership>();
    public DbSet<Invite> Invites => Set<Invite>();
    public DbSet<JoinRequest> JoinRequests => Set<JoinRequest>();
    public DbSet<Request> Requests => Set<Request>();
    public DbSet<Quote> Quotes => Set<Quote>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(x => x.CognitoSub).IsUnique();
            e.HasIndex(x => x.Email);
            e.Property(x => x.Email).HasMaxLength(320);
            e.Property(x => x.CognitoSub).HasMaxLength(128);
            e.Property(x => x.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<Organization>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Description).HasMaxLength(2000);
            e.Property(x => x.PublicSlug).HasMaxLength(64);
            e.Property(x => x.LogoPath).HasMaxLength(500);
            e.HasOne(x => x.Owner)
                .WithMany()
                .HasForeignKey(x => x.OwnerUserId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.Name);
            e.HasIndex(x => x.PublicSlug).IsUnique();
        });

        modelBuilder.Entity<OrganizationMembership>(e =>
        {
            e.HasIndex(x => new { x.OrganizationId, x.UserId }).IsUnique();
            e.HasOne(x => x.Organization)
                .WithMany(o => o.Memberships)
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User)
                .WithMany(u => u.Memberships)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        });

        modelBuilder.Entity<Invite>(e =>
        {
            e.HasIndex(x => x.Token).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.Email, x.Status });
            e.Property(x => x.Email).HasMaxLength(320);
            e.Property(x => x.Token).HasMaxLength(64);
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.Organization)
                .WithMany(o => o.Invites)
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.InvitedBy)
                .WithMany()
                .HasForeignKey(x => x.InvitedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<JoinRequest>(e =>
        {
            e.HasIndex(x => new { x.OrganizationId, x.UserId, x.Status });
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.Message).HasMaxLength(1000);
            e.HasOne(x => x.Organization)
                .WithMany(o => o.JoinRequests)
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ResolvedBy)
                .WithMany()
                .HasForeignKey(x => x.ResolvedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Request>(e =>
        {
            e.HasIndex(x => x.PublicSlug).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.Status });
            e.Property(x => x.Title).HasMaxLength(300);
            e.Property(x => x.Description).HasMaxLength(4000);
            e.Property(x => x.PublicSlug).HasMaxLength(64);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.RowVersion).IsConcurrencyToken();
            e.HasOne(x => x.Organization)
                .WithMany(o => o.Requests)
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.CreatedBy)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Quote>(e =>
        {
            e.HasIndex(x => new { x.RequestId, x.Status });
            e.Property(x => x.BusinessName).HasMaxLength(300);
            e.Property(x => x.ContactName).HasMaxLength(200);
            e.Property(x => x.ContactPhone).HasMaxLength(50);
            e.Property(x => x.ContactEmail).HasMaxLength(320);
            e.Property(x => x.Notes).HasMaxLength(4000);
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.Property(x => x.Unit).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.RowVersion).IsConcurrencyToken();
            e.HasOne(x => x.Request)
                .WithMany(r => r.Quotes)
                .HasForeignKey(x => x.RequestId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.SubmittedBy)
                .WithMany()
                .HasForeignKey(x => x.SubmittedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AuditEvent>(e =>
        {
            e.HasIndex(x => new { x.OrganizationId, x.OccurredAt });
            e.Property(x => x.Action).HasMaxLength(100);
            e.Property(x => x.EntityType).HasMaxLength(100);
            e.HasOne(x => x.Organization)
                .WithMany(o => o.AuditEvents)
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Actor)
                .WithMany()
                .HasForeignKey(x => x.ActorUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
