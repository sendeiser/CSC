import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // No intentar refrescar tokens automáticamente en background —
    // lo manejamos explícitamente via onAuthStateChange en App.tsx
    autoRefreshToken: true,
    // No leer parámetros de sesión de la URL (#access_token=...) automáticamente
    // para evitar errores cuando el hash ya expiró
    detectSessionInUrl: false,
    // Persistir sesión en localStorage
    persistSession: true,
  }
})
