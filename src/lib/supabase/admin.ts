import { createClient } from '@supabase/supabase-js'

// Warning: This client bypasses Row Level Security (RLS)
// Only use this in secure server-side contexts (API routes, server actions)
// Never expose the secret key to the client
export function createAdminClient() {
  if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error('SUPABASE_SECRET_KEY is not set')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}