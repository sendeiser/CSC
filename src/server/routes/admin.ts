import { Router, Response, NextFunction } from 'express'
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
  let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })

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

// ── helpers ────────────────────────────────────────────────

function adminDb(res: Response) {
  if (!serviceClient) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_KEY no configurada en el servidor' })
    return null
  }
  return serviceClient
}

function wrap(fn: (req: AuthenticatedRequest, res: Response) => Promise<void>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    fn(req, res).catch(next)
  }
}

// ── Homepage sections ──────────────────────────────────────

router.get('/homepage', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const db = adminDb(res)
  if (!db) return

  const { data, error } = await db
    .from('homepage_sections')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
}))

router.put('/homepage/sections/reorder', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const { sections } = req.body
  if (!Array.isArray(sections)) { res.status(400).json({ error: 'Se requiere un array de secciones' }); return }

  const db = adminDb(res)
  if (!db) return

  for (const section of sections) {
    await db.from('homepage_sections').update({ order_index: section.order_index, visible: section.visible }).eq('id', section.id)
  }

  res.json({ message: 'Orden actualizado' })
}))

router.put('/homepage/sections/:id', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const { title, subtitle, content, visible } = req.body

  const updates: any = { updated_at: new Date().toISOString() }
  if (title !== undefined) updates.title = title
  if (subtitle !== undefined) updates.subtitle = subtitle
  if (content !== undefined) updates.content = content
  if (visible !== undefined) updates.visible = visible

  const db = adminDb(res)
  if (!db) return

  const { data, error } = await db
    .from('homepage_sections')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json(data)
}))

router.delete('/homepage/sections/:id', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const db = adminDb(res)
  if (!db) return

  const { error } = await db.from('homepage_sections').delete().eq('id', req.params.id)
  if (error) { res.status(400).json({ error: error.message }); return }

  res.json({ message: 'Sección eliminada' })
}))

// ── About page ─────────────────────────────────────────────

router.get('/about', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const db = adminDb(res)
  if (!db) return

  const { data, error } = await db.from('about_page').select('*').limit(1).single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
}))

router.put('/about', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const { title, subtitle, content } = req.body

  const db = adminDb(res)
  if (!db) return

  const { data, error } = await db
    .from('about_page')
    .update({ title, subtitle, content, updated_at: new Date().toISOString() })
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .select()
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json(data)
}))

// ── Categories ────────────────────────────────────────────

router.get('/categories', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const db = adminDb(res)
  if (!db) return

  const { data, error } = await db.from('categories').select('*').order('order_index', { ascending: true })
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
}))

router.post('/categories', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const { name, slug, icon, color, bg_color, text_color, order_index } = req.body
  const db = adminDb(res)
  if (!db) return

  const { data, error } = await db
    .from('categories')
    .insert({ name, slug, icon, color, bg_color, text_color, order_index })
    .select()
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.status(201).json(data)
}))

router.put('/categories/:id', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const { name, slug, icon, color, bg_color, text_color, order_index } = req.body
  const db = adminDb(res)
  if (!db) return

  const updates: any = {}
  if (name !== undefined) updates.name = name
  if (slug !== undefined) updates.slug = slug
  if (icon !== undefined) updates.icon = icon
  if (color !== undefined) updates.color = color
  if (bg_color !== undefined) updates.bg_color = bg_color
  if (text_color !== undefined) updates.text_color = text_color
  if (order_index !== undefined) updates.order_index = order_index

  const { data, error } = await db
    .from('categories')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json(data)
}))

router.delete('/categories/:id', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const db = adminDb(res)
  if (!db) return

  const { error } = await db.from('categories').delete().eq('id', req.params.id)
  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ message: 'Categoría eliminada' })
}))

export default router