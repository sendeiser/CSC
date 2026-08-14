import { Router, Request, Response } from 'express'
import { supabase, serviceClient } from '../lib/supabase'
import { requireAdmin, AuthenticatedRequest } from '../lib/auth'

const db = serviceClient || supabase

function formatProductFromDb(p: any) {
  if (!p) return p
  let rawSizes = p.sizes || {}
  let galleryImages: string[] = []

  if (Array.isArray(p.images) && p.images.length > 0) {
    galleryImages = p.images
  } else if (rawSizes && Array.isArray(rawSizes.__gallery_images__) && rawSizes.__gallery_images__.length > 0) {
    galleryImages = rawSizes.__gallery_images__
  } else if (p.image_url) {
    galleryImages = [p.image_url]
  }

  let comboAllowedTypes = p.combo_allowed_types || 'both'
  if (rawSizes && rawSizes.__combo_allowed_types__) {
    comboAllowedTypes = rawSizes.__combo_allowed_types__
  }

  // Clean internal key from sizes
  let cleanSizes = { ...rawSizes }
  delete cleanSizes.__gallery_images__
  delete cleanSizes.__combo_allowed_types__

  return {
    ...p,
    sizes: cleanSizes,
    images: galleryImages,
    combo_allowed_types: comboAllowedTypes
  }
}

function prepareProductForDb(reqBody: any) {
  const payload = { ...reqBody }
  delete payload.id
  delete payload.created_at

  const images: string[] = Array.isArray(payload.images) && payload.images.length > 0
    ? payload.images
    : (payload.image_url ? [payload.image_url] : [])

  const mainImageUrl = images[0] || payload.image_url || ''
  payload.image_url = mainImageUrl

  const comboAllowedTypes = payload.combo_allowed_types || 'both'
  delete payload.combo_allowed_types

  // Guardar imágenes en la columna sizes (JSONB) para garantía total de persistencia en PostgreSQL
  const existingSizes = payload.sizes && typeof payload.sizes === 'object' ? payload.sizes : {}
  payload.sizes = {
    ...existingSizes,
    __gallery_images__: images,
    __combo_allowed_types__: comboAllowedTypes
  }

  // Asegurar valores por defecto para campos obligatorios en DB
  payload.description = (payload.description && payload.description.trim()) ? payload.description : (payload.name || 'Sin descripción')
  payload.category = (payload.category && payload.category.trim()) ? payload.category : 'Caramelos'
  payload.base_price = typeof payload.base_price === 'number' ? payload.base_price : (parseFloat(payload.base_price) || 0)
  payload.stock = typeof payload.stock === 'number' ? payload.stock : (parseInt(payload.stock, 10) || 0)

  return { payload, images }
}

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

  const formattedData = (data || []).map(formatProductFromDb)

  res.json(formattedData)
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

  const formatted = {
    ...formatProductFromDb(data),
    reviews: reviews || []
  }

  res.json(formatted)
})

router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payload, images } = prepareProductForDb(req.body)

    // Generar slug si no viene presente
    if (!payload.slug && payload.name) {
      payload.slug = payload.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString(36)
    }

    let { data, error } = await db
      .from('products')
      .insert(payload)
      .select()
      .single()

    // Si Supabase falla porque la columna 'images' no existe aún en el esquema de PostgreSQL, reintentar filtrando 'images'
    if (error && (error.message?.includes("'images' column") || error.message?.includes('schema cache') || error.message?.includes('column "images"'))) {
      const { images: _ignored, ...payloadWithoutImages } = payload
      const retry = await db
        .from('products')
        .insert(payloadWithoutImages)
        .select()
        .single()

      data = retry.data
      error = retry.error
    }

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }

    res.status(201).json(formatProductFromDb(data))
  } catch (err: any) {
    console.error('Error al crear producto:', err)
    res.status(500).json({ error: err?.message || 'Error interno al crear el producto' })
  }
})

router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payload } = prepareProductForDb(req.body)

    let { data, error } = await db
      .from('products')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single()

    // Si Supabase falla porque la columna 'images' no existe aún en el esquema de PostgreSQL, reintentar filtrando 'images'
    if (error && (error.message?.includes("'images' column") || error.message?.includes('schema cache') || error.message?.includes('column "images"'))) {
      const { images: _ignored, ...payloadWithoutImages } = payload
      const retry = await db
        .from('products')
        .update(payloadWithoutImages)
        .eq('id', req.params.id)
        .select()
        .single()

      data = retry.data
      error = retry.error
    }

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }

    res.json(formatProductFromDb(data))
  } catch (err: any) {
    console.error('Error al actualizar producto:', err)
    res.status(500).json({ error: err?.message || 'Error interno al actualizar el producto' })
  }
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
