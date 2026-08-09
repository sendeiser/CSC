import { Router, Response } from 'express'
import { serviceClient } from '../lib/supabase'
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../lib/auth'
import { getPayment } from '../lib/mercadopago'

const router = Router()

function normalizeOrderClient(o: any) {
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

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await serviceClient
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json((data || []).map(normalizeOrderClient))
})

router.get('/search', async (req: any, res: Response) => {
  const { order_id } = req.query
  if (!order_id) {
    res.status(400).json({ error: 'order_id requerido' })
    return
  }

  const cleanId = String(order_id).trim()
  let query = serviceClient.from('orders').select('*, order_items(*, products(*))')

  if (cleanId.length === 36) {
    query = query.eq('id', cleanId)
  } else {
    query = query.ilike('id', `${cleanId}%`)
  }

  const { data: orders, error } = await query
  if (error || !orders || orders.length === 0) {
    res.status(404).json({ error: 'Pedido no encontrado' })
    return
  }

  res.json(normalizeOrderClient(orders[0]))
})

router.post('/:id/receipt', async (req: any, res: Response) => {
  const { receipt_url } = req.body
  const orderId = req.params.id

  if (!receipt_url) {
    res.status(400).json({ error: 'receipt_url requerido' })
    return
  }

  // 1. Intenta actualizar la columna receipt_url directamente
  const { data: directData, error: directErr } = await serviceClient
    .from('orders')
    .update({ receipt_url })
    .eq('id', orderId)
    .select('*, order_items(*, products(*))')
    .single()

  if (!directErr && directData) {
    res.json(normalizeOrderClient(directData))
    return
  }

  // 2. Si la columna receipt_url no existe en Supabase, guarda la etiqueta en shipping_address
  const { data: currentOrder } = await serviceClient.from('orders').select('shipping_address').eq('id', orderId).single()
  let currentAddress = (currentOrder?.shipping_address || '').replace(/\[Comprobante: [^\]]+\]/g, '').trim()
  const newAddress = `${currentAddress} [Comprobante: ${receipt_url}]`.trim()

  const { data: fallbackData, error: fallbackErr } = await serviceClient
    .from('orders')
    .update({ shipping_address: newAddress })
    .eq('id', orderId)
    .select('*, order_items(*, products(*))')
    .single()

  if (fallbackErr) {
    res.status(400).json({ error: fallbackErr.message })
    return
  }

  res.json(normalizeOrderClient(fallbackData))
})

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await serviceClient
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (error) {
    res.status(404).json({ error: 'Orden no encontrada' })
    return
  }

  res.json(normalizeOrderClient(data))
})

router.post('/confirm', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payment_id, preference_id } = req.body

    if (!payment_id && !preference_id) {
      res.status(400).json({ error: 'payment_id o preference_id son requeridos' })
      return
    }

    if (payment_id) {
      const payment = await getPayment(payment_id)
      if (payment.status !== 'approved') {
        res.status(400).json({ error: 'El pago no fue aprobado' })
        return
      }
    }

    // Search for existing order by preference_id or payment_id
    let query = serviceClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', req.user!.id)

    if (preference_id) {
      query = query.eq('preference_id', preference_id)
    } else if (payment_id) {
      query = query.eq('payment_id', payment_id)
    }

    const { data: order, error: orderError } = await query.single()

    if (orderError || !order) {
      res.status(404).json({ error: 'Orden no encontrada' })
      return
    }

    // If order was already confirmed/paid (e.g. by Webhook), return it directly!
    if (order.status === 'paid') {
      await serviceClient.from('cart_items').delete().eq('user_id', req.user!.id)
      res.json(order)
      return
    }

    // If order items were not yet saved, populate them from cart_items
    if (!order.order_items || order.order_items.length === 0) {
      const { data: cartItems } = await serviceClient
        .from('cart_items')
        .select('*')
        .eq('user_id', req.user!.id)

      if (cartItems?.length) {
        const orderItemsData = cartItems.map((item: any) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          selected_size: item.selected_size,
          unit_price: item.item_price,
          weight_grams: item.weight_grams,
        }))

        await serviceClient.from('order_items').insert(orderItemsData)

        for (const item of cartItems) {
          const stockToSubtract = item.weight_grams || item.quantity
          const { data: product } = await serviceClient
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single()
          if (product) {
            await serviceClient
              .from('products')
              .update({ stock: Math.max(0, product.stock - stockToSubtract) })
              .eq('id', item.product_id)
          }
        }
      }
    } else {
      // Stock subtraction for pre-existing order_items
      for (const item of order.order_items) {
        const stockToSubtract = item.weight_grams || item.quantity
        const { data: product } = await serviceClient
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()
        if (product) {
          await serviceClient
            .from('products')
            .update({ stock: Math.max(0, product.stock - stockToSubtract) })
            .eq('id', item.product_id)
        }
      }
    }

    const { data: updatedOrder } = await serviceClient
      .from('orders')
      .update({ status: 'paid', payment_id: payment_id || order.payment_id })
      .eq('id', order.id)
      .select('*, order_items(*)')
      .single()

    await serviceClient.from('cart_items').delete().eq('user_id', req.user!.id)

    res.json(updatedOrder)
  } catch (err: any) {
    console.error('confirm error:', err)
    res.status(500).json({ error: err.message || 'Error al confirmar el pedido' })
  }
})

router.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { shipping_name, shipping_address, shipping_city, promo_code, items } = req.body

  let orderItemsToProcess: any[] = []

  if (req.user?.id) {
    const { data: cartItems } = await serviceClient
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', req.user.id)

    if (cartItems?.length) {
      orderItemsToProcess = cartItems.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        selected_size: item.selected_size,
        item_price: item.item_price,
        weight_grams: item.weight_grams,
      }))
    }
  }

  // Fallback / Guest: use items passed in request body
  if (!orderItemsToProcess.length && items && Array.isArray(items) && items.length > 0) {
    orderItemsToProcess = items.map((item: any) => {
      const pid = item.product_id || item.productId || item.id || item.product?.id
      return {
        product_id: pid,
        quantity: Number(item.quantity || 1),
        selected_size: item.selected_size || item.selectedSize || 'Estándar',
        item_price: Number(item.item_price || item.unit_price || item.itemPrice || 0),
        weight_grams: item.weight_grams || null,
      }
    }).filter((i: any) => Boolean(i.product_id))
  }

  if (!orderItemsToProcess.length) {
    res.status(400).json({ error: 'El carrito está vacío' })
    return
  }

  const subTotal = orderItemsToProcess.reduce((sum, item) => sum + (item.item_price * item.quantity), 0)
  let discountAmount = 0
  let promoCodeId = null

  if (promo_code) {
    const { data: promo } = await serviceClient
      .from('promo_codes')
      .select('*')
      .eq('code', promo_code.toUpperCase())
      .eq('active', true)
      .single()

    if (promo) {
      discountAmount = subTotal * (promo.percent / 100)
      promoCodeId = promo.id
      await serviceClient.from('promo_codes').update({ used_count: promo.used_count + 1 }).eq('id', promo.id)
    }
  }

  const shippingCost = 0
  const total = subTotal - discountAmount

  const orderPayload = {
    user_id: req.user?.id || null,
    total,
    promo_code_id: promoCodeId,
    discount_amount: discountAmount,
    shipping_cost: shippingCost,
    shipping_name: shipping_name || (req.user ? 'Cliente Registrado' : 'Cliente Invitado'),
    shipping_address: shipping_address || 'Retiro en Local',
    shipping_city: shipping_city || 'Chamical',
    status: 'pending'
  }

  // 1. Intentar insert con el user_id provisto (o null si es invitado)
  let { data: order, error: orderError } = await serviceClient
    .from('orders')
    .insert(orderPayload)
    .select()
    .single()

  // 2. Si falla porque user_id viola NOT-NULL constraint en PostgreSQL BD, usar profile ID existente como fallback
  if (orderError && (orderError.message?.includes('user_id') || (orderError as any).code === '23502')) {
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (profile?.id) {
      const fallbackRes = await serviceClient
        .from('orders')
        .insert({ ...orderPayload, user_id: profile.id })
        .select()
        .single()

      if (!fallbackRes.error && fallbackRes.data) {
        order = fallbackRes.data
        orderError = null
      }
    }
  }

  if (orderError || !order) {
    res.status(400).json({ error: orderError?.message || 'Error al crear la orden' })
    return
  }

  const orderItems = orderItemsToProcess.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    selected_size: item.selected_size,
    unit_price: item.item_price,
    weight_grams: item.weight_grams,
  }))

  const { error: itemsError } = await serviceClient.from('order_items').insert(orderItems)

  if (itemsError) {
    res.status(400).json({ error: itemsError.message })
    return
  }

  // Subtract stock for each item
  for (const item of orderItemsToProcess) {
    const stockToSubtract = item.weight_grams || item.quantity
    const { data: product } = await serviceClient
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single()
    if (product) {
      await serviceClient
        .from('products')
        .update({ stock: Math.max(0, product.stock - stockToSubtract) })
        .eq('id', item.product_id)
    }
  }

  if (req.user?.id) {
    await serviceClient.from('cart_items').delete().eq('user_id', req.user.id)
  }

  res.status(201).json({ ...order, items: orderItems })
})

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await serviceClient
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (error) {
    res.status(404).json({ error: 'Orden no encontrada' })
    return
  }

  res.json(data)
})

export default router
