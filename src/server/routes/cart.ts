import { Router, Response } from 'express'
import { serviceClient } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../lib/auth'

const router = Router()

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await serviceClient
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
  const { product_id, quantity, selected_size, item_price, weight_grams, combo_selections } = req.body

  const { data: product } = await serviceClient
    .from('products')
    .select('*')
    .eq('id', product_id)
    .single()

  if (!product) {
    res.status(404).json({ error: 'Producto no encontrado' })
    return
  }

  const isWeightProduct = product.unit_type === 'weight' || !!weight_grams

  if (isWeightProduct) {
    const requestedWeight = Number(weight_grams) || 50
    const pricePerKg = Number(product.price_per_kg) || 0

    // Buscar si el usuario ya tiene este producto a granel en su carrito
    const { data: existing } = await serviceClient
      .from('cart_items')
      .select('*')
      .eq('user_id', req.user!.id)
      .eq('product_id', product_id)
      .maybeSingle()

    if (existing) {
      const accumulatedWeight = (existing.weight_grams || 0) + requestedWeight

      if (product.stock < accumulatedWeight) {
        res.status(400).json({
          error: `Stock insuficiente. Ya tenés ${existing.weight_grams || 0}g en el carrito y el stock total disponible es ${product.stock}g.`
        })
        return
      }

      const accumulatedPrice = Math.round((accumulatedWeight / 1000) * pricePerKg * 100) / 100

      const { data, error } = await serviceClient
        .from('cart_items')
        .update({
          quantity: 1,
          selected_size: 'Granel',
          weight_grams: accumulatedWeight,
          item_price: accumulatedPrice
        })
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

    // Nuevo ítem a granel
    if (product.stock < requestedWeight) {
      res.status(400).json({ error: `Stock insuficiente: disponible ${product.stock}g` })
      return
    }

    const calculatedPrice = Math.round((requestedWeight / 1000) * pricePerKg * 100) / 100
    const insertData = {
      user_id: req.user!.id,
      product_id,
      quantity: 1,
      selected_size: 'Granel',
      item_price: calculatedPrice,
      weight_grams: requestedWeight
    }

    const { data, error } = await serviceClient
      .from('cart_items')
      .insert(insertData)
      .select('*, products(*)')
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(201).json(data)
    return

  } else {
    // Producto por unidad
    const finalSize = selected_size || 'Estándar'
    const addQty = Number(quantity) || 1
    const priceVal = Number(item_price) || Number(product.base_price) || 0

    // Solo buscar ítem existente si NO es un combo (los combos tienen selecciones personalizadas únicas)
    if (!product.is_combo) {
      const { data: existing } = await serviceClient
        .from('cart_items')
        .select('*')
        .eq('user_id', req.user!.id)
        .eq('product_id', product_id)
        .eq('selected_size', finalSize)
        .maybeSingle()

      if (existing) {
        const newQty = existing.quantity + addQty

        if (product.stock < newQty) {
          res.status(400).json({
            error: `Stock insuficiente. Ya tenés ${existing.quantity} en el carrito y el stock total disponible es ${product.stock}.`
          })
          return
        }

        const { data, error } = await serviceClient
          .from('cart_items')
          .update({
            quantity: newQty,
            item_price: priceVal,
            selected_size: finalSize,
            weight_grams: null
          })
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
    }

    // Nuevo ítem por unidad
    if (product.stock < addQty) {
      res.status(400).json({ error: 'Stock insuficiente' })
      return
    }

    const insertData: any = {
      user_id: req.user!.id,
      product_id,
      quantity: addQty,
      selected_size: finalSize,
      item_price: priceVal,
      weight_grams: null
    }

    if (combo_selections) {
      insertData.combo_selections = combo_selections
    }

    const { data, error } = await serviceClient
      .from('cart_items')
      .insert(insertData)
      .select('*, products(*)')
      .single()

    if (error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(201).json(data)
  }
})

router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { quantity, weight_grams } = req.body

  const { data: currentItem } = await serviceClient
    .from('cart_items')
    .select('*, products(*)')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (!currentItem) {
    res.status(404).json({ error: 'Ítem no encontrado en el carrito' })
    return
  }

  const updateFields: any = {}

  if (weight_grams !== undefined) {
    const newWeight = Number(weight_grams)
    const product = currentItem.products
    const pricePerKg = Number(product?.price_per_kg) || 0

    if (product && product.stock < newWeight) {
      res.status(400).json({ error: `Stock insuficiente: máximo disponible ${product.stock}g` })
      return
    }

    updateFields.weight_grams = newWeight
    updateFields.item_price = Math.round((newWeight / 1000) * pricePerKg * 100) / 100
    updateFields.quantity = 1
  } else if (quantity !== undefined) {
    const newQty = Number(quantity)
    const product = currentItem.products

    if (product && product.stock < newQty) {
      res.status(400).json({ error: `Stock insuficiente: máximo disponible ${product.stock}` })
      return
    }

    updateFields.quantity = newQty
  }

  const { data, error } = await serviceClient
    .from('cart_items')
    .update(updateFields)
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
  const { error } = await serviceClient
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
