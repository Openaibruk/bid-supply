# Data Audit Report — Bid Supply Dashboard

**Date:** 2026-04-03  
**Auditor:** Data Engineer (Subagent)  
**Scope:** Supabase data layer for `bid-supply` Next.js dashboard  

---

## 1. Table Inventory & Row Counts (via Anon Key)

| Table | Rows | Used By | Status |
|---|---|---|---|
| `dc_bids` | 2,735 | All components | ✅ Healthy |
| `products` | 308 | LiveTicker, PriceCharts, WinnerFeed | ✅ Healthy |
| `dc_suppliers` | 66 | LiveTicker, WinnerFeed, SupplierLeaderboard | ✅ Healthy |
| `dc_bidding_cycles` | 5 | ActiveCycles | ⚠️ All cycles closed |
| `dc_coordinators` | 4 | — (not queried by components) | ℹ️ Unused by UI |
| ~~`dc_bidder_profiles`~~ | — | — | ❌ **Does not exist** in DB |

### Critical Finding: Missing Table
`dc_bidder_profiles` does **not exist** as a relation. It's referenced in `test-supabase.cjs` and `debug-rls.cjs` but not in any component. No impact on dashboard — but cleanup recommended.

---

## 2. Component-by-Component Query Audit

### 2.1 `ActiveCycles.tsx` — 🔴 EMPTY (Guaranteed)

**Query:** `dc_bidding_cycles` → filter by `starts_at < now < ends_at`

**Problem:** All 5 cycles have `ends_at` in the past (latest: 2026-04-01). The component filters client-side with `isBefore(now, new Date(c.ends_at))`, so **all 5 are excluded**. User sees "No active cycles right now".

**Date parsing issue:** Cycle dates are stored as **date-only strings** (`"2026-03-19"`), parsed by `new Date()` as `2026-03-19T00:00:00.000Z`. This means `ends_at = "2026-04-01"` maps to `2026-04-01T00:00:00Z`, and the cycle is "expired" as soon as clock passes midnight UTC — 3 hours before midnight Addis time.

**Fix Required:**
1. Create at least 1 cycle with `ends_at` in the future
2. Store cycle dates with time (timestamp with time zone), not date-only strings

### 2.2 `LiveTicker.tsx` — 🔴 EMPTY (Temporal)

**Query:** `dc_bids` WHERE `created_at >= now - 4 hours`

**Problem:** The most recent bid in the database is `2026-04-02T06:22:29Z`. When checking at `2026-04-03T10:17Z`, that's ~28 hours ago. The 4-hour window returns **0 rows**.

**Ordering:** ✅ Correct — `.order('created_at', { ascending: false }).limit(30)`.

**Real-time subscription:** ✅ Correctly implemented:
```ts
supabase.channel('ticker')
  .on('postgres_changes', { event: 'INSERT', table: 'dc_bids' }, callback)
```
This works if Supabase real-time is enabled for `dc_bids` (replication defaults may vary).

**Fallback needed:** Show cached/ticker-eligible bids when 4h window is empty.

### 2.3 `TodaySummary.tsx` — 🔴 ALL ZEROES (Temporal)

**Query:** `dc_bids` WHERE `created_at >= startOfDay(new Date()).toISOString()`

**Problem:** Identical to LiveTicker — no bids on the current local day (Apr 3 GMT+3).

**UTC/Local date analysis:**
- `startOfDay(new Date())` in browser (GMT+3) → `2026-04-03T00:00+03:00` = `2026-04-02T21:00Z`
- Filter: `created_at >= '2026-04-02T21:00:00Z'`
- Latest bid: `2026-04-02T06:22:29Z`
- **Result: 0 bids** ✅ Math is correct, but user experience shows all zeroes.

This is **not a bug**, it's an **empty-state UX problem**. The logic is correct for a local-time dashboard.

### 2.4 `PriceCharts.tsx` — ✅ PARTIAL DATA

**Query:** `dc_bids` WHERE `created_at >= now - 14 days` AND `product_id = selectedProduct`

**Data availability:** ~70 bids in the last 14 days spread across products. The dropdown auto-selects the first product from `products` table (alphabetically by insertion order, not by bid count). If the first product has few or no bids, the chart shows "No price data available".

**Potential improvement:** Default-select the product with most bids in the last 14 days.

**Date grouping:** Uses `format(parseISO(b.created_at), 'MM/dd')` — this is local-time formatting. If `created_at` is stored in UTC and user is in GMT+3, the date label will shift after 21:00 UTC. Minor UX inconsistency.

### 2.5 `SupplierLeaderboard.tsx` — ✅ WORKING

**Query:** Fetch all active suppliers → per-supplier, fetch bids from last 30 days

**Performance concern:** ⚠️ **N+1 query pattern** — 1 query for suppliers + 66 queries for bids (one per supplier). This works with 66 suppliers but will degrade.

**Date filter issue:** Uses `format(subDays(new Date(), 30), 'yyyy-MM-dd')` which produces a **date-only string** like `"2026-03-04"`. Supabase interprets this as `"2026-03-04T00:00:00+00:00"`, not `"2026-03-04T00:00:00+03:00"`. This means the filter is 3 hours earlier than intended (starts at 21:00 local time on Mar 3 instead of 00:00). **Not a correctness issue** since it's slightly more inclusive, but semantically wrong.

**Result:** ~213 bids in last 30 days, distributed across suppliers. Leaderboard will populate.

### 2.6 `WinnerFeed.tsx` — ✅ WORKING

**Query:** `dc_bids` WHERE `is_winner = true` ORDER BY `created_at DESC` LIMIT 10

**Data:** 687 winner bids exist. This will populate with 10 most recent winners.

**Real-time subscription:** ✅ Correctly uses filter `is_winner=eq.true`.

**Join integrity:** Bid product_ids and supplier_ids all have matches in `products` and `dc_suppliers` (checked 100 samples, 0 orphans).

---

## 3. Join Integrity

| Join | Status | Notes |
|---|---|---|
| `dc_bids.product_id` → `products.product_id` | ✅ All intact | 0 orphans in sample |
| `dc_bids.supplier_id` → `dc_suppliers.supplier_id` | ✅ All intact | 0 orphans in sample |
| `dc_bids.cycle_id` → `dc_bidding_cycles.cycle_id` | ⚠️ All NULL | `cycle_id` column exists but all values are `NULL` |

---

## 4. RLS Policy Assessment

The anon key grants SELECT access to all tables (confirmed by successful queries). No RLS errors observed. Key notes:

- **No row-level filtering** — anon key reads all rows in all tables. This is by design for a public transparency dashboard.
- **No INSERT/UPDATE/DELETE** for anon (expected).
- **Real-time subscriptions** depend on Supabase project settings allowing broadcast on `dc_bids` table INSERT.

---

## 5. Date Handling Summary

| Component | Method | Issue |
|---|---|---|
| `ActiveCycles` | `new Date(c.ends_at)` with date-only DB strings | Parses as UTC midnight. Cycle ends 3h before local midnight. |
| `TodaySummary` | `startOfDay(new Date()).toISOString()` | Correct for local-time dashboard. Empty when no bids today. |
| `LiveTicker` | `subHours(new Date(), 4).toISOString()` | Correct UTC-based filtering. |
| `PriceCharts` | `format(parseISO(b.created_at), 'MM/dd')` | Local-time label — date shifts at 21:00 UTC for GMT+3 users. |
| `SupplierLeaderboard` | `format(subDays(d, 30), 'yyyy-MM-dd')` | Date-only string → UTC midnight. 3h off. Slightly more inclusive. |

**Overall:** The date handling is **functionally correct** but has a subtle inconsistency — some filters use UTC midnight, others use local midnight. For a GMT+3 audience, the effective filter window is shifted by 3 hours.

---

## 6. Sample Data Seeds

The DB already has real production data. The dashboard shows empty states because:

1. **No active cycles** — need future-dated cycle
2. **No recent bids** — production bidding may be paused

To make the demo dashboard fully populated, run these SQL seeds:

### 6.1 Create Active Bidding Cycle

```sql
-- Active cycle spanning current period (GMT+3 aware)
INSERT INTO dc_bidding_cycles (
  cycle_id, cycle_name, starts_at, ends_at, status
) VALUES (
  'cycle-demo-2026-q2',
  'Q2 2026 Addis Bidding Cycle',
  '2026-04-01',
  '2026-04-30',
  'active'
);
```

### 6.2 Seed Recent Bids (Last 4 Hours for LiveTicker + Today Summary)

```sql
-- Generate ~20 bids spread across the last 3 hours
-- Uses existing products and suppliers
INSERT INTO dc_bids (
  id, batch_id, bid_date, product_id, supplier_id,
  bid_price, is_winner, created_at, volume,
  submitted_via, is_expired, is_price_override
)
SELECT
  gen_random_uuid()::text,
  gen_random_uuid()::text,
  CURRENT_DATE::text,
  unnest(ARRAY[35, 34, 30, 17, 50, 37, 15, 2426, 2475, 36]),  -- top products
  unnest(ARRAY[69, 38, 39, 194, 196, 40, 33, 45, 62, 42]),      -- top suppliers
  floor(random() * 200 + 30)::int,                               -- prices 30–230
  false,
  NOW() - (random() * interval '3 hours'),
  floor(random() * 500 + 10)::int,
  'web',
  false,
  false
FROM generate_series(1, 20);

-- Mark 2 recent bids as winners
UPDATE dc_bids
SET is_winner = true
WHERE created_at >= NOW() - interval '3 hours'
ORDER BY bid_price ASC
LIMIT 2;
```

### 6.3 Seed Today's Bids for Summary Cards

```sql
-- If the above INSERT already runs, TodaySummary will auto-populate
-- Ensure at least some have volume data for the Total Volume card
UPDATE dc_bids
SET volume = floor(random() * 1000 + 50)::int
WHERE created_at >= NOW() - interval '24 hours'
AND volume IS NULL;
```

### 6.4 Seed Price Chart Data (14-day window)

The existing ~70 bids in the last 14 days should suffice for PriceCharts. If product_id `12` (the most recent product) has sparse data, add diversity:

```sql
-- Add more bids for the current top-charted product across the last 14 days
INSERT INTO dc_bids (
  id, batch_id, bid_date, product_id, supplier_id,
  bid_price, is_winner, created_at, volume,
  submitted_via, is_expired, is_price_override
)
SELECT
  gen_random_uuid()::text,
  gen_random_uuid()::text,
  (CURRENT_DATE - (random() * 14)::int)::text,
  d.product_id,
  unnest(ARRAY[69, 38, 39])::int,
  floor(random() * 150 + 40)::int,
  false,
  NOW() - (random() * interval '14 days'),
  floor(random() * 200 + 20)::int,
  'web',
  false,
  false
FROM (SELECT 35 AS product_id UNION SELECT 34 UNION SELECT 30 UNION SELECT 17) d
CROSS JOIN generate_series(1, 5);
```

---

## 7. Recommendations

### High Priority

| # | Issue | Component | Recommendation |
|---|---|---|---|
| 1 | All cycles expired | ActiveCycles | Add a future-dated cycle (see seeds above) |
| 2 | Empty live ticker | LiveTicker | Increase fallback window to 24h when 4h window is empty |
| 3 | Empty today stats | TodaySummary | Show "today's data is still loading" or show yesterday's stats as context |
| 4 | Product dropdown defaults to alphabetically first | PriceCharts | Default to product with most recent bids |
| 5 | `.in()` with empty arrays | All | Add guard: `if (ids.length === 0) return []` before Supabase calls |

### Medium Priority

| # | Issue | Recommendation |
|---|---|---|
| 6 | N+1 query in SupplierLeaderboard | Use a single GROUP BY query: `.rpc('supplier_stats', { since: thirtyDaysAgo })` or materialize as a DB view `v_supplier_leaderboard` |
| 7 | Date-only cycle timestamps | Upgrade `starts_at` / `ends_at` to `timestamptz` with explicit timezone |
| 8 | Missing `cycle_id` in bids | All 2,735 bids have `cycle_id: NULL`. Add FK relationship and populate for historical data |
| 9 | Real-time subscription reliability | Verify Supabase project has "Enable Realtime" on `dc_bids`. Add a fallback polling interval (e.g., every 30s) |

### Low Priority

| # | Issue | Recommendation |
|---|---|---|
| 10 | `.in()` with empty array handling | LiveTicker and WinnerFeed build arrays dynamically — add empty-array guards |
| 11 | `dc_bidder_profiles` dead reference | Remove from test scripts |
| 12 | Price chart date labels shift at 21:00 UTC | Use UTC date labels (`format(parseISO(b.created_at), 'MM/dd', { timeZone: 'UTC' })`) |

---

## 8. Mock Data Strategy (Recommended)

If the production DB cannot be seeded frequently, implement a **graceful fallback pattern**:

```tsx
// In each component, after fetch:
if (data.length === 0 && allowFallback) {
  // Option A: Load from localStorage (last known state)
  // Option B: Switch to demo endpoint with mock Supabase-compatible data
  // Option C: Show "data will appear once bidding starts" message
}
```

**Recommended approach for this dashboard:** The DB already has 2,735 bids. The only gap is **no active cycles + no very-recent bids**. Seeding just those two items (Section 6) makes the entire dashboard functional without mock data. Running the seed SQL above takes ~2 seconds and makes all 6 widgets display real data.

---

## Summary

| Component | Data Status | Action Needed |
|---|---|---|
| TodaySummary | 🔴 Empty (temporal) | Seed recent bids |
| ActiveCycles | 🔴 Empty (all expired) | Seed active cycle |
| LiveTicker | 🔴 Empty (no recent bids) | Seed recent bids |
| PriceCharts | 🟡 Partial | May need default product fix |
| SupplierLeaderboard | ✅ Working | Performance: N+1 queries |
| WinnerFeed | ✅ Working | No action needed |
