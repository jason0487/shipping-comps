import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient() {
  // Only run on client side to prevent server-side issues
  if (typeof window === 'undefined') {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Supabase config check:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseAnonKey,
    availableVars: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  });
  
  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing');
    return createMockSupabase();
  }
  
  if (!supabaseAnonKey) {
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is missing');
    return createMockSupabase();
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Mock Supabase client to prevent crashes when env vars are missing
function createMockSupabase() {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithOAuth: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback: any) => {
        // Call callback immediately with no session
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
      update: () => Promise.resolve({ error: { message: 'Supabase not configured' } })
    })
  };
}

// For backward compatibility, export as lazy-initialized singleton
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const supabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
};