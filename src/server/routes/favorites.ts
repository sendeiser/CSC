import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../lib/auth'

const router = Router()

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, products(*)')
    .eq('user_id', req.user!.id)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { product_id } = req.body

  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: req.user!.id, product_id })
    .select('*, products(*)')
    .single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.status(201).json(data)
})

router.delete('/:productId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', req.user!.id)
    .eq('product_id', req.params.productId)

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json({ message: 'Eliminado de favoritos' })
})

export default router
