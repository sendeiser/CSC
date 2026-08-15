import { serviceClient, supabase } from './supabase'

export function isPaidOrActiveStatus(status: string | null | undefined): boolean {
  if (!status) return false
  const s = String(status).toLowerCase().trim()
  return ['paid', 'preparing', 'ready', 'en_preparacion', 'listo', 'shipped', 'delivered'].includes(s)
}

export function isUnpaidStatus(status: string | null | undefined): boolean {
  if (!status) return true
  const s = String(status).toLowerCase().trim()
  return ['pending', 'unpaid', 'cancelled', 'cancelado'].includes(s)
}

export async function adjustOrderStock(
  db: any = serviceClient || supabase,
  orderItems: any[],
  direction: 'deduct' | 'restore'
) {
  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return
  }

  const isDeduct = direction === 'deduct'

  for (const item of orderItems) {
    const productId = item.product_id || item.productId || item.product?.id || item.id
    if (!productId) continue

    const qty = Number(item.quantity || 1)
    const stockChange = item.weight_grams ? Number(item.weight_grams) : qty
    if (stockChange <= 0) continue

    try {
      const { data: prod } = await db
        .from('products')
        .select('stock, is_combo')
        .eq('id', productId)
        .single()

      if (prod) {
        const currentStock = Number(prod.stock || 0)
        const newStock = isDeduct
          ? Math.max(0, currentStock - stockChange)
          : currentStock + stockChange

        await db.from('products').update({ stock: newStock }).eq('id', productId)

        // Sub-productos si es un combo
        const selections = item.combo_selections || item.comboSelections
        if (prod.is_combo && selections && Array.isArray(selections)) {
          for (const selection of selections) {
            const subProductId = selection.productId || selection.product?.id || selection.id
            const selQty = Number(selection.quantity || 0) * qty

            if (subProductId && selQty > 0) {
              const { data: subProd } = await db
                .from('products')
                .select('stock')
                .eq('id', subProductId)
                .single()

              if (subProd) {
                const currentSubStock = Number(subProd.stock || 0)
                const newSubStock = isDeduct
                  ? Math.max(0, currentSubStock - selQty)
                  : currentSubStock + selQty

                await db.from('products').update({ stock: newSubStock }).eq('id', subProductId)
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(`[adjustOrderStock error for product ${productId}]:`, err)
    }
  }
}
