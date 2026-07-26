import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukmtqmaxruxhyiubjvaw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbXRxbWF4cnV4aHlpdWJqdmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2OTYyODcsImV4cCI6MjA5NjI3MjI4N30.ybFX7dtas39Tat-1USgnMxNtdkHhUK9z6zXdyBBvBYs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
