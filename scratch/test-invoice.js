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

  console.log('Creating a test invoice...');
  const testInvoice = {
    invoice_no: 'INV-' + Date.now(),
    user_id: userId,
    client_name: 'Test Client',
    client_email: 'test@client.com',
    client_phone: '1234567890',
    date: '2026-05-21',
    due_date: '2026-05-28',
    items: [{ name: 'Test Item', quantity: 2, price: 100 }],
    gst_enabled: false,
    gst_percentage: 18,
    total_amount: 200,
    status: 'unpaid',
    notes: 'Test notes',
    template_type: 'modern'
  };

  try {
    console.log('Inserting into invoices table...');
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('invoices')
      .insert([testInvoice])
      .select()
      .single();
    
    const duration = Date.now() - startTime;
    console.log(`Query took ${duration}ms`);

    if (error) {
      console.error('Insert failed with error:', error);
    } else {
      console.log('Insert successful! Result:', data);
    }

    console.log('Fetching all invoices for user...');
    const startFetchTime = Date.now();
    const { data: fetchResult, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    const fetchDuration = Date.now() - startFetchTime;
    console.log(`Fetch query took ${fetchDuration}ms`);
    if (fetchError) {
      console.error('Fetch failed with error:', fetchError);
    } else {
      console.log(`Fetch successful! Retrieved ${fetchResult.length} invoices.`);
    }
  } catch (err) {
    console.error('Insert threw error:', err);
  }
}

run();
