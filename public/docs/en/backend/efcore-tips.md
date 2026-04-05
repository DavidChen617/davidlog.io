# EF Core Performance Tips

## AsNoTracking

For queries that only read data and don't need to update it, always add `AsNoTracking()` to eliminate the overhead of the Change Tracker:

```csharp
// Bad: Change Tracker will track every returned object
var products = await db.Products.Where(p => p.IsActive).ToListAsync();

// Good: read-only queries don't need tracking
var products = await db.Products
    .Where(p => p.IsActive)
    .AsNoTracking()
    .ToListAsync();
```

If the entire DbContext is used for read-only purposes (e.g., a reporting service), configure it globally in `OnConfiguring`:

```csharp
optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
```

## Select Only What You Need

Avoid `SELECT *` — only fetch the columns you actually use to reduce network transfer and memory consumption:

```csharp
// Bad: loads the entire Order object including related entities
var orders = await db.Orders.Include(o => o.Customer).ToListAsync();

// Good: only fetch the fields needed by the UI
var orders = await db.Orders
    .Select(o => new OrderSummaryDto
    {
        OrderId = o.Id,
        CustomerName = o.Customer.Name,
        Total = o.Total,
        CreatedAt = o.CreatedAt
    })
    .AsNoTracking()
    .ToListAsync();
```

## Avoid Querying Inside Loops

```csharp
// Bad: N+1 — hits the DB once per orderId
var results = new List<Order>();
foreach (var id in orderIds)
{
    results.Add(await db.Orders.FindAsync(id));
}

// Good: fetch everything in a single query
var results = await db.Orders
    .Where(o => orderIds.Contains(o.Id))
    .ToListAsync();
```

## Split Query

One-to-many `Include`s on large datasets produce a massive Cartesian Product. Use Split Query instead:

```csharp
// Default: a single JOIN query — 100 Orders × 50 Items each = 5,000 rows returned
var orders = await db.Orders
    .Include(o => o.Items)
    .Include(o => o.Tags)
    .ToListAsync();

// Split Query: breaks into separate queries, each returning a reasonable amount of data
var orders = await db.Orders
    .Include(o => o.Items)
    .Include(o => o.Tags)
    .AsSplitQuery()
    .ToListAsync();
```

> Split Query issues multiple round trips to the database, making it ideal when collection navigation properties return large amounts of data. It's unnecessary for simple many-to-one `Include`s on a single object.

## Bulk Operations (EF Core 7+)

Before EF Core 7, batch updates and deletes required loading data into memory and processing it row by row. EF Core 7 introduced `ExecuteUpdateAsync` and `ExecuteDeleteAsync`, which translate directly into a single SQL statement:

```csharp
// Old approach: load first, then update — N UPDATE statements
var orders = await db.Orders.Where(o => o.Status == "Pending").ToListAsync();
foreach (var o in orders) o.Status = "Cancelled";
await db.SaveChangesAsync();

// EF Core 7+: single UPDATE SQL statement
await db.Orders
    .Where(o => o.Status == "Pending")
    .ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, "Cancelled"));

// Single DELETE SQL statement
await db.Orders
    .Where(o => o.CreatedAt < DateTime.UtcNow.AddYears(-3))
    .ExecuteDeleteAsync();
```

## Compiled Query

For frequently executed queries with a fixed shape, pre-compile them to eliminate LINQ parsing overhead on every call:

```csharp
private static readonly Func<AppDbContext, int, Task<Order?>> GetOrderById =
    EF.CompileAsyncQuery((AppDbContext db, int id) =>
        db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefault(o => o.Id == id));

// Usage
var order = await GetOrderById(db, orderId);
```
