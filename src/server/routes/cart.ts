import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../lib/auth'

const router = Router()

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, products(*)')
    .eq('user_id', req.user!.id)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { product_id, quantity, selected_size, item_price, weight_grams } = req.body

  let finalPrice = item_price
  let finalSize = selected_size
  let finalQty = quantity || 1

  if (weight_grams) {
    const { data: product } = await supabase
      .from('products')
      .select('price_per_kg, unit_type, stock')
      .eq('id', product_id)
      .single()

    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' })
      return
    }

    if (product.stock < weight_grams) {
      res.status(400).json({ error: 'Stock insuficiente' })
      return
    }

    if (product && product.unit_type === 'weight' && product.price_per_kg) {
      finalPrice = Math.round((weight_grams / 1000) * Number(product.price_per_kg) * 100) / 100
      finalSize = 'Granel'
      finalQty = 1
    }
  } else {
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', product_id)
      .single()

    if (product && product.stock < (quantity || 1)) {
      res.status(400).json({ error: 'Stock insuficiente' })
      return
    }
  }

  // For weight items, match exact weight_grams to allow different weights of same product
  let query = supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', req.user!.id)
    .eq('product_id', product_id)
    .eq('selected_size', finalSize)

  if (weight_grams) {
    query = query.eq('weight_grams', weight_grams)
  }

  const { data: existing } = await query.maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: finalQty, item_price: finalPrice, selected_size: finalSize, weight_grams: weight_grams || null })
      .eq('id', existing.id)
      .select('*, products(*)')
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.json(data)
    return
  }

  const insertData: any = {
    user_id: req.user!.id,
    product_id,
    quantity: finalQty,
    selected_size: finalSize,
    item_price: finalPrice,
  }

  if (weight_grams) {
    insertData.weight_grams = weight_grams
  }

  const { data, error } = await supabase
    .from('cart_items')
    .insert(insertData)
    .select('*, products(*)')
    .single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.status(201).json(data)
})

router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { quantity } = req.body

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select('*, products(*)')
    .single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json(data)
})

router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json({ message: 'Producto eliminado del carrito' })
})

export default router
