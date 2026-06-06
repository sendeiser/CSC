import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../lib/auth'

const router = Router()

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
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

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { shipping_name, shipping_address, shipping_city, promo_code } = req.body

  const { data: cartItems, error: cartError } = await supabase
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
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promo_code.toUpperCase())
      .eq('active', true)
      .single()

    if (promo) {
      discountAmount = subTotal * (promo.percent / 100)
      promoCodeId = promo.id
      await supabase.from('promo_codes').update({ used_count: promo.used_count + 1 }).eq('id', promo.id)
    }
  }

  const shippingCost = subTotal > 150 || subTotal === 0 ? 0 : 35
  const total = subTotal - discountAmount + shippingCost

  const { data: order, error: orderError } = await supabase
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
      status: 'paid'
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

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) {
    res.status(400).json({ error: itemsError.message })
    return
  }

  await supabase.from('cart_items').delete().eq('user_id', req.user!.id)

  res.status(201).json({ ...order, items: orderItems })
})

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
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
