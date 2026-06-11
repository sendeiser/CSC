# Granel (Bulk Weight) Purchase System

## Overview
Enable customers to buy gummies by weight (grams) in 50g increments, with the cart acting as an assorted combo. Products can be either weight-based (`price_per_kg`) or piece-based (`base_price` + `sizes`), and both types coexist in the same cart/order.

## Data Model

### Product — new fields
```typescript
unit_type: 'weight' | 'piece'
price_per_kg?: number       // required if unit_type = 'weight'
min_weight?: number         // default 50 (grams)
max_weight?: number         // default 1000 (grams)
weight_step?: number        // default 50 (grams)
```
Existing fields `base_price` and `sizes` remain for `unit_type = 'piece'`.

### CartItem — new field
```typescript
weight_grams?: number       // for weight-based items only
```
For weight items: `quantity = 1`, `selectedSize = 'Granel'`, `itemPrice = (weight_grams / 1000) * price_per_kg`.

### OrderItem — new field
```sql
weight_grams INTEGER  -- nullable, for weight-based items
```

### Migration
```sql
ALTER TABLE products ADD COLUMN unit_type TEXT NOT NULL DEFAULT 'piece';
ALTER TABLE products ADD COLUMN price_per_kg DECIMAL(10,2);
ALTER TABLE products ADD COLUMN min_weight INTEGER DEFAULT 50;
ALTER TABLE products ADD COLUMN max_weight INTEGER DEFAULT 1000;
ALTER TABLE products ADD COLUMN weight_step INTEGER DEFAULT 50;
ALTER TABLE order_items ADD COLUMN weight_grams INTEGER;
ALTER TABLE products ADD CONSTRAINT valid_weight CHECK (
  (unit_type = 'weight' AND price_per_kg IS NOT NULL) OR
  (unit_type = 'piece')
);
```

### Seed data migration
- All existing products set to `unit_type = 'weight'`
- `price_per_kg` calculated from sizes (e.g., 250g at $12.50 → $50/kg)
- Non-weight products (Paletas Espiral, Fiesta Gummy) stay as `piece`

## User Interface

### ProductDetailScreen (weight products)
- Replace size selector + quantity with a gram selector
- Range: `min_weight` to `max_weight`, step `weight_step`
- Controls: `−50g` / `+50g` buttons with manual input
- Display: `"{grams}g — ${price}"` dynamically calculated
- Single "Agregar al carrito" button (no quantity selector)
- Piece products: unchanged

### CatalogScreen
- Weight products show `"$XX/kg"` label instead of `"from $XX"`
- Product card layout otherwise unchanged

### CartScreen
- Weight items display: `"{grams}g"` instead of `"× {quantity}"`
- Piece items: unchanged
- Both types can coexist; subtotal/total calculation works for both
- Checkout flow unchanged (already works as combo with multiple items)

### Header / Cart badge
- No changes; count logic adapts automatically

## API

### Products
- `GET /api/products` and `GET /api/products/:slug` — include new fields automatically
- Admin CRUD: `unit_type`, `price_per_kg`, `min_weight`, `max_weight`, `weight_step` editable

### Cart
- `POST /api/cart` accepts `weight_grams` (optional)
- If `product.unit_type === 'weight'`: requires `weight_grams`; ignores `quantity`
- If `product.unit_type === 'piece'`: uses `quantity` and `selected_size` as before
- `item_price` recalculated server-side

### Orders
- `order_items.weight_grams` saved when applicable
- Order display shows weight info in admin panel

## Admin Panel

### Product Editor
- New field "Tipo de unidad": dropdown (`Por peso` | `Por pieza`)
- If "Por peso": shows `price_per_kg`, `min_weight`, `max_weight`, `weight_step`
- If "Por pieza": shows `base_price` and `sizes` (existing)
- Categories section unchanged

### Order Detail
- Show `weight_grams` for weight-based items in order rows

## Constraints
- Minimum purchase: 50g per product
- Maximum: 1000g per product (configurable)
- Increment: 50g (configurable)
- Cart items must belong to the same user (existing constraint)
- No negative weights; no zero-weight items

## Non-goals
- Real inventory/stock tracking (not part of this feature)
- Real payment processing (stays cosmetic as-is)
- Fixed combo SKUs or pre-configured assortment boxes
