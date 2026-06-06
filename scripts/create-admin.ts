import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || 'https://ukmtqmaxruxhyiubjvaw.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

async function createAdmin() {
  const email = process.argv[2] || 'admin@chamicalcandy.shop'
  const password = process.argv[3] || 'Admin123!'

  if (!supabaseServiceKey) {
    console.error('ERROR: Necesitas configurar SUPABASE_SERVICE_KEY en .env')
    console.error('Ve a Supabase Dashboard > Project Settings > API > service_role key')
    process.exit(1)
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { data: existing } = await admin.from('profiles').select('id').eq('role', 'admin').limit(1)
  if (existing && existing.length > 0) {
    console.log('Ya existe un admin. Email:', existing[0].id)
    process.exit(0)
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Admin CSC' }
  })

  if (error) {
    console.error('Error al crear admin:', error.message)
    process.exit(1)
  }

  await admin.from('profiles').update({ role: 'admin', name: 'Admin CSC' }).eq('id', data.user.id)

  console.log(`✅ Admin creado: ${email} / ${password}`)
  console.log('🔐 CAMBIA LA CONTRASEÑA después del primer inicio de sesión.')
}

createAdmin()
