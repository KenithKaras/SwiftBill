import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return { url, key };
};

// Lazy initialize the client to prevent crashing on startup when keys are missing
let _supabase: any = null;

export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!_supabase) {
      const { url, key } = getSupabaseConfig();
      
      if (!url || !key) {
        // Return a dummy object for auth/storage if keys are missing to prevent total UI crash,
        // but throw error on actual database/auth operations.
        console.error('Supabase configuration missing (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
        
        // If it's a known property access like auth or from, provide a dummy that returns a promise rejection
        if (prop === 'auth' || prop === 'from') {
          return () => {
            throw new Error('Supabase project details are missing. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment settings.');
          };
        }
        
        throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      }
      
      _supabase = createClient(url, key);
    }
    
    const value = (_supabase as any)[prop];
    return typeof value === 'function' ? value.bind(_supabase) : value;
  }
});
