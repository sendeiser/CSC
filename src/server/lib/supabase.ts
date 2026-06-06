import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || 'https://ukmtqmaxruxhyiubjvaw.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbXRxbWF4cnV4aHlpdWJqdmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2OTYyODcsImV4cCI6MjA5NjI3MjI4N30.ybFX7dtas39Tat-1USgnMxNtdkHhUK9z6zXdyBBvBYs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const serviceKey = process.env.SUPABASE_SERVICE_KEY
export const serviceClient = serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null
