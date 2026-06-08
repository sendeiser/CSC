import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'

const router = Router()

router.get('/', async (_req, res: Response) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

export default router
