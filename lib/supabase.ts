import { createClient, SupabaseClient } from '@supabase/supabase-js';

// This is intentionally hardcoded — these are PUBLIC-facing values (anon key)
// Only SELECT access is granted via Supabase RLS policies.
const SUPABASE_URL = 'https://ckckcqszswqcyswctkab.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrY2tjcXN6c3dxY3lzd2N0a2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3Mjk3NjEsImV4cCI6MjA2NTMwNTc2MX0.av4gcddK_C9PO4KbzjjxwqLed2RCHVTSEhjHZt0hZAM';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
