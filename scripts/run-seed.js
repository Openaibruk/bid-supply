import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seedSql = `
-- Seed demo data for Bid Supply dashboard

BEGIN;

-- 1) Ensure an active bidding cycle exists
INSERT INTO dc_bidding_cycles (cycle_id, cycle_name, starts_at, ends_at, status)
SELECT 'cycle-demo-2026-q2', 'Q2 2026 Addis Bidding Cycle', '2026-04-01', '2026-04-30', 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM dc_bidding_cycles WHERE status = 'active' AND ends_at > CURRENT_DATE
);

-- 2) Insert recent bids (last 4 hours) if there are none today
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

-- 3) Mark some recent bids as winners
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

-- 4) Ensure recent bids have volume for Total Volume card
UPDATE dc_bids
SET volume = floor(random() * 1000 + 50)::int
WHERE created_at >= NOW() - INTERVAL '24 hours'
AND volume IS NULL;

COMMIT;
`;

async function runSeed() {
  // Run raw SQL via Supabase (requires service role key normally). 
  // Since anon key doesn't allow writes, we may need service key.
  // Fallback: print instructions to run via Supabase Studio.
  console.log('Seed SQL prepared. This script requires service_role key to execute DML with raw SQL.');
  console.log('Please run the following SQL in your Supabase Studio SQL Editor:\n');
  console.log(seedSql);
}

runSeed().catch(console.error);
