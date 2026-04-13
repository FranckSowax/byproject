import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build-time (SSG/prerendering), env vars may not be available.
    // Return a client with placeholder values — it won't be used at build time
    // since these pages are 'use client' and data fetching happens in useEffect.
    if (typeof window === 'undefined') {
      return createBrowserClient<Database>(
        'https://placeholder.supabase.co',
        'placeholder-anon-key'
      );
    }
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables.'
    );
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
};
