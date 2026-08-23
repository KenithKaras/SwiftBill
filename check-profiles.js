import { createClient } from '@supabase/supabase-js';

const url = "https://mdomixdjndmenamgbjym.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kb21peGRqbmRtZW5hbWdianltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NjU4MTcsImV4cCI6MjA5MjI0MTgxN30.GnkignYvzdsK-QZzekaNnYAWmaH2gnmtCx4D6S3Ov3w";

const supabase = createClient(url, key);

async function test() {
  console.log('Fetching profiles...');
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      console.log('Profiles found:', data);
    }
  } catch (err) {
    console.error('Unexpected exception:', err);
  }
}

test();
