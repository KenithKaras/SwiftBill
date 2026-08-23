import { createClient } from '@supabase/supabase-js';

const url = "https://mdomixdjndmenamgbjym.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kb21peGRqbmRtZW5hbWdianltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NjU4MTcsImV4cCI6MjA5MjI0MTgxN30.GnkignYvzdsK-QZzekaNnYAWmaH2gnmtCx4D6S3Ov3w";

const supabase = createClient(url, key);

async function test() {
  console.log('Querying current RLS policies...');
  try {
    // We can run an RPC or query the system pg_policies catalog table.
    // However, the anon key might not have access to select from pg_policies due to RLS/permissions.
    // Let's try it.
    const { data, error } = await supabase.rpc('get_policies_debug');
    if (error) {
      console.log('RPC get_policies_debug failed (expected if not created), trying direct select...');
      const { data: policies, error: err2 } = await supabase
        .from('pg_policies')
        .select('*');
      if (err2) {
        console.error('Failed to query pg_policies:', err2.message);
      } else {
        console.log('Policies:', policies);
      }
    } else {
      console.log('Policies from RPC:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
