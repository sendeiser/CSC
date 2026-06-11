import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'

const router = Router()

// Public: get visible homepage sections ordered
router.get('/', async (_req, res: Response) => {
  const { data, error } = await supabase
    .from('homepage_sections')
    .select('*')
    .eq('visible', true)
    .order('order_index', { ascending: true })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

// Public: get about us page
router.get('/about', async (_req, res: Response) => {
  const { data, error } = await supabase
    .from('about_page')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

export default router
