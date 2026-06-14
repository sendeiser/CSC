import { Router, Response } from 'express'
import { serviceClient } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../lib/auth'
import { createPreference, getPayment } from '../lib/mercadopago'

const router = Router()

router.post('/create-preference', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shipping_name, shipping_address, shipping_city, promo_code } = req.body

    const { data: cartItems, error: cartError } = await serviceClient
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', req.user!.id)

    if (cartError || !cartItems?.length) {
      res.status(400).json({ error: 'El carrito está vacío' })
      return
    }

    const subTotal = cartItems.reduce((sum: number, item: any) => sum + (item.item_price * item.quantity), 0)
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

    const mpItems = cartItems.map((item: any) => ({
      title: item.products.name,
      quantity: item.weight_grams ? 1 : item.quantity,
      unit_price: item.item_price,
    }))

    const backUrls = {
      success: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/?payment_success=1`,
      failure: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/?payment_failure=1`,
      pending: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/?payment_pending=1`,
    }

    const preference = await createPreference(mpItems, shipping_name, backUrls)

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
        status: 'pending',
        preference_id: preference.id,
      })
      .select()
      .single()

    if (orderError) {
      res.status(400).json({ error: orderError.message })
      return
    }

    res.json({ init_point: preference.init_point, preference_id: preference.id })
  } catch (err: any) {
    console.error('create-preference error:', err)
    res.status(500).json({ error: err.message || 'Error al crear preferencia de pago' })
  }
})

router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body

    if (type === 'payment' && data?.id) {
      const payment = await getPayment(String(data.id))

      if (payment.status === 'approved' && payment.preference_id) {
        const { data: order } = await serviceClient
          .from('orders')
          .select('*')
          .eq('preference_id', payment.preference_id)
          .eq('status', 'pending')
          .single()

        if (order) {
          const { data: orderItems } = await serviceClient
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)

          if (orderItems) {
            for (const item of orderItems) {
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

          await serviceClient
            .from('orders')
            .update({ status: 'paid', payment_id: String(data.id) })
            .eq('id', order.id)

          await serviceClient.from('cart_items').delete().eq('user_id', order.user_id)
        }
      }
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('webhook error:', err)
    res.sendStatus(200)
  }
})

export default router
