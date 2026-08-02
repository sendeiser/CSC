import { Router, Request, Response } from 'express'
import { supabase, serviceClient } from '../lib/supabase'
import { requireAdmin, AuthenticatedRequest } from '../lib/auth'

const db = serviceClient || supabase

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
  const { data, error } = await db
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
  const { data, error } = await db
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

router.post('/bulk-delete', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || !ids.length) {
    res.status(400).json({ error: 'Array de IDs requerido' })
    return
  }

  try {
    await db.from('cart_items').delete().in('product_id', ids)
    await db.from('product_reviews').delete().in('product_id', ids)

    const { error } = await db.from('products').delete().in('id', ids)

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }

    res.json({ message: `${ids.length} productos eliminados correctamente` })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al eliminar productos' })
  }
})

router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const productId = req.params.id

  try {
    // Clean up referencing rows first
    await db.from('cart_items').delete().eq('product_id', productId)
    await db.from('product_reviews').delete().eq('product_id', productId)

    const { error } = await db
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }

    res.json({ message: 'Producto eliminado correctamente' })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al eliminar producto' })
  }
})

export default router
