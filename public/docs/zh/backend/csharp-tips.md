# C# Tips

## ValueTask vs Task

Use `ValueTask` when the method frequently completes synchronously — it avoids heap allocation.

```csharp
// Prefer ValueTask for cache-hit scenarios
public async ValueTask<User?> GetUserAsync(int id)
{
    if (_cache.TryGetValue(id, out var cached))
        return cached; // sync path, no allocation

    return await _db.Users.FindAsync(id);
}
```

## Span&lt;T&gt; for zero-copy parsing

```csharp
ReadOnlySpan<char> input = "2024-01-15";
var year = int.Parse(input[..4]);
var month = int.Parse(input[5..7]);
var day = int.Parse(input[8..]);
```

## Cancellation patterns

Always propagate `CancellationToken` to avoid ghost tasks:

```csharp
public async Task ProcessAsync(CancellationToken ct)
{
    await foreach (var item in GetItemsAsync(ct))
    {
        ct.ThrowIfCancellationRequested();
        await HandleAsync(item, ct);
    }
}
```

## ConfigureAwait(false)

In library code (not ASP.NET controllers), always use `ConfigureAwait(false)`:

```csharp
var result = await _client.GetAsync(url, ct).ConfigureAwait(false);
```

> In ASP.NET Core there's no `SynchronizationContext`, so it doesn't matter there — but it's good habit for libraries.
