# Mercado Pago Checkout Pro + wa.me Contact

## Goal

Replace the fake credit card payment in the checkout flow with real Mercado Pago Checkout Pro. After payment, show a wa.me link for customer contact. No recurring costs — MP only charges per transaction.

## Flow

```
CartScreen (shipping step)
  → User clicks "Pagar con Mercado Pago"
  → POST /api/payments/create-preference
    → MP SDK creates preference with items + shipping data
    → Creates order in DB as 'pending' with preference_id
    → Returns { init_point }
  → Frontend redirects to init_point (checkout.mercadopago.com.ar)
  → User pays on MP
  → MP redirects to /pago-exitoso?payment_id=XXX&preference_id=YYY&status=ZZZ
  → Frontend calls POST /api/orders/confirm
    → Backend verifies payment in MP API
    → Updates order → 'paid', deducts stock, clears cart
  → Frontend shows success screen with wa.me link
  → [Backup] MP sends IPN to POST /api/payments/webhook → confirms if missed
```

## Backend

### `src/server/lib/mercadopago.ts`

- Initialize Mercado Pago SDK with `MERCADO_PAGO_ACCESS_TOKEN`
- `createPreference(items, shipping, backUrls)` → `{ id, init_point }`
- `getPayment(paymentId)` → `{ status, ... }`

### `src/server/routes/payments.ts`

**`POST /api/payments/create-preference`** (auth required)
1. Fetch cart items from `cart_items`
2. Calculate totals (subtotal, shipping, discount) following existing logic in orders.ts
3. Create preference with items + shipping (name for payer)
4. Insert order as `status: 'pending'` with `preference_id`, shipping fields, total
5. Return `{ init_point, preference_id }`

**`POST /api/payments/webhook`** (public)
1. Extract `data.id` (payment_id)
2. If `type === 'payment'`, verify status via MP API
3. If approved, find pending order by `preference_id`, update to `paid`, deduct stock
4. Return 200

### `src/server/routes/orders.ts` — add `POST /api/orders/confirm`

- Receives `{ payment_id, preference_id }` in body
- Verifies payment via MP API (`getPayment`)
- Finds pending order by `preference_id`
- Updates: `payment_id`, `status → 'paid'`
- Deducts stock (same logic as current POST /api/orders)
- Clears cart
- Returns order

Existing `POST /api/orders` stays for backward compatibility but changes default status to `'pending'`.

### `src/server/index.ts`

```typescript
import paymentRoutes from './routes/payments'
app.use('/api/payments', paymentRoutes)
```

## Frontend

### `src/components/CartScreen.tsx`

**Remove**: Fake credit card input field

**New checkout flow**:
1. Shipping step — user fills name, address, city, phone
2. "Pagar con Mercado Pago" button calls `payments.createPreference({ shipping })`
3. On success, `window.location.href = init_point`
4. After MP redirects back, URL has `?payment_id=XXX&preference_id=YYY&status=approved`
5. Frontend detects these params → calls `ordersApi.confirm(payment_id, preference_id)`
6. Shows success screen with order summary
7. Adds "Contactanos por WhatsApp" link using `wa.me/54XXXXXXXXXX?text=...`

**States**: `'basket'` → `'shipping'` → `'success'` (redirecting handled inline)

### `src/lib/api.ts`

```typescript
export const payments = {
  createPreference: (data: { shipping: any }) =>
    request<{ init_point: string; preference_id: string }>(
      '/payments/create-preference',
      { method: 'POST', body: JSON.stringify(data) }
    ),
}
export const orders = {
  ... // existing list, create, get
  confirm: (payment_id: string, preference_id: string) =>
    request(`/orders/confirm`, {
      method: 'POST',
      body: JSON.stringify({ payment_id, preference_id })
    }),
}
```

## Environment Variables

```
MERCADO_PAGO_ACCESS_TOKEN=TEST-XXXXXXXX-XXXXXXX-XXXXXXXX
```

## Setup

1. Register at https://mercadopago.com.ar/
2. Go to Credentials → copy `ACCESS_TOKEN` (TEST for dev)
3. Set in `.env`
4. Deploy and set `notification_url` in MP dashboard → IPN URL pointing to `https://DOMAIN/api/payments/webhook`

## Files Changed

| File | Action |
|------|--------|
| `package.json` | Add `mercadopago` |
| `.env` | Add `MERCADO_PAGO_ACCESS_TOKEN` |
| `src/server/index.ts` | Mount payment routes |
| `src/server/lib/mercadopago.ts` | New — MP SDK wrapper |
| `src/server/routes/payments.ts` | New — create-preference + webhook |
| `src/server/routes/orders.ts` | Add confirm endpoint, default status 'pending' |
| `src/lib/api.ts` | Add payments API + orders.confirm |
| `src/components/CartScreen.tsx` | Replace fake card with MP redirect + wa.me |
