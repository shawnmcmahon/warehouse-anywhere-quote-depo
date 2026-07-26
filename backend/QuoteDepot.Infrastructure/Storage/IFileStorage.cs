namespace QuoteDepot.Infrastructure.Storage;

public interface IFileStorage
{
    /// <summary>
    /// Saves content under a relative key and returns that key for persistence.
    /// </summary>
    Task<string> SaveAsync(string relativeKey, Stream content, CancellationToken cancellationToken = default);

    Task<Stream?> OpenReadAsync(string relativeKey, CancellationToken cancellationToken = default);

    Task DeleteAsync(string relativeKey, CancellationToken cancellationToken = default);
}
