import { Router, Response } from 'express'
import { serviceClient } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../lib/auth'
import { getPayment } from '../lib/mercadopago'

const router = Router()

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await serviceClient
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

router.post('/confirm', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payment_id, preference_id } = req.body

    if (!payment_id || !preference_id) {
      res.status(400).json({ error: 'payment_id y preference_id son requeridos' })
      return
    }

    const payment = await getPayment(payment_id)
    if (payment.status !== 'approved') {
      res.status(400).json({ error: 'El pago no fue aprobado' })
      return
    }

    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .select('*')
      .eq('preference_id', preference_id)
      .eq('user_id', req.user!.id)
      .eq('status', 'pending')
      .single()

    if (orderError || !order) {
      res.status(404).json({ error: 'Orden no encontrada' })
      return
    }

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

    const { data: updatedOrder } = await serviceClient
      .from('orders')
      .update({ status: 'paid', payment_id })
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

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { shipping_name, shipping_address, shipping_city, promo_code } = req.body

  const { data: cartItems, error: cartError } = await serviceClient
    .from('cart_items')
    .select('*, products(*)')
    .eq('user_id', req.user!.id)

  if (cartError || !cartItems?.length) {
    res.status(400).json({ error: 'El carrito está vacío' })
    return
  }

  const subTotal = cartItems.reduce((sum, item) => sum + (item.item_price * item.quantity), 0)
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

  const shippingCost = subTotal > 150 || subTotal === 0 ? 0 : 35
  const total = subTotal - discountAmount + shippingCost

  const { data: order, error: orderError } = await serviceClient
    .from('orders')
    .insert({
      user_id: req.user!.id,
      total,
      promo_code_id: promoCodeId,
      discount_amount: discountAmount,
      shipping_cost: shippingCost,
      shipping_name,
      shipping_address,
      shipping_city,
      status: 'pending'
    })
    .select()
    .single()

  if (orderError) {
    res.status(400).json({ error: orderError.message })
    return
  }

  const orderItems = cartItems.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    selected_size: item.selected_size,
    unit_price: item.item_price
  }))

  const { error: itemsError } = await serviceClient.from('order_items').insert(orderItems)

  if (itemsError) {
    res.status(400).json({ error: itemsError.message })
    return
  }

  // Subtract stock for each item
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

  await serviceClient.from('cart_items').delete().eq('user_id', req.user!.id)

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
