import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl !== 'your_supabase_project_url' &&
  rawKey !== 'your_supabase_anon_key' &&
  rawUrl.startsWith('http')
);

// Fallback dummy URL/key to avoid createClient throwing during initialization if env vars are missing
const safeUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder-studyflow.supabase.co';
const safeKey = isSupabaseConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
