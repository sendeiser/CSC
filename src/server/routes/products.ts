import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { requireAdmin, AuthenticatedRequest } from '../lib/auth'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { category, search, sort, vegan, organic, noSugar, onSale } = req.query

  let query = supabase.from('products').select('*')

  if (category && category !== 'Todos') {
    query = query.eq('category', category as string)
  }

  if (search) {
    const term = (search as string).toLowerCase()
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
  }

  if (vegan === 'true') query = query.contains('diet', ['Vegan'])
  if (organic === 'true') query = query.contains('diet', ['Orgánico'])
  if (noSugar === 'true') query = query.contains('diet', ['Sin Azúcar'])
  if (onSale === 'true') query = query.eq('on_sale', true)

  if (sort === 'priceAsc') query = query.order('base_price', { ascending: true })
  else if (sort === 'priceDesc') query = query.order('base_price', { ascending: false })
  else if (sort === 'stars') query = query.order('stars', { ascending: false })
  else query = query.order('name', { ascending: true })

  const { data, error } = await query

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

router.get('/:slug', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', req.params.slug)
    .single()

  if (error || !data) {
    res.status(404).json({ error: 'Producto no encontrado' })
    return
  }

  const { data: reviews } = await supabase
    .from('product_reviews')
    .select('*, profiles(name)')
    .eq('product_id', data.id)
    .order('created_at', { ascending: false })

  res.json({ ...data, reviews: reviews || [] })
})

router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('products')
    .insert(req.body)
    .select()
    .single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.status(201).json(data)
})

router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('products')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json(data)
})

router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', req.params.id)

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json({ message: 'Producto eliminado correctamente' })
})

export default router
