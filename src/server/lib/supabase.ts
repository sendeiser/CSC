import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing SUPABASE_URL or SUPABASE_ANON_KEY - using placeholder (will fail at runtime)')
}

const fallbackUrl = supabaseUrl || 'https://placeholder.supabase.co'
const fallbackKey = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient(fallbackUrl, fallbackKey, {
  realtime: { transport: ws },
})

const serviceKey = process.env.SUPABASE_SERVICE_KEY
export const serviceClient = serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null
