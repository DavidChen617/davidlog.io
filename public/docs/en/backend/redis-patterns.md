# Redis Cache Patterns

## Cache-Aside (most common)

The application manages the cache itself — on a miss, fetch from DB and populate:

```csharp
public async Task<Product?> GetProductAsync(int id)
{
    var key = $"product:{id}";

    // 1. Check Redis first
    var cached = await _redis.GetAsync<Product>(key);
    if (cached is not null)
        return cached;

    // 2. Cache miss → query DB
    var product = await _db.Products.FindAsync(id);
    if (product is null)
        return null;

    // 3. Write to Redis with TTL
    await _redis.SetAsync(key, product, TimeSpan.FromMinutes(10));
    return product;
}
```

Invalidation strategy: actively delete the key on data update (`DEL product:123`) and let it refill on the next request.

## Preventing Cache Stampede

Many requests hitting a cache miss simultaneously and all hammering the DB:

```csharp
// Use SemaphoreSlim so only one request queries the DB per key
private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

public async Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T?>> factory, TimeSpan ttl)
{
    var cached = await _redis.GetAsync<T>(key);
    if (cached is not null) return cached;

    var semaphore = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
    await semaphore.WaitAsync();
    try
    {
        // Double-check: someone else may have already populated it
        cached = await _redis.GetAsync<T>(key);
        if (cached is not null) return cached;

        var value = await factory();
        if (value is not null)
            await _redis.SetAsync(key, value, ttl);
        return value;
    }
    finally
    {
        semaphore.Release();
    }
}
```

## Distributed Lock

Use Redlock to prevent multiple instances from executing the same task concurrently:

```csharp
var key = "lock:process-orders";
var lockValue = Guid.NewGuid().ToString();
var ttl = TimeSpan.FromSeconds(30);

// Acquire: SET key value NX PX 30000
bool acquired = await _db.StringSetAsync(
    key, lockValue,
    ttl,
    When.NotExists);

if (!acquired)
    return; // Another instance holds the lock

try
{
    await ProcessOrdersAsync();
}
finally
{
    // Release: Lua script ensures we only delete our own lock
    const string script = @"
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        else
            return 0
        end";

    await _db.ScriptEvaluateAsync(script, [key], [lockValue]);
}
```

## Key Naming Conventions

```
# Format: {service}:{entity}:{id}:{field}
product:detail:123
product:list:category:5:page:1
user:session:abc123
order:status:456

# Avoid spaces and special characters
# Avoid excessively long keys (impacts memory and network)
```

## Memory Eviction Policies

```bash
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru    # Use this for pure cache
# maxmemory-policy volatile-lru # Only evict keys with TTL set
# maxmemory-policy noeviction   # Error on full memory — for session stores
```

> Use `allkeys-lru` for cache. Use `noeviction` for session stores or queues where data loss is unacceptable.
