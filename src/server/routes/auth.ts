import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../lib/auth'

const router = Router()

router.post('/signup', async (req: Request, res: Response) => {
  const { email, password, name } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son requeridos' })
    return
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || email.split('@')[0] }
    }
  })

  if (error) {
    res.status(400).json({ error: error.message })
    return
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name || data.user.email?.split('@')[0],
      role: profile?.role || 'customer'
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user!.id)
    .single()

  res.json({
    id: req.user!.id,
    email: req.user!.email,
    name: profile?.name || req.user!.email.split('@')[0],
    role: profile?.role || 'customer',
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
