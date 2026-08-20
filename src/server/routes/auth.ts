import { Router, Request, Response } from 'express'
import { supabase, serviceClient } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest, isEmailAdmin } from '../lib/auth'
import { notifyNewUser } from '../lib/notifications'

const router = Router()

router.post('/signup', async (req: Request, res: Response) => {
  const { email, password, name } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son requeridos' })
    return
  }

  const resolvedName = name || email.split('@')[0]

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: resolvedName }
    }
  })

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  // Notificar al administrador al celular directamente
  try {
    await notifyNewUser({ name: resolvedName, email })
  } catch (err) {
    console.warn('[Signup Notification Error]:', err)
  }

  res.status(201).json({
    user: data.user,
    session: data.session,
    message: 'Usuario registrado correctamente'
  })
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son requeridos' })
    return
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    res.status(401).json({ error: 'Credenciales inválidas' })
    return
  }

  const db = serviceClient || supabase
  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  const userEmail = data.user.email || ''
  const isAdmin = isEmailAdmin(userEmail) || profile?.role === 'admin'
  const resolvedRole = isAdmin ? 'admin' : (profile?.role || 'customer')

  if (isAdmin && profile?.role !== 'admin') {
    await db.from('profiles').upsert({
      id: data.user.id,
      name: profile?.name || userEmail.split('@')[0],
      role: 'admin'
    })
  }

  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name || data.user.email?.split('@')[0],
      role: resolvedRole
    },
    session: data.session
  })
})

router.post('/logout', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token) {
    await supabase.auth.admin.signOut(token)
  }
  res.json({ message: 'Sesión cerrada correctamente' })
})

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const db = serviceClient || supabase
  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', req.user!.id)
    .maybeSingle()

  const userEmail = req.user!.email || ''
  const isAdmin = isEmailAdmin(userEmail) || profile?.role === 'admin' || req.user?.role === 'admin'
  const resolvedRole = isAdmin ? 'admin' : (profile?.role || req.user?.role || 'customer')

  if (!profile || (isAdmin && profile.role !== 'admin')) {
    await db.from('profiles').upsert({
      id: req.user!.id,
      name: profile?.name || userEmail.split('@')[0] || 'Usuario',
      role: resolvedRole
    })
  }

  res.json({
    id: req.user!.id,
    email: req.user!.email,
    name: profile?.name || req.user!.email?.split('@')[0],
    role: resolvedRole,
    created_at: profile?.created_at
  })
})

router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body

  const { data, error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', req.user!.id)
    .select()
    .single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json(data)
})

export default router
