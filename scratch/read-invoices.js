import { createClient } from '@supabase/supabase-js';

const url = "https://mdomixdjndmenamgbjym.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kb21peGRqbmRtZW5hbWdianltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NjU4MTcsImV4cCI6MjA5MjI0MTgxN30.GnkignYvzdsK-QZzekaNnYAWmaH2gnmtCx4D6S3Ov3w";

const supabase = createClient(url, key);

async function run() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'kenithkaras7@gmail.com',
    password: 'Kenith@123'
  });

  if (authError) {
    console.error('Sign in failed:', authError);
    return;
  }

  const userId = authData.user.id;
  console.log('Logged in successfully! User ID:', userId);

  try {
    console.log('Fetching all invoices...');
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch failed with error:', error);
    } else {
      console.log('Fetch successful! Invoices:', data);
    }
  } catch (err) {
    console.error('Fetch threw error:', err);
  }
}

run();
