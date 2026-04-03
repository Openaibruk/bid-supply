-- Seed demo data for Bid Supply dashboard
-- Run: supabase db execute -f supabase/seed-demo.sql

BEGIN;

-- 1) Ensure an active bidding cycle exists (insert if none with future end date)
INSERT INTO dc_bidding_cycles (cycle_id, cycle_name, starts_at, ends_at, status)
SELECT 'cycle-demo-2026-q2', 'Q2 2026 Addis Bidding Cycle', '2026-04-01', '2026-04-30', 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM dc_bidding_cycles WHERE status = 'active' AND ends_at > CURRENT_DATE
);

-- 2) Insert recent bids (last 4 hours) if there are none today (local date)
-- We'll generate ~20 bids across top products and suppliers
WITH recent AS (
  SELECT COUNT(*) AS cnt FROM dc_bids
  WHERE created_at >= NOW() - INTERVAL '4 hours'
)
INSERT INTO dc_bids (
  id, batch_id, bid_date, product_id, supplier_id,
  bid_price, is_winner, created_at, volume,
  submitted_via, is_expired, is_price_override
)
SELECT
  gen_random_uuid()::text,
  gen_random_uuid()::text,
  CURRENT_DATE::text,
  p.product_id,
  s.supplier_id,
  floor(random() * 200 + 30)::int,
  false,
  NOW() - (random() * interval '3 hours'),
  floor(random() * 500 + 10)::int,
  'web',
  false,
  false
FROM (SELECT product_id FROM products ORDER BY random() LIMIT 10) p
CROSS JOIN (SELECT supplier_id FROM dc_suppliers WHERE active = true ORDER BY random() LIMIT 10) s
WHERE (SELECT cnt FROM recent) = 0
LIMIT 20;

-- 3) Mark some recent bids as winners (if any exist without winner marks)
WITH recent_ids AS (
  SELECT id FROM dc_bids
  WHERE created_at >= NOW() - INTERVAL '4 hours'
  AND is_winner = false
  ORDER BY created_at DESC
  LIMIT 2
)
UPDATE dc_bids
SET is_winner = true
WHERE id IN (SELECT id FROM recent_ids);

-- 4) Ensure all recent bids have volume for Total Volume card
UPDATE dc_bids
SET volume = floor(random() * 1000 + 50)::int
WHERE created_at >= NOW() - INTERVAL '24 hours'
AND volume IS NULL;

COMMIT;
