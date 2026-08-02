import { Router, Response, NextFunction } from 'express'
import { supabase, serviceClient } from '../lib/supabase'
import { requireAdmin, AuthenticatedRequest } from '../lib/auth'

const router = Router()

router.get('/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = serviceClient || supabase
  const { data: users, error } = await db
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  const { data: allOrders } = await db
    .from('orders')
    .select('id, user_id, total, status, created_at, shipping_name, shipping_address, order_items(*, products(*))')
    .order('created_at', { ascending: false })

  const userOrdersMap: Record<string, any[]> = {}
  if (allOrders) {
    allOrders.forEach(o => {
      if (o.user_id) {
        if (!userOrdersMap[o.user_id]) userOrdersMap[o.user_id] = []
        userOrdersMap[o.user_id].push(o)
      }
    })
  }

  const PAID_STATUSES = ['paid', 'shipped', 'delivered']

  const enrichedUsers = (users || []).map(u => {
    const userOrders = userOrdersMap[u.id] || []
    const paidOrders = userOrders.filter(o => PAID_STATUSES.includes(o.status))
    const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
    return {
      ...u,
      ordersCount: userOrders.length,
      paidOrdersCount: paidOrders.length,
      totalSpent,
      orders: userOrders
    }
  })

  res.json(enrichedUsers)
})

router.put('/users/:id/role', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = serviceClient || supabase
  const { role } = req.body

  if (!['customer', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Rol inválido' })
    return
  }

  const { data, error } = await db
    .from('profiles')
    .update({ role })
    .eq('id', req.params.id)
    .select()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  if (!data || data.length === 0) {
    res.status(404).json({ error: 'Usuario o perfil no encontrado' })
    return
  }

  res.json(data[0])
})

router.delete('/users/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id

  if (req.user?.id === targetId) {
    res.status(400).json({ error: 'No podés eliminar tu propia cuenta de administrador.' })
    return
  }

  const db = serviceClient || supabase

  if (serviceClient) {
    const { error: authErr } = await serviceClient.auth.admin.deleteUser(targetId)
    if (authErr) {
      console.warn('[Admin Delete User Auth Warning]:', authErr.message)
    }
  }

  const { error: profileErr } = await db
    .from('profiles')
    .delete()
    .eq('id', targetId)

  if (profileErr) {
    res.status(400).json({ error: profileErr.message })
    return
  }

  res.json({ message: 'Usuario eliminado exitosamente' })
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

  const db = serviceClient || supabase
  const { error: profileError } = await db
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
  const db = serviceClient || supabase
  const { status } = req.query
  let query = db.from('orders').select('*, order_items(*, products(*))').order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status as string)
  }

  const { data: orders, error } = await query

  if (error) {
    console.error('[Admin Orders Error]:', error)
    res.status(500).json({ error: error.message })
    return
  }

  if (!orders || orders.length === 0) {
    res.json([])
    return
  }

  const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))]
  let profilesMap: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await db.from('profiles').select('id, name').in('id', userIds)
    if (profiles) {
      profiles.forEach(p => { profilesMap[p.id] = p })
    }
  }

  const result = orders.map(o => ({
    ...o,
    profiles: profilesMap[o.user_id] || null
  }))

  res.json(result)
})

router.put('/orders/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = serviceClient || supabase
  const { status } = req.body

  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Estado inválido' })
    return
  }

  const { data, error } = await db
    .from('orders')
    .update({ status })
    .eq('id', req.params.id)
    .select('*, order_items(*, products(*))')
    .single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json(data)
})

router.post('/orders/manual', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = serviceClient || supabase
  const { shipping_name, shipping_address, items, status, payment_method } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Debes agregar al menos un producto a la venta.' })
    return
  }

  try {
    let calculatedTotal = 0
    const orderItemsToInsert: any[] = []

    for (const item of items) {
      const { product_id, quantity, unit_price, weight_grams, selected_size } = item
      const qty = Number(quantity || 1)
      const price = Number(unit_price || 0)
      calculatedTotal += price * qty

      orderItemsToInsert.push({
        product_id,
        quantity: qty,
        unit_price: price,
        weight_grams: weight_grams || null,
        selected_size: selected_size || 'Estándar',
      })
    }

    const { data: newOrder, error: orderError } = await db
      .from('orders')
      .insert({
        user_id: req.user?.id || null,
        shipping_name: shipping_name || 'Venta Presencial / Manual',
        shipping_address: shipping_address || 'Venta en Local (Efectivo / Posnet)',
        total: calculatedTotal,
        status: status || 'paid',
        payment_method: payment_method || 'manual',
      })
      .select()
      .single()

    if (orderError) {
      res.status(400).json({ error: orderError.message })
      return
    }

    const itemsWithOrderId = orderItemsToInsert.map(it => ({
      ...it,
      order_id: newOrder.id,
    }))

    const { error: itemsError } = await db.from('order_items').insert(itemsWithOrderId)
    if (itemsError) {
      console.error('[Manual Order Items Error]:', itemsError)
    }

    // Deduct stock from products
    for (const item of items) {
      const { product_id, quantity, weight_grams } = item
      const { data: prod } = await db.from('products').select('stock, unit_type').eq('id', product_id).single()
      if (prod) {
        let deductAmount = quantity
        if (prod.unit_type === 'weight' && weight_grams) {
          deductAmount = weight_grams
        }
        const newStock = Math.max(0, Number(prod.stock || 0) - deductAmount)
        await db.from('products').update({ stock: newStock }).eq('id', product_id)
      }
    }

    res.status(201).json(newOrder)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al crear venta manual' })
  }
})

router.post('/orders/bulk-delete', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = serviceClient || supabase
  const { ids } = req.body

  if (!Array.isArray(ids) || !ids.length) {
    res.status(400).json({ error: 'Array de IDs requerido' })
    return
  }

  try {
    await db.from('order_items').delete().in('order_id', ids)
    const { error } = await db.from('orders').delete().in('id', ids)

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }

    res.json({ message: `${ids.length} pedidos eliminados correctamente` })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al eliminar pedidos' })
  }
})

router.put('/orders/bulk-status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = serviceClient || supabase
  const { ids, status } = req.body

  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
  if (!Array.isArray(ids) || !ids.length || !validStatuses.includes(status)) {
    res.status(400).json({ error: 'IDs y estado válido requeridos' })
    return
  }

  const { error } = await db.from('orders').update({ status }).in('id', ids)

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json({ message: `Estado actualizado a ${status} para ${ids.length} pedidos` })
})

router.delete('/orders/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = serviceClient || supabase
  const orderId = req.params.id

  try {
    await db.from('order_items').delete().eq('order_id', orderId)
    const { error } = await db.from('orders').delete().eq('id', orderId)

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }

    res.json({ message: 'Pedido eliminado correctamente' })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al eliminar pedido' })
  }
})

router.get('/stats', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = serviceClient || supabase
  const { count: totalProducts } = await db.from('products').select('*', { head: true, count: 'exact' })
  const { count: totalUsers } = await db.from('profiles').select('*', { head: true, count: 'exact' })
  const { count: totalOrders } = await db.from('orders').select('*', { head: true, count: 'exact' })

  const { data: allProducts } = await db.from('products').select('*')
  const { data: orders } = await db
    .from('orders')
    .select('*, order_items(*, products(*))')
    .order('created_at', { ascending: false })

  const statusCounts = {
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }

  const PAID_STATUSES = ['paid', 'shipped', 'delivered']

  let totalRevenue = 0
  let todaySales = 0
  let weeklySales = 0
  let monthlySales = 0
  let totalCogs = 0

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000)

  // 1. Sales by Last 7 Days
  const daysMap: Record<string, { date: string; dayName: string; total: number; count: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateKey = d.toISOString().split('T')[0]
    const dayName = d.toLocaleDateString('es-AR', { weekday: 'short' })
    const label = `${d.getDate()}/${d.getMonth() + 1}`
    daysMap[dateKey] = { date: label, dayName, total: 0, count: 0 }
  }

  // 2. Top products and Sales by Category
  const productSalesMap: Record<string, { name: string; image_url: string; category: string; totalSold: number; revenue: number }> = {}
  const categorySalesMap: Record<string, number> = {}

  if (orders) {
    orders.forEach(o => {
      if (statusCounts[o.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[o.status as keyof typeof statusCounts]++
      }

      // ONLY paid, shipped, or delivered orders count towards Revenue & Sales Analytics!
      if (PAID_STATUSES.includes(o.status)) {
        const orderTotal = Number(o.total || 0)
        totalRevenue += orderTotal

        const orderTime = new Date(o.created_at).getTime()
        if (orderTime >= todayStart) todaySales += orderTotal
        if (orderTime >= sevenDaysAgo) weeklySales += orderTotal
        if (orderTime >= thirtyDaysAgo) monthlySales += orderTotal

        const orderDateKey = new Date(o.created_at).toISOString().split('T')[0]
        if (daysMap[orderDateKey]) {
          daysMap[orderDateKey].total += orderTotal
          daysMap[orderDateKey].count++
        }

        if (o.order_items && Array.isArray(o.order_items)) {
          o.order_items.forEach((item: any) => {
            const qty = Number(item.quantity || 1)
            const prod = item.products || {}
            const prodId = item.product_id || prod.id || 'unknown'
            const unitPrice = Number(item.unit_price || prod.base_price || 0)
            const itemTotal = unitPrice * qty
            const unitCost = prod.cost_price ? Number(prod.cost_price) : (unitPrice * 0.6)
            totalCogs += unitCost * qty

            const cat = prod.category || 'General'
            categorySalesMap[cat] = (categorySalesMap[cat] || 0) + itemTotal

            if (!productSalesMap[prodId]) {
              productSalesMap[prodId] = {
                name: prod.name || `Producto #${prodId.slice(0, 5)}`,
                image_url: prod.image_url || '',
                category: cat,
                totalSold: 0,
                revenue: 0,
              }
            }
            productSalesMap[prodId].totalSold += qty
            productSalesMap[prodId].revenue += itemTotal
          })
        }
      }
    })
  }

  let totalInventoryCost = 0
  let totalInventoryValue = 0
  if (allProducts) {
    allProducts.forEach(p => {
      const stock = Number(p.stock || 0)
      const price = Number(p.base_price || 0)
      const cost = p.cost_price ? Number(p.cost_price) : (price * 0.6)
      totalInventoryCost += cost * stock
      totalInventoryValue += price * stock
    })
  }

  const netProfit = totalRevenue - totalCogs
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  const salesByDay = Object.values(daysMap)

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const salesByCategory = Object.entries(categorySalesMap).map(([category, revenue]) => ({
    category,
    revenue,
  })).sort((a, b) => b.revenue - a.revenue)

  const recentOrders = (orders || []).slice(0, 8)
  const userIds = [...new Set(recentOrders.map(o => o.user_id).filter(Boolean))]
  let profilesMap: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await db.from('profiles').select('id, name').in('id', userIds)
    if (profiles) profiles.forEach(p => { profilesMap[p.id] = p })
  }

  const recentOrdersWithProfiles = recentOrders.map(o => ({
    ...o,
    profiles: profilesMap[o.user_id] || null
  }))

  res.json({
    totalProducts: totalProducts || 0,
    totalUsers: totalUsers || 0,
    totalOrders: totalOrders || 0,
    totalRevenue,
    todaySales,
    weeklySales,
    monthlySales,
    totalInventoryCost,
    totalInventoryValue,
    netProfit,
    profitMargin,
    salesByDay,
    topProducts,
    salesByCategory,
    statusCounts,
    recentOrders: recentOrdersWithProfiles
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