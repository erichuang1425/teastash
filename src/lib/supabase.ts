import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

let supabaseClient: SupabaseClient | null = null

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseClient
}
