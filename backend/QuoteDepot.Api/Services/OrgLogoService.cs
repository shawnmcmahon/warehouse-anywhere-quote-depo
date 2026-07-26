using Microsoft.EntityFrameworkCore;
using QuoteDepot.Domain.Authorization;
using QuoteDepot.Domain.Entities;
using QuoteDepot.Domain.Exceptions;
using QuoteDepot.Infrastructure.Data;
using QuoteDepot.Infrastructure.Storage;

namespace QuoteDepot.Api.Services;

public interface IOrgLogoService
{
    Task<Organization> UploadAsync(
        Guid orgId,
        User actor,
        Stream content,
        string contentType,
        string? fileName,
        CancellationToken cancellationToken = default);

    Task<(Stream Stream, string ContentType)?> OpenAsync(
        Guid orgId,
        CancellationToken cancellationToken = default);
}

public class OrgLogoService : IOrgLogoService
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png",
        "image/jpeg",
        "image/webp",
    };

    private const long MaxBytes = 2 * 1024 * 1024;

    private readonly AppDbContext _db;
    private readonly ICurrentUserAccessor _users;
    private readonly IFileStorage _files;
    private readonly IAuditService _audit;

    public OrgLogoService(
        AppDbContext db,
        ICurrentUserAccessor users,
        IFileStorage files,
        IAuditService audit)
    {
        _db = db;
        _users = users;
        _files = files;
        _audit = audit;
    }

    public async Task<Organization> UploadAsync(
        Guid orgId,
        User actor,
        Stream content,
        string contentType,
        string? fileName,
        CancellationToken cancellationToken = default)
    {
        var membership = await _users.RequireActiveMembershipAsync(orgId, actor.Id, cancellationToken);
        OrgPermissions.Ensure(
            OrgPermissions.CanUpdateOrgSettings(membership.Role),
            "Only the Owner can upload an organization logo.");

        if (!AllowedContentTypes.Contains(contentType))
        {
            throw new DomainException("Logo must be a PNG, JPEG, or WebP image.");
        }

        if (content.CanSeek && content.Length > MaxBytes)
        {
            throw new DomainException("Logo must be 2 MB or smaller.");
        }

        await using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);
        if (buffer.Length == 0)
        {
            throw new DomainException("Logo file is empty.");
        }

        if (buffer.Length > MaxBytes)
        {
            throw new DomainException("Logo must be 2 MB or smaller.");
        }

        buffer.Position = 0;
        var extension = ExtensionFor(contentType, fileName);
        var relativeKey = $"orgs/{orgId:N}/{Guid.NewGuid():N}{extension}";

        var org = await _db.Organizations.SingleOrDefaultAsync(o => o.Id == orgId, cancellationToken)
                  ?? throw new DomainException("Organization not found.");

        var previous = org.LogoPath;
        var savedKey = await _files.SaveAsync(relativeKey, buffer, cancellationToken);
        org.LogoPath = savedKey;
        org.UpdatedAt = DateTimeOffset.UtcNow;

        _audit.Record(
            orgId,
            actor.Id,
            AuditActions.OrganizationLogoUploaded,
            nameof(Organization),
            orgId,
            new { logoPath = savedKey });

        await _db.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(previous) && !string.Equals(previous, savedKey, StringComparison.Ordinal))
        {
            try
            {
                await _files.DeleteAsync(previous, cancellationToken);
            }
            catch
            {
                // Best-effort cleanup of the previous logo file.
            }
        }

        return org;
    }

    public async Task<(Stream Stream, string ContentType)?> OpenAsync(
        Guid orgId,
        CancellationToken cancellationToken = default)
    {
        var org = await _db.Organizations.AsNoTracking()
            .SingleOrDefaultAsync(o => o.Id == orgId, cancellationToken);
        if (org?.LogoPath is null)
        {
            return null;
        }

        var stream = await _files.OpenReadAsync(org.LogoPath, cancellationToken);
        if (stream is null)
        {
            return null;
        }

        return (stream, ContentTypeFor(org.LogoPath));
    }

    private static string ExtensionFor(string contentType, string? fileName)
    {
        var fromName = Path.GetExtension(fileName ?? string.Empty).ToLowerInvariant();
        if (fromName is ".png" or ".jpg" or ".jpeg" or ".webp")
        {
            return fromName == ".jpeg" ? ".jpg" : fromName;
        }

        return contentType.ToLowerInvariant() switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".jpg",
        };
    }

    private static string ContentTypeFor(string relativeKey)
    {
        var ext = Path.GetExtension(relativeKey).ToLowerInvariant();
        return ext switch
        {
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".jpg" or ".jpeg" => "image/jpeg",
            _ => "application/octet-stream",
        };
    }
}
