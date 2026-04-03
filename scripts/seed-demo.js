#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  // 1) Ensure an active cycle exists (ends in future)
  const { data: cycles } = await supabase
    .from('dc_bidding_cycles')
    .select('cycle_id')
    .eq('status', 'active')
    .gt('ends_at', new Date().toISOString().split('T')[0]); // compare date-only

  if (cycles.length === 0) {
    const { error } = await supabase.from('dc_bidding_cycles').insert({
      cycle_id: 'cycle-demo-2026-q2',
      cycle_name: 'Q2 2026 Addis Bidding Cycle',
      starts_at: '2026-04-01',
      ends_at: '2026-04-30',
      status: 'active',
    });
    if (error) console.error('Cycle insert error:', error);
    else console.log('Inserted demo active cycle');
  } else {
    console.log('Active cycle exists, skipping');
  }

  // 2) Check recent bids count in last 4 hours
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from('dc_bids')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', fourHoursAgo);

  console.log(`Recent bids in last 4h: ${recentCount || 0}`);

  if (recentCount === 0) {
    // Fetch some product_ids and supplier_ids
    const { data: products } = await supabase.from('products').select('product_id').limit(10);
    const { data: suppliers } = await supabase.from('dc_suppliers').select('supplier_id').eq('active', true).limit(10);
    if (!products || products.length === 0 || !suppliers || suppliers.length === 0) {
      console.error('Missing products or suppliers to seed bids');
    } else {
      const bidsToInsert = [];
      const now = new Date();
      for (let i = 0; i < 20; i++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)].product_id;
        const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)].supplier_id;
        const bidTime = new Date(now.getTime() - Math.random() * 3 * 60 * 60 * 1000); // within last 3 hours
        bidsToInsert.push({
          id: crypto.randomUUID(),
          batch_id: crypto.randomUUID(),
          bid_date: new Date(bidTime).toISOString().split('T')[0],
          product_id: randomProduct,
          supplier_id: randomSupplier,
          bid_price: Math.floor(Math.random() * 200 + 30),
          is_winner: false,
          created_at: bidTime.toISOString(),
          volume: Math.floor(Math.random() * 500 + 10),
          submitted_via: 'web',
          is_expired: false,
          is_price_override: false,
        });
      }
      const { error: insertError } = await supabase.from('dc_bids').insert(bidsToInsert);
      if (insertError) console.error('Bids insert error:', insertError);
      else console.log('Inserted 20 recent bids');

      // Mark 2 as winners
      const { data: recentBids } = await supabase
        .from('dc_bids')
        .select('id')
        .gte('created_at', fourHoursAgo)
        .eq('is_winner', false)
        .order('created_at', { ascending: false })
        .limit(2);
      if (recentBids && recentBids.length >= 2) {
        const winnerIds = recentBids.map(b => b.id);
        await supabase.from('dc_bids').update({ is_winner: true }).in('id', winnerIds);
        console.log('Marked 2 recent bids as winners');
      }
    }
  } else {
    console.log('Already have recent bids, skipping insertion');
  }

  // 3) Ensure all recent bids have volume for Total Volume card
  await supabase.rpc('update_volume_for_recent_bids'); // we'll create a simple RPC if needed, or update directly
  // Direct update as fallback:
  await supabase
    .from('dc_bids')
    .update({ volume: Math.floor(Math.random() * 1000 + 50) })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .is('volume', null);
  console.log('Updated volume for recent bids if any were null');
}

seed().then(() => {
  console.log('Seed complete');
  process.exit(0);
}).catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
