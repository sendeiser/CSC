# Mercado Pago Checkout Pro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fake credit card checkout with real Mercado Pago Checkout Pro, creating pending orders before redirect and confirming them after payment via redirect + webhook fallback.

**Architecture:** Two new server files (mercadopago lib + payments routes), one new route in orders.confirm, frontend redirects to MP checkout and confirms on return. wa.me link on success screen for contact.

**Tech Stack:** express, mercadopago (npm), supabase, react

---

### Task 1: Install mercadopago SDK + add .env variable

**Files:**
- Modify: `package.json`
- Modify: `.env`

- [ ] **Step 1: Install the mercadopago SDK**

Run: `npm install mercadopago` from project root

- [ ] **Step 2: Add MERCADO_PAGO_ACCESS_TOKEN to .env**

Read current `.env` and append at the end:

```
# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .env
git commit -m "chore: add mercadopago SDK and env variable"
```

---

### Task 2: Create src/server/lib/mercadopago.ts

**Files:**
- Create: `src/server/lib/mercadopago.ts`

This wraps the Mercado Pago SDK: configure with access token, create a payment preference, and query payment status.

- [ ] **Step 1: Create file**

```typescript
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
})

interface PreferenceItem {
  title: string
  quantity: number
  unit_price: number
  currency_id?: string
}

interface PreferenceResult {
  id: string
  init_point: string
}

export async function createPreference(
  items: PreferenceItem[],
  payerName: string,
  backUrls: { success: string; failure: string; pending: string }
): Promise<PreferenceResult> {
  const body = {
    items: items.map(item => ({
      title: item.title,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      currency_id: item.currency_id || 'ARS',
    })),
    payer: { name: payerName },
    back_urls: backUrls,
    auto_return: 'approved' as const,
    notification_url: `${process.env.PUBLIC_URL || ''}/api/payments/webhook`,
  }

  const preference = await new Preference(client).create({ body })
  return { id: preference.id!, init_point: preference.init_point! }
}

export async function getPayment(paymentId: string) {
  const payment = await new Payment(client).get({ id: paymentId })
  return { status: payment.status, preference_id: payment.preference_id }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/server/lib/mercadopago.ts
git commit -m "feat: add Mercado Pago SDK wrapper (createPreference, getPayment)"
```

---

### Task 3: Create src/server/routes/payments.ts

**Files:**
- Create: `src/server/routes/payments.ts`

Two endpoints:
- `POST /api/payments/create-preference` — creates MP preference + pending order
- `POST /api/payments/webhook` — IPN receiver to confirm pending orders

- [ ] **Step 1: Create file**

```typescript
import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'
import { requireAuth, AuthenticatedRequest } from '../lib/auth'
import { createPreference, getPayment } from '../lib/mercadopago'

const router = Router()

router.post('/create-preference', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shipping_name, shipping_address, shipping_city, promo_code } = req.body

    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', req.user!.id)

    if (cartError || !cartItems?.length) {
      res.status(400).json({ error: 'El carrito está vacío' })
      return
    }

    // Calculate totals (same logic as orders.ts)
    const subTotal = cartItems.reduce((sum: number, item: any) => sum + (item.item_price * item.quantity), 0)
    let discountAmount = 0
    let promoCodeId = null

    if (promo_code) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promo_code.toUpperCase())
        .eq('active', true)
        .single()

      if (promo) {
        discountAmount = subTotal * (promo.percent / 100)
        promoCodeId = promo.id
        await supabase.from('promo_codes').update({ used_count: promo.used_count + 1 }).eq('id', promo.id)
      }
    }

    const shippingCost = subTotal > 150 || subTotal === 0 ? 0 : 35
    const total = subTotal - discountAmount + shippingCost

    // Create MP preference
    const mpItems = cartItems.map((item: any) => ({
      title: item.products.name,
      quantity: item.weight_grams ? 1 : item.quantity,
      unit_price: item.item_price,
    }))

    const backUrls = {
      success: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/?payment_success=1`,
      failure: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/?payment_failure=1`,
      pending: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/?payment_pending=1`,
    }

    const preference = await createPreference(mpItems, shipping_name, backUrls)

    // Create pending order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: req.user!.id,
        total,
        promo_code_id: promoCodeId,
        discount_amount: discountAmount,
        shipping_cost: shippingCost,
        shipping_name,
        shipping_address,
        shipping_city,
        status: 'pending',
        preference_id: preference.id,
      })
      .select()
      .single()

    if (orderError) {
      res.status(400).json({ error: orderError.message })
      return
    }

    res.json({ init_point: preference.init_point, preference_id: preference.id })
  } catch (err: any) {
    console.error('create-preference error:', err)
    res.status(500).json({ error: err.message || 'Error al crear preferencia de pago' })
  }
})

router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body

    if (type === 'payment' && data?.id) {
      const payment = await getPayment(String(data.id))

      if (payment.status === 'approved' && payment.preference_id) {
        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('preference_id', payment.preference_id)
          .eq('status', 'pending')
          .single()

        if (order) {
          // Deduct stock
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)

          if (orderItems) {
            for (const item of orderItems) {
              const stockToSubtract = item.weight_grams || item.quantity
              const { data: product } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.product_id)
                .single()
              if (product) {
                await supabase
                  .from('products')
                  .update({ stock: Math.max(0, product.stock - stockToSubtract) })
                  .eq('id', item.product_id)
              }
            }
          }

          await supabase
            .from('orders')
            .update({ status: 'paid', payment_id: String(data.id) })
            .eq('id', order.id)

          await supabase.from('cart_items').delete().eq('user_id', order.user_id)
        }
      }
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('webhook error:', err)
    res.sendStatus(200)
  }
})

export default router
```

- [ ] **Step 2: Commit**

```bash
git add src/server/routes/payments.ts
git commit -m "feat: add payments routes (create-preference + webhook)"
```

---

### Task 4: Add POST /api/orders/confirm endpoint

**Files:**
- Modify: `src/server/routes/orders.ts`

Add a new `POST /confirm` route that verifies payment via MP API and updates the pending order to `paid`. Also create order_items from cart data if not already created.

- [ ] **Step 1: Add import at top**

```typescript
import { getPayment } from '../lib/mercadopago'
```

- [ ] **Step 2: Add POST /confirm route before the existing POST / route**

```typescript
router.post('/confirm', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payment_id, preference_id } = req.body

    if (!payment_id || !preference_id) {
      res.status(400).json({ error: 'payment_id y preference_id son requeridos' })
      return
    }

    // Verify payment
    const payment = await getPayment(payment_id)
    if (payment.status !== 'approved') {
      res.status(400).json({ error: 'El pago no fue aprobado' })
      return
    }

    // Find pending order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('preference_id', preference_id)
      .eq('user_id', req.user!.id)
      .eq('status', 'pending')
      .single()

    if (orderError || !order) {
      res.status(404).json({ error: 'Orden no encontrada' })
      return
    }

    // Insert order_items from cart items
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', req.user!.id)

    if (cartItems?.length) {
      const orderItemsData = cartItems.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        selected_size: item.selected_size,
        unit_price: item.item_price,
        weight_grams: item.weight_grams,
      }))

      await supabase.from('order_items').insert(orderItemsData)

      // Deduct stock
      for (const item of cartItems) {
        const stockToSubtract = item.weight_grams || item.quantity
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()
        if (product) {
          await supabase
            .from('products')
            .update({ stock: Math.max(0, product.stock - stockToSubtract) })
            .eq('id', item.product_id)
        }
      }
    }

    // Update order
    const { data: updatedOrder } = await supabase
      .from('orders')
      .update({ status: 'paid', payment_id })
      .eq('id', order.id)
      .select('*, order_items(*)')
      .single()

    // Clear cart
    await supabase.from('cart_items').delete().eq('user_id', req.user!.id)

    res.json(updatedOrder)
  } catch (err: any) {
    console.error('confirm error:', err)
    res.status(500).json({ error: err.message || 'Error al confirmar el pedido' })
  }
})
```

- [ ] **Step 3: Change status in existing POST / from 'paid' to 'pending'**

In the existing `router.post('/')`, line 68:
Change `status: 'paid'` to `status: 'pending'`

This keeps backward compatibility for any code that still calls the old endpoint directly.

- [ ] **Step 4: Commit**

```bash
git add src/server/routes/orders.ts
git commit -m "feat: add POST /orders/confirm endpoint for post-payment verification"
```

---

### Task 5: Mount payment routes in server index

**Files:**
- Modify: `src/server/index.ts`

- [ ] **Step 1: Add import and mount**

Add after line 11 (`import categoriesRouter ...`):
```typescript
import paymentRoutes from './routes/payments'
```

Add after line 31 (`app.use('/api/categories', categoriesRouter)`):
```typescript
app.use('/api/payments', paymentRoutes)
```

- [ ] **Step 2: Commit**

```bash
git add src/server/index.ts
git commit -m "feat: mount /api/payments routes"
```

---

### Task 6: Add payments API to frontend client

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Add payments API and orders.confirm**

After the `orders` export block (before the closing `}`):
```typescript
export const payments = {
  createPreference: (data: { shipping_name: string; shipping_address: string; shipping_city: string; promo_code?: string }) =>
    request<{ init_point: string; preference_id: string }>('/payments/create-preference', { method: 'POST', body: JSON.stringify(data) }),
}
```

Then in the `orders` object, add `confirm`:
```typescript
  confirm: (payment_id: string, preference_id: string) =>
    request<any>('/orders/confirm', { method: 'POST', body: JSON.stringify({ payment_id, preference_id }) }),
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add payments.createPreference and orders.confirm to API client"
```

---

### Task 7: Modify CartScreen — remove fake card, add MP redirect + success with wa.me

**Files:**
- Modify: `src/components/CartScreen.tsx`

- [ ] **Step 1: Update imports**

Change line 5:
```typescript
import { cart as cartApi, orders as ordersApi, payments as paymentsApi } from '../lib/api';
```

- [ ] **Step 2: Remove cardFormattedNum state**

Delete line 30:
```typescript
const [cardFormattedNum, setCardFormattedNum] = React.useState('');
```

- [ ] **Step 3: Replace handleCheckout**

Replace the entire `handleCheckout` function (lines 87-113) with:
```typescript
const handleCheckout = async () => {
  if (!fullName.trim() || !addressLine.trim() || !cityField.trim()) {
    setShippingError('Todos los campos de envío son obligatorios.');
    return;
  }
  setShippingError('');

  const token = getAuthToken()
  if (!token) {
    setActiveScreen('login')
    return
  }

  try {
    const result = await paymentsApi.createPreference({
      shipping_name: fullName,
      shipping_address: addressLine,
      shipping_city: cityField,
      promo_code: activeDiscount?.code,
    })
    // Redirect to Mercado Pago checkout
    window.location.href = result.init_point
  } catch (err: any) {
    setShippingError(err.message || 'Error al procesar el pago.')
  }
};
```

- [ ] **Step 4: Handle return from MP (success params in URL)**

Add after the `handleRemoveItem` function, before `return (`, a useEffect to detect return from MP:

```typescript
React.useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const paymentId = params.get('payment_id')
  const preferenceId = params.get('preference_id')
  const status = params.get('status')

  if (paymentId && preferenceId && status === 'approved') {
    // Clean URL params
    window.history.replaceState({}, '', window.location.pathname)

    const confirmOrder = async () => {
      try {
        const result = await ordersApi.confirm(paymentId, preferenceId)
        setOrderId(result.id)
        setCart([])
        setStep('success')
      } catch (err: any) {
        setShippingError(err.message || 'Error al confirmar el pedido')
        setStep('shipping')
      }
    }
    confirmOrder()
  } else if (status === 'failure' || status === null && paymentId) {
    setShippingError('El pago no fue procesado. Intenta de nuevo.')
  }
}, [])
```

- [ ] **Step 5: Remove fake credit card field**

Delete the entire credit card div block (lines 292-304):
```typescript
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tarjeta de Crédito</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={cardFormattedNum}
                    onChange={(e) => setCardFormattedNum(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19))}
                    placeholder="4242 4242 4242 4242"
                    className="w-full pl-11 pr-4 py-2.5 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white font-mono"
                  />
                </div>
              </div>
```

- [ ] **Step 6: Update the success screen with wa.me link**

Replace the success step (lines 140-161) with:
```tsx
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 space-y-6"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <PartyPopper className="w-12 h-12 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-headline font-bold text-gray-900">¡Pedido Confirmado!</h2>
              <p className="text-gray-500 mt-2">Tu pedido #<span className="font-mono font-bold text-purple-700">{orderId.slice(0, 8).toUpperCase()}</span> está siendo procesado.</p>
              <p className="text-sm text-gray-400 mt-1">Te contactaremos si hay novedades.</p>
            </div>
            <a
              href={`https://wa.me/54${phoneField ? phoneField.replace(/\D/g, '') : ''}?text=${encodeURIComponent(`Hola! Quiero consultar sobre mi pedido #${orderId.slice(0, 8).toUpperCase()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-md"
            >
              <span>Contactar por WhatsApp</span>
            </a>
            <div className="pt-4">
              <button
                onClick={() => { setStep('basket'); setActiveDiscount(null); setActiveScreen('catalogo'); }}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg"
              >
                Seguir Comprando
              </button>
            </div>
          </motion.div>
        )}
```

- [ ] **Step 7: Update the confirm button text**

Replace line 324:
Change `<span>Confirmar Pedido</span>` to `<span>Pagar con Mercado Pago</span>`

And replace the icon on line 323:
Change `<Gift className="w-4 h-4" />` to `<CreditCard className="w-4 h-4" />`

- [ ] **Step 8: Commit**

```bash
git add src/components/CartScreen.tsx
git commit -m "feat: replace fake credit card with MP redirect checkout + wa.me success"
```

---

### Task 8: Build and verify

- [ ] **Step 1: Run build**

```bash
npm run build
```
Expected: build succeeds with no errors.

- [ ] **Step 2: Fix any TypeScript errors**

If the build fails, fix the reported errors (likely import issues or type mismatches), then rebuild.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: build errors after MP integration"
```

- [ ] **Step 4: Push**

```bash
git push origin main
```
