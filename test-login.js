import { createClient } from '@supabase/supabase-js';

const url = "https://mdomixdjndmenamgbjym.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kb21peGRqbmRtZW5hbWdianltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NjU4MTcsImV4cCI6MjA5MjI0MTgxN30.GnkignYvzdsK-QZzekaNnYAWmaH2gnmtCx4D6S3Ov3w";

const supabase = createClient(url, key);

async function run() {
  console.log('Attempting sign in with kenithkaras7@gmail.com...');
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'kenithkaras7@gmail.com',
      password: 'Kenith@123'
    });

    if (authError) {
      console.error('Sign in failed:', authError);
      return;
    }

    console.log('Sign in successful! User ID:', authData.user.id);

    console.log('Fetching profile for user...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch failed:', profileError);
    } else {
      console.log('Profile found:', profileData);
    }
  } catch (err) {
    console.error('Unexpected exception:', err);
  }
}

run();
