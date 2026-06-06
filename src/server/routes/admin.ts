import { Router, Response } from 'express'
import { supabase, serviceClient } from '../lib/supabase'
import { requireAdmin, AuthenticatedRequest } from '../lib/auth'

const router = Router()

router.get('/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

router.put('/users/:id/role', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.body

  if (!['customer', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Rol inválido' })
    return
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json(data)
})

router.post('/create-user', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { email, password, name, role } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña requeridos' })
    return
  }

  if (!serviceClient) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_KEY no configurada en el servidor' })
    return
  }

  const validRoles = ['customer', 'admin']
  const userRole = validRoles.includes(role) ? role : 'customer'

  const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name || '' }
  })

  if (authError) {
    res.status(400).json({ error: authError.message })
    return
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: userRole, name: name || null })
    .eq('id', authUser.user.id)

  if (profileError) {
    res.status(500).json({ error: profileError.message })
    return
  }

  res.status(201).json({ message: `Usuario ${email} creado con rol ${userRole}`, id: authUser.user.id })
})

router.get('/orders', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query
  let query = supabase.from('orders').select('*, order_items(*), profiles(name)').order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status as string)
  }

  const { data, error } = await query

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

router.put('/orders/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body

  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Estado inválido' })
    return
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json(data)
})

router.get('/stats', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { count: totalProducts } = await supabase.from('products').select('*', { head: true, count: 'exact' })
  const { count: totalUsers } = await supabase.from('profiles').select('*', { head: true, count: 'exact' })
  const { count: totalOrders } = await supabase.from('orders').select('*', { head: true, count: 'exact' })

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('total')
    .order('created_at', { ascending: false })
    .limit(100)

  const totalRevenue = recentOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0

  res.json({
    totalProducts: totalProducts || 0,
    totalUsers: totalUsers || 0,
    totalOrders: totalOrders || 0,
    totalRevenue
  })
})

router.get('/promo-codes', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

router.post('/promo-codes', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase.from('promo_codes').insert(req.body).select().single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.status(201).json(data)
})

export default router
