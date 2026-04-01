const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://ckckcqszswqcyswctkab.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrY2tjcXN6c3dxY3lzd2N0a2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3Mjk3NjEsImV4cCI6MjA2NTMwNTc2MX0.av4gcddK_C9PO4KbzjjxwqLed2RCHVTSEhjHZt0hZAM')

async function test() {
  const tables = ['dc_bids', 'dc_suppliers', 'dc_coordinators', 'dc_bidding_cycles', 'products']
  
  for (const table of tables) {
    const { count, error: headErr } = await supabase.from(table).select('*', { count: 'exact', head: true })
    console.log(`${table}: ${headErr ? headErr.message : count + ' rows accessible'}`)
  }
}

test()
