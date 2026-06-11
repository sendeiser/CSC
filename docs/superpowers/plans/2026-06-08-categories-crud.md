# Product Categories CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded product categories with a `categories` database table, CRUD API, and admin UI.

**Architecture:** New `categories` table with seed data → public + admin API routes → admin panel UI → replace all hardcoded category references in public components with API-driven fetches.

**Tech Stack:** PostgreSQL (Supabase), Express.js, React, lucide-react

---

## File Structure

**New files:**
- `supabase/migrations/20260608000002_categories.sql` — categories table, seed, RLS, alter products constraint
- `src/server/routes/categories.ts` — public `GET /api/categories`
- `src/lib/categoryIcons.ts` — maps icon name strings → lucide-react components

**Modified files:**
- `src/server/routes/admin.ts` — add admin categories CRUD routes (append before `export default router`)
- `src/server/index.ts` — mount public categories router
- `src/lib/api.ts` — add `admin.categories` API methods + `categories` public API
- `src/types.ts` — `Product.category` from union → `string`
- `src/components/AdminPanel.tsx` — add `'categories'` tab + inline CRUD screen
- `src/components/AdminHomepageEditor.tsx` — simplify `CategoriesContentEditor` (remove subtitle-only, or keep as is)
- `src/components/LandingScreen.tsx` — replace `CATEGORIES` constant with API fetch
- `src/components/CatalogScreen.tsx` — replace `CATEGORIES` constant with API fetch

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260608000002_categories.sql`

- [ ] **Step 1.1: Write migration SQL**

```sql
-- Create categories table
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

-- Seed default categories
INSERT INTO categories (name, slug, icon, color, bg_color, text_color, order_index) VALUES
  ('Gomitas', 'Gomitas', 'CandyCane', 'from-pink-400 to-rose-400', 'bg-pink-50', 'text-pink-700', 1),
  ('Chocolates', 'Chocolates', 'Package', 'from-amber-500 to-orange-500', 'bg-amber-50', 'text-amber-700', 2),
  ('Acidulados', 'Acidulados', 'ShoppingBag', 'from-lime-400 to-green-400', 'bg-lime-50', 'text-lime-700', 3),
  ('Caramelos', 'Caramelos', 'CandyCane', 'from-sky-400 to-blue-400', 'bg-sky-50', 'text-sky-700', 4),
  ('Regalos', 'Regalos', 'Heart', 'from-purple-400 to-violet-400', 'bg-purple-50', 'text-purple-700', 5);

-- Remove CHECK constraint from products.category to allow dynamic slugs
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage categories"
  ON categories FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

- [ ] **Step 1.2: Commit migration**

```bash
git add supabase/migrations/20260608000002_categories.sql
git commit -m "feat: add categories table, seed data, RLS"
```

---

### Task 2: Icon map

**Files:**
- Create: `src/lib/categoryIcons.ts`

- [ ] **Step 2.1: Create icon map file**

```typescript
import React from 'react'
import { CandyCane, Package, ShoppingBag, Heart, Store, Star, Sparkles, Gift, Coffee, Cookie, IceCream, Cake } from 'lucide-react'

export const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CandyCane,
  Package,
  ShoppingBag,
  Heart,
  Store,
  Star,
  Sparkles,
  Gift,
  Coffee,
  Cookie,
  IceCream,
  Cake,
}

export function getCategoryIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return CATEGORY_ICONS[iconName] || Package
}
```

- [ ] **Step 2.2: Commit**

```bash
git add src/lib/categoryIcons.ts
git commit -m "feat: add category icon name-to-component map"
```

---

### Task 3: Public categories API route

**Files:**
- Create: `src/server/routes/categories.ts`
- Modify: `src/server/index.ts`

- [ ] **Step 3.1: Create public categories route**

```typescript
import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'

const router = Router()

router.get('/', async (_req, res: Response) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

export default router
```

- [ ] **Step 3.2: Mount route in `src/server/index.ts`**

Find the existing route mounts (search for `app.use('/api/homepage',`). After that line, add:

```typescript
import categoriesRouter from './routes/categories'
// ...
app.use('/api/categories', categoriesRouter)
```

- [ ] **Step 3.3: Commit**

```bash
git add src/server/routes/categories.ts src/server/index.ts
git commit -m "feat: add public categories API route"
```

---

### Task 4: Admin categories CRUD routes

**Files:**
- Modify: `src/server/routes/admin.ts` (append before `export default router`)

- [ ] **Step 4.1: Add admin categories routes**

Find `export default router` and insert before it:

```typescript
// ── Categories ────────────────────────────────────────────

router.get('/categories', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const db = adminDb(res)
  if (!db) return

  const { data, error } = await db.from('categories').select('*').order('order_index', { ascending: true })
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
}))

router.post('/categories', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const { name, slug, icon, color, bg_color, text_color, order_index } = req.body
  const db = adminDb(res)
  if (!db) return

  const { data, error } = await db
    .from('categories')
    .insert({ name, slug, icon, color, bg_color, text_color, order_index })
    .select()
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.status(201).json(data)
}))

router.put('/categories/:id', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const { name, slug, icon, color, bg_color, text_color, order_index } = req.body
  const db = adminDb(res)
  if (!db) return

  const updates: any = {}
  if (name !== undefined) updates.name = name
  if (slug !== undefined) updates.slug = slug
  if (icon !== undefined) updates.icon = icon
  if (color !== undefined) updates.color = color
  if (bg_color !== undefined) updates.bg_color = bg_color
  if (text_color !== undefined) updates.text_color = text_color
  if (order_index !== undefined) updates.order_index = order_index

  const { data, error } = await db
    .from('categories')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json(data)
}))

router.delete('/categories/:id', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
  const db = adminDb(res)
  if (!db) return

  const { error } = await db.from('categories').delete().eq('id', req.params.id)
  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ message: 'Categoría eliminada' })
}))
```

- [ ] **Step 4.2: Commit**

```bash
git add src/server/routes/admin.ts
git commit -m "feat: add admin categories CRUD API routes"
```

---

### Task 5: API client methods

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 5.1: Add categories API methods**

Add after `homepage` export block (before the closing of the `api` module):

```typescript
// Categories (public)
export const categories = {
  list: () => request<any[]>('/categories'),
}

// Add to admin export (find `getAbout:` and insert before it):
// (inside the existing `export const admin = {` block, before the closing brace)
```

Find the `admin` object in `api.ts`. Before `getAbout:` (or after `deleteHomepageSection:`), add:

```typescript
  getCategories: () => request<any[]>('/admin/categories'),
  createCategory: (data: any) =>
    request<any>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) =>
    request<any>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    request<any>(`/admin/categories/${id}`, { method: 'DELETE' }),
```

- [ ] **Step 5.2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add categories API client methods"
```

---

### Task 6: Update types

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 6.1: Change `Product.category` from union to string**

Find the `Product` interface and change:

```typescript
// Before:
  category: 'Gomitas' | 'Chocolates' | 'Acidulados' | 'Caramelos' | 'Regalos';

// After:
  category: string;
```

- [ ] **Step 6.2: Commit**

```bash
git add src/types.ts
git commit -m "refactor: make Product.category a string instead of union type"
```

---

### Task 7: Admin panel categories tab

**Files:**
- Modify: `src/components/AdminPanel.tsx`

- [ ] **Step 7.1: Add 'categories' to AdminSection type check**

Find the `AdminSection` usage in `AdminPanel.tsx` (likely a local type or import). If it's imported from `types.ts`, update it there. If it's local, add `'categories'` to the union.

In `src/types.ts`, find `AdminSection` and add `'categories'`:

```typescript
export type AdminSection = 'dashboard' | 'products' | 'orders' | 'users' | 'promos' | 'homepage' | 'about-page' | 'categories';
```

- [ ] **Step 7.2: Add tab button**

Find the nav buttons in AdminPanel (search for `about-page` or `Sobre Nosotros`). After that button, add:

```tsx
<button
  onClick={() => setSection('categories')}
  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
    section === 'categories' ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
  }`}
>
  Categorías
</button>
```

- [ ] **Step 7.3: Add categories screen rendering**

Find where `about-page` section renders `AdminAboutPageEditor`. After it (or in the same switch/map), add:

```tsx
import { Plus, X, Save, AlertCircle } from 'lucide-react'
import { admin as adminApi, categories as categoriesApi } from '../lib/api'
import { getCategoryIcon } from '../lib/categoryIcons'
```

Then add a new component `AdminCategoriesScreen` inside the file (or in a separate file — inline is fine for now). The screen rendering:

```tsx
{section === 'categories' && <AdminCategoriesScreen />}
```

- [ ] **Step 7.4: Implement `AdminCategoriesScreen`**

Add the component before `export default function AdminPanel`. Include full CRUD with inline editing:

```tsx
function AdminCategoriesScreen() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Record<string, any>>({})
  const [newCategory, setNewCategory] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const startAdd = () => {
    setNewCategory({ name: '', slug: '', icon: 'Package', color: 'from-purple-400 to-violet-400', bg_color: 'bg-purple-50', text_color: 'text-purple-700', order_index: categories.length + 1 })
  }

  const saveNew = async () => {
    if (!newCategory.name.trim() || !newCategory.slug.trim()) return
    try {
      await adminApi.createCategory(newCategory)
      setNewCategory(null)
      await load()
    } catch (e: any) {
      setError(e.message || 'Error al crear')
    }
  }

  const saveEdit = async (id: string) => {
    try {
      await adminApi.updateCategory(id, editing[id])
      setEditing(prev => { const n = { ...prev }; delete n[id]; return n })
      await load()
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría? Los productos existentes conservarán su categoría.')) return
    try {
      await adminApi.deleteCategory(id)
      await load()
    } catch (e: any) {
      setError(e.message || 'Error al eliminar')
    }
  }

  const startEdit = (cat: any) => {
    setEditing(prev => ({ ...prev, [cat.id]: { ...cat } }))
  }

  if (loading) return <div className="animate-pulse space-y-3">{Array.from({length: 5}).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl" />)}</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="font-headline font-bold text-xl text-slate-800">Categorías de Productos</h2>
        <button onClick={startAdd} className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"><Plus className="w-4 h-4" />Agregar categoría</button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={load} className="ml-auto text-xs font-medium underline hover:no-underline">Reintentar</button>
        </div>
      )}

      {newCategory && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-purple-800">Nueva categoría</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input type="text" value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="Nombre" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={newCategory.slug} onChange={e => setNewCategory({ ...newCategory, slug: e.target.value })} placeholder="Slug" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={newCategory.icon} onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })} placeholder="Icono (ej: Package)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={newCategory.color} onChange={e => setNewCategory({ ...newCategory, color: e.target.value })} placeholder="Color (ej: from-pink-400...)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={newCategory.bg_color} onChange={e => setNewCategory({ ...newCategory, bg_color: e.target.value })} placeholder="Bg color" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={newCategory.text_color} onChange={e => setNewCategory({ ...newCategory, text_color: e.target.value })} placeholder="Text color" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="number" value={newCategory.order_index} onChange={e => setNewCategory({ ...newCategory, order_index: Number(e.target.value) })} placeholder="Orden" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setNewCategory(null)} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
            <button onClick={saveNew} className="px-4 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700">Guardar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Orden</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Icono</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Colores</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const isEditing = editing[cat.id]
              const Icon = getCategoryIcon(isEditing?.icon || cat.icon)
              return (
                <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input type="number" value={isEditing.order_index} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, order_index: Number(e.target.value) } })} className="w-16 px-2 py-1 border border-slate-200 rounded text-sm" />
                    ) : (
                      <span className="text-slate-600">{cat.order_index}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input type="text" value={isEditing.name} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, name: e.target.value } })} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" />
                    ) : (
                      <span className="font-medium text-slate-800">{cat.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input type="text" value={isEditing.slug} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, slug: e.target.value } })} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" />
                    ) : (
                      <code className="text-xs text-slate-500">{cat.slug}</code>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input type="text" value={isEditing.icon} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, icon: e.target.value } })} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" />
                    ) : (
                      <span className="inline-flex items-center gap-1"><Icon className="w-4 h-4 text-slate-500" /><span className="text-xs text-slate-400">{cat.icon}</span></span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="space-y-1">
                        <input type="text" value={isEditing.color} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, color: e.target.value } })} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" placeholder="color" />
                        <input type="text" value={isEditing.bg_color} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, bg_color: e.target.value } })} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" placeholder="bg" />
                        <input type="text" value={isEditing.text_color} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, text_color: e.target.value } })} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" placeholder="text" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cat.bg_color} ${cat.text_color}`}>Preview</span>
                        <span className={`w-4 h-4 rounded bg-gradient-to-br ${cat.color}`} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(cat.id)} className="px-2 py-1 text-xs text-purple-600 font-medium hover:bg-purple-50 rounded"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditing(prev => { const n = { ...prev }; delete n[cat.id]; return n })} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(cat)} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">Editar</button>
                          <button onClick={() => remove(cat.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded">Eliminar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 7.5: Commit**

```bash
git add src/types.ts src/components/AdminPanel.tsx src/lib/api.ts
git commit -m "feat: add AdminCategoriesScreen with inline CRUD"
```

---

### Task 8: Update LandingScreen categories section

**Files:**
- Modify: `src/components/LandingScreen.tsx`

- [ ] **Step 8.1: Replace hardcoded CATEGORIES with API-driven render**

Remove the `CATEGORIES` constant (lines 13-19) and the import of `CandyCane, Package, ShoppingBag, Heart` from lucide-react (they're no longer needed at the top level — they'll be used via the icon map).

Update the categories section IIFE:

```tsx
      {/* 3. Nuestros Productos - Categorías */}
      {(() => {
        const catSection = getSection('categories')
        const subtitle = catSection?.content?.subtitle || ''
        const apiCategories = categoriesList
        const displayCategories = apiCategories.length > 0 ? apiCategories : FALLBACK_CATEGORIES
        return (
          <section className="py-20 bg-gradient-to-tr from-pink-50/50 via-white to-purple-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto text-center mb-14">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-600">{catSection?.title || 'Nuestros Productos'}</span>
                <h2 className="mt-2 font-headline font-bold text-3xl sm:text-4xl text-gray-900">
                  {catSection?.subtitle || '¿Qué antojo tenés hoy?'}
                </h2>
                {subtitle && <p className="mt-3 text-sm sm:text-base text-gray-500">{subtitle}</p>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                {displayCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon)
                  return (
                    <motion.button
                      key={cat.slug || cat.key}
                      whileHover={{ y: -4 }}
                      onClick={() => setActiveScreen('catalogo')}
                      className={`${cat.bg_color || cat.bg} rounded-2xl p-6 sm:p-8 text-center transition-all shadow-sm hover:shadow-md group cursor-pointer`}
                    >
                      <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className={`font-headline font-bold text-base ${cat.text_color || cat.text}`}>{cat.name || cat.key}</h3>
                      <p className="text-xs text-gray-400 mt-1">Ver más</p>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })()}
```

Add a state variable for categories:

```typescript
const [categoriesList, setCategoriesList] = useState<any[]>([])
```

Fetch categories alongside sections:

```typescript
useEffect(() => {
    const origin = window.location.origin
    Promise.all([
      fetch(`${origin}/api/homepage`).then(r => r.ok ? r.json() : []),
      fetch(`${origin}/api/categories`).then(r => r.ok ? r.json() : []),
    ])
      .then(([sectionsData, categoriesData]) => {
        setSections(sectionsData)
        setCategoriesList(categoriesData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
```

Define a fallback constant above the component:

```typescript
const FALLBACK_CATEGORIES = [
  { key: 'Gomitas', icon: 'CandyCane', color: 'from-pink-400 to-rose-400', bg_color: 'bg-pink-50', text_color: 'text-pink-700', name: 'Gomitas', slug: 'Gomitas' },
  { key: 'Chocolates', icon: 'Package', color: 'from-amber-500 to-orange-500', bg_color: 'bg-amber-50', text_color: 'text-amber-700', name: 'Chocolates', slug: 'Chocolates' },
  { key: 'Acidulados', icon: 'ShoppingBag', color: 'from-lime-400 to-green-400', bg_color: 'bg-lime-50', text_color: 'text-lime-700', name: 'Acidulados', slug: 'Acidulados' },
  { key: 'Caramelos', icon: 'CandyCane', color: 'from-sky-400 to-blue-400', bg_color: 'bg-sky-50', text_color: 'text-sky-700', name: 'Caramelos', slug: 'Caramelos' },
  { key: 'Regalos', icon: 'Heart', color: 'from-purple-400 to-violet-400', bg_color: 'bg-purple-50', text_color: 'text-purple-700', name: 'Regalos', slug: 'Regalos' },
]
```

Also add imports:

```typescript
import { getCategoryIcon } from '../lib/categoryIcons'
```

Remove from the lucide-react import line: `ShoppingBag, Store, CandyCane, Package, Heart` — only keep the ones still used in other sections.

- [ ] **Step 8.2: Commit**

```bash
git add src/components/LandingScreen.tsx
git commit -m "feat: LandingScreen categories fetched from API"
```

---

### Task 9: Update CatalogScreen categories filter

**Files:**
- Modify: `src/components/CatalogScreen.tsx`

- [ ] **Step 9.1: Replace hardcoded CATEGORIES constant**

Remove the `CATEGORIES` constant (line 15) and replace with API fetch + state:

```typescript
const [categoriesList, setCategoriesList] = useState<any[]>([])

useEffect(() => {
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(setCategoriesList)
      .catch(() => {})
  }, [])
```

Replace the filter pills rendering:

```tsx
{['Todos', ...categoriesList.map(c => c.name || c.slug)].map(cat => (
  <button
    key={cat}
    onClick={() => setActiveCategory(cat)}
    className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
      activeCategory === cat
        ? 'bg-purple-600 text-white shadow-md'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`}
  >
    {cat}
  </button>
))}
```

- [ ] **Step 9.2: Commit**

```bash
git add src/components/CatalogScreen.tsx
git commit -m "feat: CatalogScreen categories fetched from API"
```

---

### Task 10: Update product editor category selector

**Files:**
- Modify: `src/components/AdminPanel.tsx`

- [ ] **Step 10.1: Replace hardcoded select with dynamic options**

Find the product editor's category `<select>` and replace it:

```tsx
<select value={editingProduct?.category || ''} onChange={e => setEditingProduct(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
  <option value="">Seleccionar categoría</option>
  {categoriesList.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
</select>
```

Add a state variable in the product editor section (or reuse the existing one from AdminCategoriesScreen). If AdminPanel is a single component, add `categoriesList` state there:

```typescript
const [categoriesList, setCategoriesList] = useState<any[]>([])

useEffect(() => {
    adminApi.getCategories().then(setCategoriesList).catch(() => {})
  }, [])
```

- [ ] **Step 10.2: Commit**

```bash
git add src/components/AdminPanel.tsx
git commit -m "feat: product editor uses dynamic categories from API"
```

---

### Task 11: Build & verify

- [ ] **Step 11.1: Run type check**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 11.2: Run build**

```bash
npm run build
```

Expected: builds successfully.

- [ ] **Step 11.3: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: final adjustments for categories CRUD"
```
