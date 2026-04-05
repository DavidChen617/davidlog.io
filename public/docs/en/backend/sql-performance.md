# SQL Query Performance Tuning

## Read the execution plan first, don't guess

Always check the Execution Plan before optimizing — don't go by intuition.

```sql
-- SQL Server
SET STATISTICS IO, TIME ON;
SELECT * FROM Orders WHERE CustomerId = 123;

-- Or use the graphical plan
-- SSMS → Query → Include Actual Execution Plan (Ctrl+M)
```

Key things to look for:

- **Table Scan / Index Scan** → usually a sign the query isn't using an index
- **Key Lookup** → index is used but missing columns, requires a round-trip to the Clustered Index
- **Estimated vs Actual Rows** differ a lot → stale statistics, run `UPDATE STATISTICS`

## Index design principles

### Covering Index

Put all columns the query needs into the index to avoid Key Lookups:

```sql
-- Query
SELECT OrderId, Total, Status
FROM Orders
WHERE CustomerId = 123 AND Status = 'Pending';

-- Bad: only CustomerId is indexed, Status and Total require a table lookup
CREATE INDEX IX_Orders_CustomerId ON Orders (CustomerId);

-- Good: include Status in the key, Total via INCLUDE
CREATE INDEX IX_Orders_CustomerId_Status
ON Orders (CustomerId, Status)
INCLUDE (Total);
```

### Column order in composite indexes

**High-selectivity columns first**, but equality conditions must come before range conditions:

```sql
-- WHERE CustomerId = ? AND CreatedAt >= ? AND CreatedAt < ?
-- CustomerId has high selectivity (equality) → first
-- CreatedAt is a range → second
CREATE INDEX IX_Orders_Customer_Date
ON Orders (CustomerId, CreatedAt);
```

## N+1 Problem

The most common ORM performance killer — a list query turns into N+1 SQL calls:

```csharp
// Bad: each Order triggers an extra Customer query
var orders = await db.Orders.ToListAsync();
foreach (var order in orders)
{
    var customer = await db.Customers.FindAsync(order.CustomerId); // N hits!
}

// Good: single JOIN
var orders = await db.Orders
    .Include(o => o.Customer)
    .ToListAsync();

// Even better: project only what you need
var orders = await db.Orders
    .Select(o => new {
        o.OrderId,
        o.Total,
        CustomerName = o.Customer.Name
    })
    .ToListAsync();
```

## Pagination

`OFFSET/FETCH` gets slower as you go deeper into the data — use Keyset Pagination instead:

```sql
-- Traditional: page 10,000 is painful
SELECT * FROM Orders
ORDER BY CreatedAt DESC
OFFSET 100000 ROWS FETCH NEXT 20 ROWS ONLY;

-- Keyset Pagination: every page is equally fast
-- Frontend sends CreatedAt and OrderId of the last row on the previous page
SELECT TOP 20 * FROM Orders
WHERE CreatedAt < @LastCreatedAt
   OR (CreatedAt = @LastCreatedAt AND OrderId < @LastOrderId)
ORDER BY CreatedAt DESC, OrderId DESC;
```

## Updating statistics

Inaccurate query plans are usually caused by stale statistics:

```sql
-- Update a single table
UPDATE STATISTICS Orders;

-- Update the entire database (run during maintenance window)
EXEC sp_updatestats;

-- Check when statistics were last updated
SELECT
    name,
    STATS_DATE(object_id, stats_id) AS LastUpdated
FROM sys.stats
WHERE object_id = OBJECT_ID('Orders');
```
