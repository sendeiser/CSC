import { Router, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'
import { supabase, serviceClient } from '../lib/supabase'
import { requireAdmin, AuthenticatedRequest } from '../lib/auth'

const FINANCIAL_SETTINGS_FILE = path.join(process.cwd(), 'public', 'uploads', 'financial_settings.json')
const STORE_SETTINGS_FILE = path.join(process.cwd(), 'public', 'uploads', 'store_settings.json')

export async function getStoreSettingsHelper() {
  const db = serviceClient || supabase
  let settings = {
    whatsapp_number_1: '543826432180',
    whatsapp_number_2: '5493826432180',
    active_whatsapp_number: 'num1',
    msg_transfer: '',
    msg_mercadopago: '',
    msg_general_inquiry: '',
    msg_order_status: '',
    msg_preparing: '',
    msg_ready: '',
    fulfillment_type: 'both',
    delivery_cost: 0,
    free_delivery_over: 0,
    pickup_address: 'Local Chamical Candy Shop - Calle Principal #123, Chamical',
    pickup_schedule: 'Lunes a Sábado de 09:00 a 20:00 hs',
    delivery_notes: 'Envíos en el día dentro del radio urbano de Chamical.',
  }

  try {
    const { data } = await db
      .from('homepage_sections')
      .select('content')
      .eq('section_type', 'store_settings')
      .single()

    if (data?.content) {
      settings = {
        whatsapp_number_1: data.content.whatsapp_number_1 || '543826432180',
        whatsapp_number_2: data.content.whatsapp_number_2 || '5493826432180',
        active_whatsapp_number: data.content.active_whatsapp_number || 'num1',
        msg_transfer: data.content.msg_transfer || '',
        msg_mercadopago: data.content.msg_mercadopago || '',
        msg_general_inquiry: data.content.msg_general_inquiry || '',
        msg_order_status: data.content.msg_order_status || '',
        msg_preparing: data.content.msg_preparing || '',
        msg_ready: data.content.msg_ready || '',
        fulfillment_type: data.content.fulfillment_type || 'both',
        delivery_cost: Number(data.content.delivery_cost || 0),
        free_delivery_over: Number(data.content.free_delivery_over || 0),
        pickup_address: data.content.pickup_address || 'Local Chamical Candy Shop - Calle Principal #123, Chamical',
        pickup_schedule: data.content.pickup_schedule || 'Lunes a Sábado de 09:00 a 20:00 hs',
        delivery_notes: data.content.delivery_notes || 'Envíos en el día dentro del radio urbano de Chamical.',
      }
    } else if (fs.existsSync(STORE_SETTINGS_FILE)) {
      const raw = fs.readFileSync(STORE_SETTINGS_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      settings = {
        whatsapp_number_1: parsed.whatsapp_number_1 || '543826432180',
        whatsapp_number_2: parsed.whatsapp_number_2 || '5493826432180',
        active_whatsapp_number: parsed.active_whatsapp_number || 'num1',
        msg_transfer: parsed.msg_transfer || '',
        msg_mercadopago: parsed.msg_mercadopago || '',
        msg_general_inquiry: parsed.msg_general_inquiry || '',
        msg_order_status: parsed.msg_order_status || '',
        msg_preparing: parsed.msg_preparing || '',
        msg_ready: parsed.msg_ready || '',
        fulfillment_type: parsed.fulfillment_type || 'both',
        delivery_cost: Number(parsed.delivery_cost || 0),
        free_delivery_over: Number(parsed.free_delivery_over || 0),
        pickup_address: parsed.pickup_address || 'Local Chamical Candy Shop - Calle Principal #123, Chamical',
        pickup_schedule: parsed.pickup_schedule || 'Lunes a Sábado de 09:00 a 20:00 hs',
        delivery_notes: parsed.delivery_notes || 'Envíos en el día dentro del radio urbano de Chamical.',
      }
    }
  } catch (_e) {}

  const active_phone = settings.active_whatsapp_number === 'num2'
    ? settings.whatsapp_number_2
    : settings.whatsapp_number_1

  return {
    ...settings,
    active_phone,
  }
}

export async function saveStoreSettingsHelper(payload: any) {
  const db = serviceClient || supabase
  const cleanPayload = {
    whatsapp_number_1: String(payload.whatsapp_number_1 || '543826432180').trim(),
    whatsapp_number_2: String(payload.whatsapp_number_2 || '5493826432180').trim(),
    active_whatsapp_number: payload.active_whatsapp_number === 'num2' ? 'num2' : 'num1',
    msg_transfer: payload.msg_transfer !== undefined ? String(payload.msg_transfer) : '',
    msg_mercadopago: payload.msg_mercadopago !== undefined ? String(payload.msg_mercadopago) : '',
    msg_general_inquiry: payload.msg_general_inquiry !== undefined ? String(payload.msg_general_inquiry) : '',
    msg_order_status: payload.msg_order_status !== undefined ? String(payload.msg_order_status) : '',
    msg_preparing: payload.msg_preparing !== undefined ? String(payload.msg_preparing) : '',
    msg_ready: payload.msg_ready !== undefined ? String(payload.msg_ready) : '',
    fulfillment_type: ['both', 'pickup_only', 'delivery_only'].includes(payload.fulfillment_type) ? payload.fulfillment_type : 'both',
    delivery_cost: Number(payload.delivery_cost || 0),
    free_delivery_over: Number(payload.free_delivery_over || 0),
    pickup_address: payload.pickup_address !== undefined ? String(payload.pickup_address).trim() : 'Local Chamical Candy Shop - Calle Principal #123, Chamical',
    pickup_schedule: payload.pickup_schedule !== undefined ? String(payload.pickup_schedule).trim() : 'Lunes a Sábado de 09:00 a 20:00 hs',
    delivery_notes: payload.delivery_notes !== undefined ? String(payload.delivery_notes).trim() : 'Envíos en el día dentro del radio urbano de Chamical.',
  }

  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    fs.writeFileSync(STORE_SETTINGS_FILE, JSON.stringify(cleanPayload, null, 2), 'utf-8')
  } catch (err) {
    console.error('[Store Settings File Error]:', err)
  }

  try {
    const { data: existing } = await db
      .from('homepage_sections')
      .select('id')
      .eq('section_type', 'store_settings')
      .single()

    if (existing?.id) {
      await db
        .from('homepage_sections')
        .update({ content: cleanPayload })
        .eq('id', existing.id)
    } else {
      await db
        .from('homepage_sections')
        .insert({
          section_type: 'store_settings',
          title: 'Configuración General de la Tienda',
          visible: false,
          order_index: 98,
          content: cleanPayload,
        })
    }
  } catch (err) {
    console.warn('[Store Settings DB Upsert Warning]:', err)
  }

  const active_phone = cleanPayload.active_whatsapp_number === 'num2'
    ? cleanPayload.whatsapp_number_2
    : cleanPayload.whatsapp_number_1

  return {
    ...cleanPayload,
    active_phone,
  }
}

async function getFinancialSettingsHelper() {
  const db = serviceClient || supabase
  try {
    const { data } = await db
      .from('homepage_sections')
      .select('content')
      .eq('section_type', 'financial_settings')
      .single()

    if (data?.content) {
      return data.content
    }
  } catch (_e) {}

  try {
    if (fs.existsSync(FINANCIAL_SETTINGS_FILE)) {
      const raw = fs.readFileSync(FINANCIAL_SETTINGS_FILE, 'utf-8')
      return JSON.parse(raw)
    }
  } catch (_e) {}

  return {
    initial_investment: 0,
    products_cost: 0,
    shipping_cost: 0,
    packaging_cost: 0,
    other_cost: 0,
  }
}

async function saveFinancialSettingsHelper(payload: any) {
  const db = serviceClient || supabase
  const products_cost = Number(payload.products_cost || 0)
  const shipping_cost = Number(payload.shipping_cost || 0)
  const packaging_cost = Number(payload.packaging_cost || 0)
  const other_cost = Number(payload.other_cost || 0)

  const computedTotal = products_cost + shipping_cost + packaging_cost + other_cost
  const initial_investment = payload.initial_investment !== undefined && payload.initial_investment !== null && payload.initial_investment !== ''
    ? Number(payload.initial_investment)
    : computedTotal

  const cleanPayload = {
    initial_investment,
    products_cost,
    shipping_cost,
    packaging_cost,
    other_cost,
  }

  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    fs.writeFileSync(FINANCIAL_SETTINGS_FILE, JSON.stringify(cleanPayload, null, 2), 'utf-8')
  } catch (err) {
    console.error('[Financial Settings File Error]:', err)
  }

  try {
    const { data: existing } = await db
      .from('homepage_sections')
      .select('id')
      .eq('section_type', 'financial_settings')
      .single()

    if (existing?.id) {
      await db
        .from('homepage_sections')
        .update({ content: cleanPayload })
        .eq('id', existing.id)
    } else {
      await db
        .from('homepage_sections')
        .insert({
          section_type: 'financial_settings',
          title: 'Configuración de Inversión Inicial',
          visible: false,
          order_index: 99,
          content: cleanPayload,
        })
    }
  } catch (err) {
    console.warn('[Financial Settings DB Upsert Warning]:', err)
  }

  return cleanPayload
}

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

  const result = orders.map(o => normalizeOrder({
    ...o,
    profiles: profilesMap[o.user_id] || null
  }))

  res.json(result)
})

function normalizeOrder(o: any) {
  if (!o) return o
  let status = o.status
  let receiptUrl = o.receipt_url || null
  const address = o.shipping_address || ''
  if (address.includes('[Estado: En preparación]')) {
    status = 'preparing'
  } else if (address.includes('[Estado: Listo]')) {
    status = 'ready'
  }

  const receiptMatch = address.match(/\[Comprobante: (https?:\/\/[^\]]+)\]/)
  if (receiptMatch) {
    receiptUrl = receiptMatch[1]
  }

  return {
    ...o,
    status,
    receipt_url: receiptUrl
  }
}

async function updateOrderStatusHelper(db: any, orderId: string, targetStatus: string) {
  // Obtener dirección actual y limpiar cualquier tag de estado previo
  const { data: currentOrder } = await db.from('orders').select('shipping_address').eq('id', orderId).single()
  let cleanAddress = (currentOrder?.shipping_address || '').replace(/\[Estado: [^\]]+\]/g, '').trim()

  let tag = ''
  if (targetStatus === 'preparing' || targetStatus === 'en_preparacion') {
    tag = '[Estado: En preparación]'
  } else if (targetStatus === 'ready' || targetStatus === 'listo') {
    tag = '[Estado: Listo]'
  }

  const finalAddress = tag ? `${cleanAddress} ${tag}`.trim() : cleanAddress

  // 1. Intenta la actualización directa con el estado deseado y la dirección limpia de tags viejos
  const { data: directData, error: directErr } = await db
    .from('orders')
    .update({ status: targetStatus, shipping_address: finalAddress })
    .eq('id', orderId)
    .select('*, order_items(*, products(*))')
    .single()

  if (!directErr && directData) {
    return { data: normalizeOrder(directData), error: null }
  }

  // 2. Si falla por restricción CHECK de PostgreSQL (orders_status_check)
  if (directErr && (directErr.message?.includes('orders_status_check') || directErr.code === '23514')) {
    let dbStatus = targetStatus
    if (targetStatus === 'preparing' || targetStatus === 'en_preparacion' || targetStatus === 'ready' || targetStatus === 'listo') {
      dbStatus = 'paid'
    }

    const { data: fallbackData, error: fallbackErr } = await db
      .from('orders')
      .update({ status: dbStatus, shipping_address: finalAddress })
      .eq('id', orderId)
      .select('*, order_items(*, products(*))')
      .single()

    if (fallbackErr) {
      return { data: null, error: fallbackErr }
    }
    return { data: normalizeOrder(fallbackData), error: null }
  }

  return { data: null, error: directErr }
}

router.put('/orders/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = serviceClient || supabase
  const { status } = req.body

  const validStatuses = ['pending', 'paid', 'preparing', 'ready', 'en_preparacion', 'listo', 'shipped', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Estado inválido' })
    return
  }

  const { data, error } = await updateOrderStatusHelper(db, req.params.id, status)

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

    const orderPayload: any = {
      user_id: req.user?.id || null,
      shipping_name: shipping_name || 'Venta Presencial / Manual',
      shipping_address: shipping_address || 'Venta en Local (Efectivo / Posnet)',
      total: calculatedTotal,
      status: status || 'paid',
    }

    let newOrder: any = null
    let orderError: any = null

    // Intenta primero guardar con payment_method
    const { data: tryOrder, error: tryErr } = await db
      .from('orders')
      .insert({
        ...orderPayload,
        payment_method: payment_method || 'manual',
      })
      .select()
      .single()

    if (tryErr) {
      // Si la columna payment_method no existe en la BD de Supabase, hace fallback sin esa columna
      if (tryErr.message?.includes('payment_method') || (tryErr as any).code === 'PGRST204') {
        const methodLabel = payment_method === 'efectivo' ? 'Efectivo' : payment_method === 'transferencia' ? 'Transferencia' : payment_method === 'posnet' ? 'Posnet/Tarjeta' : payment_method || 'Manual'
        const { data: fallbackOrder, error: fallbackErr } = await db
          .from('orders')
          .insert({
            ...orderPayload,
            shipping_address: `${orderPayload.shipping_address} [Método: ${methodLabel}]`,
          })
          .select()
          .single()

        newOrder = fallbackOrder
        orderError = fallbackErr
      } else {
        orderError = tryErr
      }
    } else {
      newOrder = tryOrder
    }

    if (orderError || !newOrder) {
      res.status(400).json({ error: orderError?.message || 'Error al crear la orden' })
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

  const validStatuses = ['pending', 'paid', 'preparing', 'ready', 'en_preparacion', 'listo', 'shipped', 'delivered', 'cancelled']
  if (!Array.isArray(ids) || !ids.length || !validStatuses.includes(status)) {
    res.status(400).json({ error: 'IDs y estado válido requeridos' })
    return
  }

  for (const id of ids) {
    await updateOrderStatusHelper(db, id, status)
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

function toLocalDateKey(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

  const PAID_STATUSES = ['paid', 'shipped', 'delivered', 'completed']

  const enrichedUsers = (users || []).map(u => {
    const userOrders = userOrdersMap[u.id] || []
    const paidOrders = userOrders.filter(o => PAID_STATUSES.includes((o.status || '').toLowerCase()))
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

  const statusCounts: Record<string, number> = {
    pending: 0,
    paid: 0,
    preparing: 0,
    ready: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }

  const PAID_STATUSES = ['paid', 'preparing', 'ready', 'en_preparacion', 'listo', 'shipped', 'delivered', 'completed']

  let totalRevenue = 0
  let todaySales = 0
  let weeklySales = 0
  let monthlySales = 0
  let totalCogs = 0

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000)

  // 1. Sales by Last 7 Days (usando zona horaria local)
  const daysMap: Record<string, { date: string; dayName: string; total: number; count: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateKey = toLocalDateKey(d)
    const dayName = d.toLocaleDateString('es-AR', { weekday: 'short' })
    const label = `${d.getDate()}/${d.getMonth() + 1}`
    daysMap[dateKey] = { date: label, dayName, total: 0, count: 0 }
  }

  // 2. Top products and Sales by Category
  const productSalesMap: Record<string, { name: string; image_url: string; category: string; totalSold: number; revenue: number }> = {}
  const categorySalesMap: Record<string, number> = {}

  if (orders) {
    orders.forEach(o => {
      const st = (o.status || '').toLowerCase()
      if (statusCounts[st as keyof typeof statusCounts] !== undefined) {
        statusCounts[st as keyof typeof statusCounts]++
      }

      // SOLO los pedidos confirmados/pagados suman en las métricas de ingresos
      if (PAID_STATUSES.includes(st)) {
        const orderTotal = Number(o.total || 0)
        totalRevenue += orderTotal

        const orderTime = new Date(o.created_at).getTime()
        if (orderTime >= todayStart) todaySales += orderTotal
        if (orderTime >= sevenDaysAgo) weeklySales += orderTotal
        if (orderTime >= thirtyDaysAgo) monthlySales += orderTotal

        const orderDateKey = toLocalDateKey(new Date(o.created_at))
        if (daysMap[orderDateKey]) {
          daysMap[orderDateKey].total += orderTotal
          daysMap[orderDateKey].count++
        }

        if (o.order_items && Array.isArray(o.order_items)) {
          o.order_items.forEach((item: any) => {
            const prod = item.products || {}
            const prodId = item.product_id || prod.id || 'unknown'
            
            let itemTotal = Number(item.unit_price || 0)
            let qtySold = Number(item.quantity || 1)
            let itemCost = 0

            if (item.weight_grams) {
              // Producto vendido a granel / por peso (gramos)
              qtySold = item.weight_grams / 1000 // Convertido a kg para unidades
              if (!itemTotal || itemTotal === Number(prod.base_price || 0)) {
                itemTotal = (Number(prod.base_price || 0) * item.weight_grams) / 1000
              }
              const costPerKg = prod.cost_price ? Number(prod.cost_price) : (Number(prod.base_price || 0) * 0.6)
              itemCost = (costPerKg * item.weight_grams) / 1000
            } else {
              // Producto vendido por unidad
              if (itemTotal === 0 && prod.base_price) {
                itemTotal = Number(prod.base_price) * qtySold
              }
              const unitCost = prod.cost_price ? Number(prod.cost_price) : (Number(prod.base_price || item.unit_price || 0) * 0.6)
              itemCost = unitCost * qtySold
            }

            totalCogs += itemCost

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
            productSalesMap[prodId].totalSold += qtySold
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

      // Para productos por peso, el stock está en GRAMOS y el precio/costo por KG (1000g)
      const isWeight = p.unit_type === 'weight'
      const realQty = isWeight ? (stock / 1000) : stock

      totalInventoryCost += cost * realQty
      totalInventoryValue += price * realQty
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

  const financialSettings = await getFinancialSettingsHelper()
  const initialInvestment = Number(financialSettings.initial_investment || 0)
  const realNetProfit = totalRevenue - initialInvestment
  const roiPct = initialInvestment > 0 ? ((totalRevenue - initialInvestment) / initialInvestment) * 100 : 0
  const recoveryPct = initialInvestment > 0 ? Math.min(100, Math.round((totalRevenue / initialInvestment) * 100)) : 100

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
    initialInvestment,
    financialSettings,
    realNetProfit,
    roiPct,
    recoveryPct,
    salesByDay,
    topProducts,
    salesByCategory,
    statusCounts,
    recentOrders: recentOrdersWithProfiles
  })
})

router.get('/financial-settings', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  const settings = await getFinancialSettingsHelper()
  res.json(settings)
})

router.put('/financial-settings', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const saved = await saveFinancialSettingsHelper(req.body)
  res.json(saved)
})

router.get('/store-settings', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  const settings = await getStoreSettingsHelper()
  res.json(settings)
})

router.put('/store-settings', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const saved = await saveStoreSettingsHelper(req.body)
  res.json(saved)
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

router.post('/homepage/sections', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const { section_type, title, subtitle, content, order_index, visible } = req.body
  const db = adminDb(res)
  if (!db) return

  const { data, error } = await db
    .from('homepage_sections')
    .insert({
      section_type: section_type || 'hero',
      title: title || 'Chamical',
      subtitle: subtitle || 'Candy Shop',
      content: content || {},
      order_index: order_index || 1,
      visible: visible !== undefined ? visible : true
    })
    .select()
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.status(201).json(data)
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