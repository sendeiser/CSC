# Product Categories CRUD

## Problem
Categories are hardcoded in 5 places (TypeScript union type, SQL CHECK constraint, `LandingScreen.tsx` constant, `CatalogScreen.tsx` constant, `AdminPanel.tsx` select dropdown). Adding/editing/deleting categories requires code changes and redeployment.

## Solution
Create a `categories` database table with CRUD API endpoints and admin UI, replacing all hardcoded category definitions with dynamic data fetched from the API.

## Database

### New table: `categories`
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Package',
  color TEXT NOT NULL DEFAULT 'from-purple-400 to-violet-400',
  bg_color TEXT NOT NULL DEFAULT 'bg-purple-50',
  text_color TEXT NOT NULL DEFAULT 'text-purple-700',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Seed data
Insert the 5 existing categories with their current visual properties and icons.
- `Gomitas` → icon: `CandyCane`, color: `from-pink-400 to-rose-400`, bg: `bg-pink-50`, text: `text-pink-700`
- `Chocolates` → icon: `Package`, color: `from-amber-500 to-orange-500`, bg: `bg-amber-50`, text: `text-amber-700`
- `Acidulados` → icon: `ShoppingBag`, color: `from-lime-400 to-green-400`, bg: `bg-lime-50`, text: `text-lime-700`
- `Caramelos` → icon: `CandyCane`, color: `from-sky-400 to-blue-400`, bg: `bg-sky-50`, text: `text-sky-700`
- `Regalos` → icon: `Heart`, color: `from-purple-400 to-violet-400`, bg: `bg-purple-50`, text: `text-purple-700`

### Changes to existing tables
Remove the CHECK constraint on `products.category` so it can accept any category slug (including new ones created dynamically). The constraint is enforced by application logic instead.

### RLS
- Anyone (anon) can SELECT from categories
- Only admins can INSERT/UPDATE/DELETE

## API

### Public
- `GET /api/categories` — returns all categories ordered by `order_index`

### Admin (requireAdmin middleware)
- `GET /api/admin/categories` — list all
- `POST /api/admin/categories` — create `{ name, slug, icon, color, bg_color, text_color, order_index }`
- `PUT /api/admin/categories/:id` — update
- `DELETE /api/admin/categories/:id` — delete (products retain their category slug but it becomes an orphan)

## Frontend

### Icon map
Create `src/lib/categoryIcons.ts` that maps icon name strings to lucide-react components:
```typescript
import { CandyCane, Package, ShoppingBag, Heart, ... } from 'lucide-react'
export const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CandyCane, Package, ShoppingBag, Heart, ...
}
```

### Types
Update `Product.category` from the union type to `string`.

### AdminCategoriesScreen
New component in `AdminPanel.tsx` (tab `'categories'`). Table with:
- Inline editing of name, slug, icon, colors
- Add row button
- Delete with confirmation
- Order via drag or order_index input

### Product Editor
Replace hardcoded `<select>` with one that fetches from `GET /api/categories` and lists category names.

### LandingScreen
Replace hardcoded `CATEGORIES` constant. Fetch from `/api/categories` inside the IIFE (already exists). Use the icon map to render the correct icon component.

### CatalogScreen
Replace hardcoded `CATEGORIES` constant. Fetch from `/api/categories` for the filter pills. Add 'Todos' manually as the first option.

## Data Flow
1. Admin creates/edits/deletes categories → `PUT /api/admin/categories/*`
2. Product editor fetches categories → `GET /api/categories`
3. LandingScreen fetches categories on mount → `GET /api/categories`
4. CatalogScreen fetches categories on mount → `GET /api/categories`

## Error Handling
- Delete: if category has products, show warning but allow deletion (products keep slug)
- API errors show a toast/alert in admin UI
- Fetch failures fall back to empty array (categories section hides gracefully)

## Edge Cases
- If no categories exist, the landing page categories section and catalog filter should not crash (render nothing or "no categories" message)
- Creating a product with a slug that doesn't exist in categories table is allowed (for backwards compatibility with seed data)
- Category icon defaults to `Package` if the stored icon name is not found in the icon map
