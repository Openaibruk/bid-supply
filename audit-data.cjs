const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://ckckcqszswqcyswctkab.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrY2tjcXN6c3dxY3lzd2N0a2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3Mjk3NjEsImV4cCI6MjA2NTMwNTc2MX0.av4gcddK_C9PO4KbzjjxwqLed2RCHVTSEhjHZt0hZAM';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function schemaInfo(table) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { empty: true };
  const keys = Object.keys(data[0]);
  return { keys, sample: data[0] };
}

async function run() {
  console.log('=== TABLE SCHEMAS ===\n');

  const tables = ['dc_bids', 'dc_suppliers', 'dc_bidding_cycles', 'products', 'dc_coordinators', 'dc_bidder_profiles'];
  for (const t of tables) {
    const info = await schemaInfo(t);
    if (info.error) {
      console.log(`❌ ${t}: ${info.error}`);
    } else if (info.empty) {
      console.log(`⚠️  ${t}: EXISTS but EMPTY (0 rows accessible via anon)`);
    } else {
      console.log(`✅ ${t}`);
      console.log(`   Columns: ${info.keys.join(', ')}`);
    }
    console.log('');
  }

  // Count tables
  console.log('=== ROW COUNTS (via anon) ===\n');
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t}: ${error ? 'ERROR: ' + error.message : count + ' rows'}`);
  }

  // dc_bids detail
  console.log('\n=== dc_bids DETAIL ===\n');
  const { data: bidSample, error: bidErr } = await supabase.from('dc_bids').select('*').limit(3);
  if (bidSample && bidSample.length > 0) {
    console.log('Sample bid row:');
    console.log(JSON.stringify(bidSample[0], null, 2));
    // Show column types
    const bid = bidSample[0];
    for (const [k, v] of Object.entries(bid)) {
      console.log(`  ${k}: ${typeof v} = ${v}`);
    }
  }

  // Winners
  const { count: winners } = await supabase.from('dc_bids').select('*', { count: 'exact', head: true }).eq('is_winner', true);
  const { count: totalBids } = await supabase.from('dc_bids').select('*', { count: 'exact', head: true });
  console.log(`\nTotal bids: ${totalBids}, Winners: ${winners}`);

  // Date range
  const { data: oldest } = await supabase.from('dc_bids').select('created_at').order('created_at', { ascending: true }).limit(1);
  const { data: newest } = await supabase.from('dc_bids').select('created_at').order('created_at', { ascending: false }).limit(1);
  console.log(`Date range: ${oldest?.[0]?.created_at} → ${newest?.[0]?.created_at}`);

  // Today's bids
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase.from('dc_bids').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());
  console.log(`Today's bids (since ${today.toISOString()}): ${todayCount}`);

  // Last 4h bids (LiveTicker)
  const since4h = new Date(Date.now() - 4 * 3600 * 1000);
  const { count: recentCount } = await supabase.from('dc_bids').select('*', { count: 'exact', head: true }).gte('created_at', since4h.toISOString());
  console.log(`Bids last 4h (since ${since4h.toISOString()}): ${recentCount}`);

  // Check active cycles
  console.log('\n=== dc_bidding_cycles DETAIL ===\n');
  const { data: cycles } = await supabase.from('dc_bidding_cycles').select('*');
  if (cycles && cycles.length > 0) {
    const now = new Date();
    console.log(`Now (server): ${now.toISOString()}`);
    cycles.forEach(c => {
      const start = new Date(c.starts_at);
      const end = new Date(c.ends_at);
      const isActive = now > start && now < end;
      console.log(`  ${c.cycle_name || c.name || 'unnamed'} | ${c.starts_at} → ${c.ends_at} | status=${c.status || 'n/a'} | active=${isActive}`);
    });
  }

  // Check products
  console.log('\n=== products DETAIL ===\n');
  const { data: prods } = await supabase.from('products').select('*').limit(5);
  if (prods && prods.length > 0) {
    console.log('Sample 5 products:');
    prods.forEach(p => console.log(`  id=${p.product_id} name=${p.product_name}`));
  }

  // Check dc_suppliers
  console.log('\n=== dc_suppliers DETAIL ===\n');
  const { data: supps } = await supabase.from('dc_suppliers').select('*').limit(5);
  if (supps && supps.length > 0) {
    console.log('Sample 5 suppliers:');
    supps.forEach(s => {
      console.log(`  id=${s.supplier_id} name=${s.supplier_name} active=${s.active || 'n/a'}`);
    });
  }

  // Check if dc_bids has 'volume' column
  console.log('\n=== dc_bids column check for volume ===');
  if (bidSample && bidSample.length > 0) {
    const hasVolume = 'volume' in bidSample[0];
    console.log(`Has 'volume' column: ${hasVolume}`);
  }

  // Check join integrity: are product_ids in bids actually in products?
  const { data: bidProductIds } = await supabase.from('dc_bids').select('product_id').limit(50);
  const { data: productIds } = await supabase.from('products').select('product_id');
  if (bidProductIds && productIds) {
    const allProductIds = new Set(productIds.map(p => p.product_id));
    const missing = bidProductIds.filter(b => !allProductIds.has(b.product_id));
    console.log(`\n=== Join Integrity ===`);
    console.log(`Bids with product_ids NOT in products: ${missing.length}/${bidProductIds.length}`);
  }
}

run().catch(console.error);
