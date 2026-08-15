import { Router, Response } from 'express'
import { serviceClient } from '../lib/supabase'
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../lib/auth'
import { createPreference, getPayment } from '../lib/mercadopago'
import { adjustOrderStock, isPaidOrActiveStatus } from '../lib/stock'

const router = Router()

router.post('/create-preference', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shipping_name, shipping_address, shipping_city, promo_code, items } = req.body

    let cartItemsToProcess: any[] = []

    if (req.user?.id) {
      const { data: cartItems } = await serviceClient
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', req.user.id)

      if (cartItems?.length) {
        cartItemsToProcess = cartItems
      }
    }

    if (!cartItemsToProcess.length && items && Array.isArray(items) && items.length > 0) {
      const productIds = items.map((i: any) => i.product_id || i.productId || i.id || i.product?.id).filter(Boolean)
      const { data: dbProducts } = await serviceClient.from('products').select('*').in('id', productIds)

      cartItemsToProcess = items.map((item: any) => {
        const pid = item.product_id || item.productId || item.id || item.product?.id
        const prod = (dbProducts || []).find((p: any) => p.id === pid) || item.product || { name: 'Producto' }
        return {
          product_id: pid,
          quantity: Number(item.quantity || 1),
          selected_size: item.selected_size || item.selectedSize || 'Estándar',
          item_price: Number(item.item_price || item.unit_price || item.itemPrice || 0),
          weight_grams: item.weight_grams || null,
          combo_selections: item.combo_selections || item.comboSelections || null,
          products: prod,
        }
      }).filter((i: any) => Boolean(i.product_id))
    }

    if (!cartItemsToProcess.length) {
      res.status(400).json({ error: 'El carrito está vacío' })
      return
    }

    const subTotal = cartItemsToProcess.reduce((sum: number, item: any) => sum + (item.item_price * item.quantity), 0)
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

    const discountRatio = subTotal > 0 ? (subTotal - discountAmount) / subTotal : 1

    const mpItems = cartItemsToProcess.map((item: any) => ({
      id: item.product_id,
      title: item.products?.name || 'Golosinas CSC',
      quantity: item.weight_grams ? 1 : item.quantity,
      unit_price: Math.max(0.01, Number((item.item_price * discountRatio).toFixed(2))),
    }))

    let baseUrl = 'http://localhost:3000'
    const originHeader = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '')
    if (originHeader && (originHeader.startsWith('http://') || originHeader.startsWith('https://'))) {
      baseUrl = originHeader
    } else if (process.env.CORS_ORIGIN) {
      baseUrl = process.env.CORS_ORIGIN
    } else if (process.env.PUBLIC_URL) {
      baseUrl = process.env.PUBLIC_URL
    }
    baseUrl = baseUrl.replace(/\/$/, '')

    const backUrls = {
      success: `${baseUrl}/?payment_success=1`,
      failure: `${baseUrl}/?payment_failure=1`,
      pending: `${baseUrl}/?payment_pending=1`,
    }

    const preference = await createPreference(mpItems, shipping_name, backUrls, req.user?.email)

    const orderPayload = {
      user_id: req.user?.id || null,
      total,
      promo_code_id: promoCodeId,
      discount_amount: discountAmount,
      shipping_cost: shippingCost,
      shipping_name: shipping_name || 'Cliente Invitado',
      shipping_address: shipping_address || 'Retiro en Local',
      shipping_city: shipping_city || 'Chamical',
      status: 'pending',
      preference_id: preference.id,
    }

    let { data: order, error: orderError } = await serviceClient
      .from('orders')
      .insert(orderPayload)
      .select()
      .single()

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
      res.status(400).json({ error: orderError?.message || 'Error al crear la preferencia de pago' })
      return
    }

    // Save order_items immediately when preference is created
    const orderItemsData = cartItemsToProcess.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      selected_size: item.selected_size,
      unit_price: item.item_price,
      weight_grams: item.weight_grams,
      combo_selections: item.combo_selections || item.comboSelections || null,
    }))

    await serviceClient.from('order_items').insert(orderItemsData)

    res.json({ init_point: preference.init_point, preference_id: preference.id })
  } catch (err: any) {
    console.error('create-preference error:', err?.message || err)
    if (err?.response?.data) console.error('MP response:', JSON.stringify(err.response.data, null, 2))
    if (err?.status) console.error('MP status:', err.status)
    if (err?.cause) console.error('MP cause:', err.cause)
    res.status(500).json({ error: err?.message || 'Error al crear preferencia de pago', detail: err?.response?.data })
  }
})

router.post('/webhook', async (req, res) => {
  try {
    const paymentId = req.body?.data?.id || req.body?.id || req.query?.['data.id'] || req.query?.id

    if (paymentId) {
      try {
        const payment = await getPayment(String(paymentId))

        if ((payment?.status === 'approved' || payment?.status === 'accredited') && payment?.preference_id) {
          const { data: order } = await serviceClient
            .from('orders')
            .select('*')
            .eq('preference_id', payment.preference_id)
            .maybeSingle()

          if (order && !isPaidOrActiveStatus(order.status)) {
            const { data: orderItems } = await serviceClient
              .from('order_items')
              .select('*')
              .eq('order_id', order.id)

            if (orderItems && orderItems.length > 0) {
              await adjustOrderStock(serviceClient, orderItems, 'deduct')
            }

            await serviceClient
              .from('orders')
              .update({ status: 'paid', payment_id: String(paymentId) })
              .eq('id', order.id)

            if (order.user_id) {
              await serviceClient.from('cart_items').delete().eq('user_id', order.user_id)
            }
          }
        }
      } catch (_e) {}
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('webhook error:', err)
    res.sendStatus(200)
  }
})

export default router
