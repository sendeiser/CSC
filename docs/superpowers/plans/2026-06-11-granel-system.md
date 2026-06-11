# Granel (Bulk Weight) Purchase System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable customers to buy gummies by weight (grams, 50g increments) with price_per_kg, while keeping piece-based products working. Cart acts as assorted combo.

**Architecture:** Add `unit_type`, `price_per_kg`, weight config fields to products. Add `weight_grams` to cart/order items. Replace size+quantity UI with weight selector when `unit_type = 'weight'`. Extend cart API to handle weight items.

**Tech Stack:** React 19, Express, Supabase (PostgreSQL), TypeScript, motion

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260611000001_granel_system.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- Add granel fields to products
ALTER TABLE products ADD COLUMN unit_type TEXT NOT NULL DEFAULT 'piece';
ALTER TABLE products ADD COLUMN price_per_kg DECIMAL(10,2);
ALTER TABLE products ADD COLUMN min_weight INTEGER DEFAULT 50;
ALTER TABLE products ADD COLUMN max_weight INTEGER DEFAULT 1000;
ALTER TABLE products ADD COLUMN weight_step INTEGER DEFAULT 50;

-- Add weight tracking to order items
ALTER TABLE order_items ADD COLUMN weight_grams INTEGER;

-- Constraint: if weight type, price_per_kg is required
ALTER TABLE products ADD CONSTRAINT valid_weight CHECK (
  (unit_type = 'weight' AND price_per_kg IS NOT NULL) OR
  (unit_type = 'piece')
);
```

Run: `npx supabase db push`

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260611000001_granel_system.sql
git commit -m "feat: add granel fields to products and order_items"
```

---

### Task 2: Update TypeScript types

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Update Product interface**

Add new optional fields:
```typescript
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  image_url: string;
  tags: string[];
  stars: number;
  reviews: number;
  diet?: ('Sin Azúcar' | 'Vegan' | 'Orgánico')[];
  bestseller?: boolean;
  on_sale?: boolean;
  discount_percentage?: number;
  sizes?: { [key: string]: number };
  unit_type?: 'weight' | 'piece';
  price_per_kg?: number;
  min_weight?: number;
  max_weight?: number;
  weight_step?: number;
  created_at: string;
}
```

- [ ] **Step 2: Update CartItem interface**

```typescript
export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  itemPrice: number;
  weight_grams?: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add granel types (unit_type, price_per_kg, weight_grams)"
```

---

### Task 3: Seed `unit_type` and `price_per_kg` for existing products

**Files:**
- Modify: `src/data.ts`

- [ ] **Step 1: Calculate price_per_kg for weight-based products and set unit_type**

Replace the `PRODUCTS` array export with updated objects. Add `unit_type` and `price_per_kg` for gummy/candy products. Keep `unit_type = 'piece'` for non-weight items (Trufas Galácticas, Caja Universo de Sabor, Paletas Espiral, Fiesta Gummy).

```typescript
export const PRODUCTS = [
  {
    id: 'gomitas-explosion-galactica',
    // ...keep existing fields...
    unit_type: 'weight',
    price_per_kg: 50.00,  // 250g at $12.50 → $50/kg? No: $12.50 / 0.25kg = $50/kg
    sizes: {
      '250g': 12.50,
      '500g': 22.00,
      '1kg': 40.00
    }
  },
  // ...update each product accordingly
]
```

Calculate `price_per_kg` for each weight product:
- gomitas-explosion-galactica: 250g/$12.50 → $50/kg; 500g/$22 → $44/kg; 1kg/$40 → $40/kg → use $50/kg (base)
- ositos-cosmicos: 300g/$36 → $120/kg; 500g/$55 → $110/kg → use $120/kg
- cintas-neon: Pack Estándar/$25 → keep as piece (packs, not weight)
- nubes-algodon: 200g/$18 → $90/kg → weight
- rulos-de-canela: 150g/$14.50 → $96.67/kg → weight
- paletas-espiral: 1 pieza/$3.50 → piece
- fiesta-gummy: Bolsa 500g/$12.50 → $25/kg → weight  
- bombones-luna: Caja 6/$32 → piece
- arcoiris-enzima: 300g/$28 → $93.33/kg → weight
- lagrimas-unicornio: 250g/$22 → $88/kg → weight

- [ ] **Step 2: Commit**

```bash
git add src/data.ts
git commit -m "feat: add unit_type and price_per_kg to seed products"
```

---

### Task 4: Update backend cart route to accept weight_grams

**Files:**
- Modify: `src/server/routes/cart.ts`

- [ ] **Step 1: Update POST route to handle weight-based items**

Replace lines 21-66 with code that:
- Accepts `weight_grams` in body
- If `weight_grams` provided, calculate `item_price = (weight_grams / 1000) * product.price_per_kg`
- For upsert (existing item check): for weight items, `selected_size` is always `'Granel'` + product_id, so a user can only have one weight entry per product
- For weight items: set `quantity = 1`, `selected_size = 'Granel'`

```typescript
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { product_id, quantity, selected_size, item_price, weight_grams } = req.body

  // If weight-based, fetch product to calculate price
  let finalPrice = item_price
  let finalSize = selected_size
  let finalQty = quantity || 1

  if (weight_grams) {
    const { data: product } = await supabase
      .from('products')
      .select('price_per_kg, unit_type')
      .eq('id', product_id)
      .single()

    if (product && product.unit_type === 'weight' && product.price_per_kg) {
      finalPrice = Math.round((weight_grams / 1000) * Number(product.price_per_kg) * 100) / 100
      finalSize = 'Granel'
      finalQty = 1
    }
  }

  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', req.user!.id)
    .eq('product_id', product_id)
    .eq('selected_size', finalSize)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: finalQty, item_price: finalPrice, selected_size: finalSize })
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

  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      user_id: req.user!.id,
      product_id,
      quantity: finalQty,
      selected_size: finalSize,
      item_price: finalPrice
    })
    .select('*, products(*)')
    .single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.status(201).json(data)
})
```

- [ ] **Step 2: Commit**

```bash
git add src/server/routes/cart.ts
git commit -m "feat: cart POST accepts weight_grams, calculates price from price_per_kg"
```

---

### Task 5: Update `addToCart` in App.tsx to support weight products

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Modify `addToCart` function (lines 116-151)**

For weight-based products, calculate price and pass `weight_grams` instead of `quantity`.

Replace the function:
```typescript
const addToCart = async (product: Product, size: string, quantity: number, weight_grams?: number) => {
  let priceVal: number
  let itemSize: string
  let itemQty: number

  if (product.unit_type === 'weight') {
    itemSize = 'Granel'
    itemQty = 1
    priceVal = (weight_grams! / 1000) * product.price_per_kg!
  } else {
    itemSize = size
    itemQty = quantity
    priceVal = product.sizes && product.sizes[size] ? product.sizes[size] : product.base_price
  }

  const newItem: CartItem = {
    product,
    quantity: itemQty,
    selectedSize: itemSize,
    itemPrice: priceVal,
    weight_grams: product.unit_type === 'weight' ? weight_grams : undefined
  }

  if (!session.isLoggedIn) {
    setCart(prev => {
      const existing = prev.find(
        i => i.product.id === product.id && i.selectedSize === itemSize
      )
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id && i.selectedSize === itemSize
            ? { ...i, ...(product.unit_type === 'weight' ? { weight_grams, itemPrice: priceVal } : { quantity: i.quantity + itemQty }) }
            : i
        )
      }
      return [...prev, newItem]
    })
    showToast(`¡Añadido ${product.unit_type === 'weight' ? weight_grams + 'g' : itemQty + 'x'} ${product.name} a tu Bolsa!`)
    return
  }

  try {
    const cartPayload: any = {
      product_id: product.id,
      quantity: itemQty,
      selected_size: itemSize,
      item_price: priceVal
    }
    if (product.unit_type === 'weight') {
      cartPayload.weight_grams = weight_grams
    }
    await cartApi.add(cartPayload)
    const items = await cartApi.list()
    const mapped: CartItem[] = items.map((i: any) => ({
      product: i.products,
      quantity: i.quantity,
      selectedSize: i.selected_size,
      itemPrice: Number(i.item_price),
      weight_grams: i.weight_grams
    }))
    setCart(mapped)
    showToast(`¡Añadido ${product.unit_type === 'weight' ? weight_grams + 'g' : itemQty + 'x'} ${product.name} a tu Bolsa!`)
  } catch {
    showToast('Error al añadir al carrito', 'info')
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: addToCart supports weight-based products with weight_grams"
```

---

### Task 6: Update ProductDetailScreen for weight products

**Files:**
- Modify: `src/components/ProductDetailScreen.tsx`

- [ ] **Step 1: Replace size + quantity UI with weight selector when `unit_type === 'weight'`**

Replace the `addToCart` call signature in the interface (line 10):
```typescript
addToCart: (product: Product, size: string, quantity: number, weight_grams?: number) => void;
```

Replace the weight selection + quantity section (lines 246-274) and pricing section (lines 276-315).

The new code for weight products:
```typescript
// State for weight products (Add after line 73)
const [weightGrams, setWeightGrams] = React.useState(product.min_weight || 50);

// Reset weight on product change (inside the useEffect at line 89)
setWeightGrams(product.min_weight || 50);
```

Replace the sizes section (lines 246-274) with:
```typescript
{/* Weight selector for granel products */}
{product.unit_type === 'weight' && (
  <div className="space-y-2">
    <h3 className="text-xs font-headline font-extrabold text-slate-700 uppercase tracking-widest flex items-center space-x-1">
      <Tag className="w-3.5 h-3.5" />
      <span>Seleccionar Peso:</span>
    </h3>
    <div className="flex items-center space-x-3">
      <button
        onClick={() => setWeightGrams(g => Math.max(product.min_weight || 50, g - (product.weight_step || 50)))}
        className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center hover:border-purple-300 transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="flex-1 text-center">
        <span className="text-2xl font-black text-slate-900">{weightGrams}g</span>
        <p className="text-xs text-slate-500">${((weightGrams / 1000) * (product.price_per_kg || 0)).toFixed(2)}</p>
      </div>
      <button
        onClick={() => setWeightGrams(g => Math.min(product.max_weight || 1000, g + (product.weight_step || 50)))}
        className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center hover:border-purple-300 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  </div>
)}

{/* Size selector for piece products (existing code, wrapped in condition) */}
{product.unit_type !== 'weight' && product.sizes && (
  // ... existing sizes JSX ...
)}
```

Replace the pricing section (lines 276-315) — for weight, subtotal is just the weight price (no quantity):
```typescript
{/* Cost display */}
<div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
  <div className="flex flex-col">
    <span className="text-xs text-slate-400 font-medium">Precio:</span>
    <span className="text-2xl font-black text-slate-950">
      ${(product.unit_type === 'weight'
        ? (weightGrams / 1000) * (product.price_per_kg || 0)
        : activePrice * quantity
      ).toFixed(2)}
    </span>
    {product.unit_type === 'weight' && (
      <span className="text-[10px] text-slate-500 mt-0.5">
        ${(product.price_per_kg || 0).toFixed(2)} / kg
      </span>
    )}
  </div>
  {/* Quantity selector — only for piece products */}
  {product.unit_type !== 'weight' && (
    <div className="flex items-center space-x-3.5">
      // ... existing quantity selector JSX ...
    </div>
  )}
</div>
```

Replace the main CTA button (lines 318-329) to pass weight: 
```typescript
<button
  id="addToCartDetail"
  onClick={() => {
    if (product.unit_type === 'weight') {
      addToCart(product, 'Granel', 1, weightGrams);
    } else {
      addToCart(product, selectedSize, quantity);
    }
  }}
  className="flex-1 flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl shadow-md cursor-pointer transition-transform duration-100 active:scale-95"
>
  <ShoppingBag className="w-5 h-5 animate-pulse" />
  <span>{product.unit_type === 'weight' ? `Agregar ${weightGrams}g a la Bolsa` : 'Agregar a la Bolsa'}</span>
</button>
```

Also update the `activePrice` calculation (lines 99-101) to handle weight:
```typescript
const activePrice = product.unit_type === 'weight'
  ? (weightGrams / 1000) * (product.price_per_kg || 0)
  : product.sizes && product.sizes[selectedSize]
    ? product.sizes[selectedSize]
    : product.base_price;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProductDetailScreen.tsx
git commit -m "feat: ProductDetailScreen weight selector for granel products"
```

---

### Task 7: Update CatalogScreen for weight pricing display

**Files:**
- Modify: `src/components/CatalogScreen.tsx`

- [ ] **Step 1: Update price rendering lines ~224-231**

Replace the price display section to show `$XX/kg` for weight products instead of `from $XX`:

```typescript
{product.unit_type === 'weight' ? (
  <span className="text-lg font-bold text-gray-900">
    ${(product.price_per_kg || 0).toFixed(2)} <span className="text-xs font-normal text-gray-500">/ kg</span>
  </span>
) : product.on_sale ? (
  // ... existing sale price JSX ...
) : (
  <span className="text-lg font-bold text-gray-900">
    ${product.base_price.toFixed(2)}
  </span>
)}
```

Also update the "Add to cart" button (line 243) to pass weight for granel products:
```typescript
onClick={() => {
  if (product.unit_type === 'weight') {
    addToCart(product, 'Granel', 1, product.min_weight || 50)
  } else {
    addToCart(product, Object.keys(product.sizes || {})[0] || '1 pieza', 1)
  }
}}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CatalogScreen.tsx
git commit -m "feat: CatalogScreen shows price_per_kg for weight products"
```

---

### Task 8: Update CartScreen for weight items display

**Files:**
- Modify: `src/components/CartScreen.tsx`

- [ ] **Step 1: Update cart item rendering (lines 180-207)**

For weight items, show weight instead of quantity selector, and remove +/- buttons:

Replace the cart item card:
```typescript
{motion.div
  key={`${item.product.id}-${item.selectedSize}`}
  ...
  <div className="flex-1 min-w-0">
    <h3 className="font-headline font-bold text-sm text-gray-900 truncate">{item.product.name}</h3>
    <p className="text-[11px] text-gray-500 mt-0.5">
      {item.weight_grams ? `${item.weight_grams}g` : `Tamaño: ${item.selectedSize}`}
    </p>
    <div className="flex items-center justify-between mt-3">
      <div className="flex items-center space-x-2">
        {item.weight_grams ? (
          <span className="text-sm font-bold text-gray-700">{item.weight_grams}g</span>
        ) : (
          <>
            <button onClick={() => handleQuantityChange(index, -1)} className="w-7 h-7 rounded-full border border-pink-200 text-gray-500 hover:bg-pink-100 ...">-</button>
            <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
            <button onClick={() => handleQuantityChange(index, 1)} className="w-7 h-7 rounded-full border border-pink-200 text-gray-500 hover:bg-pink-100 ...">+</button>
          </>
        )}
      </div>
      <div className="flex items-center space-x-3">
        <span className="font-bold text-sm text-gray-900">${(item.itemPrice * item.quantity).toFixed(2)}</span>
        <button onClick={() => handleRemoveItem(index)} className="text-pink-400 hover:text-pink-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</motion.div>}
```

- [ ] **Step 2: Also update `handleQuantityChange` to skip on weight items**

```typescript
const handleQuantityChange = async (index: number, delta: number) => {
  const item = cart[index]
  if (item.weight_grams) return  // weight items don't use quantity
  // ... rest of existing code ...
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CartScreen.tsx
git commit -m "feat: CartScreen shows weight for granel items"
```

---

### Task 9: Update AdminPanel product editor

**Files:**
- Modify: `src/components/AdminPanel.tsx`

- [ ] **Step 1: Add unit_type field to the product form**

After the category `<select>` (line 623), add:
```typescript
<select value={editingProduct?.unit_type || 'piece'} onChange={e => setEditingProduct(p => ({ ...p, unit_type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
  <option value="piece">Por pieza</option>
  <option value="weight">Por peso (granel)</option>
</select>
```

Then wrap `base_price` input with a conditional — show only for piece:
```typescript
{editingProduct?.unit_type !== 'weight' && (
  <input type="number" step="0.01" placeholder="Precio Base" ... />
)}
```

Add granel fields when `unit_type === 'weight'`:
```typescript
{editingProduct?.unit_type === 'weight' && (
  <>
    <input type="number" step="0.01" placeholder="Precio por KG" value={editingProduct?.price_per_kg || ''} onChange={e => setEditingProduct(p => ({ ...p, price_per_kg: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
    <div className="grid grid-cols-3 gap-2">
      <input type="number" placeholder="Min (g)" value={editingProduct?.min_weight || 50} onChange={e => setEditingProduct(p => ({ ...p, min_weight: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
      <input type="number" placeholder="Max (g)" value={editingProduct?.max_weight || 1000} onChange={e => setEditingProduct(p => ({ ...p, max_weight: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
      <input type="number" placeholder="Incremento (g)" value={editingProduct?.weight_step || 50} onChange={e => setEditingProduct(p => ({ ...p, weight_step: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
    </div>
  </>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AdminPanel.tsx
git commit -m "feat: admin product editor supports unit_type and granel fields"
```

---

### Task 10: Fix CartScreen subtotal for weight items (cartItem.price already correct from server)

**Files:**
- Modify: `src/components/CartScreen.tsx`

No change needed — `itemPrice` is already calculated server-side for weight items, and `item.quantity` is 1 for weight items. Subtotal already works (sum of `itemPrice * quantity`).

But we need to handle the `handleQuantityChange` and `handleRemoveItem` for server-synced weight items when user is logged in.

- [ ] **Step 1: Verify the remove function works for weight items**

The remove function matches by `product_id` and `selectedSize`. For weight items, `selectedSize` is `'Granel'`. This means if a user adds the same product twice with different weights, only the first one will be found. This is a known limitation — for simplicity, weight items with `'Granel'` size mean only one entry per product.

No code change needed.

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: cart handles weight items (quantity=1, Granel size)"
```

---

### Task 11: Verify and push

**Files:** none

- [ ] **Step 1: Build**

```bash
npm run build
```
Expected: Build succeeds.

- [ ] **Step 2: Push**

```bash
git push origin main
```
