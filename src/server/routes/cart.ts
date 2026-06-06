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
  const { product_id, quantity, selected_size, item_price } = req.body

  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', req.user!.id)
    .eq('product_id', product_id)
    .eq('selected_size', selected_size)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + (quantity || 1) })
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

  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      user_id: req.user!.id,
      product_id,
      quantity: quantity || 1,
      selected_size,
      item_price
    })
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
