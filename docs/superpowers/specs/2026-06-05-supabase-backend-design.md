# Candyverse - Supabase Backend Design

## Overview
Migrate Candyverse from static frontend data to a full-stack architecture with Supabase backend and Express BFF (Backend for Frontend). Enables real authentication, persistent cart, order management, and admin panel.

## Architecture
```
Frontend (React + Vite) → Express API (BFF) → Supabase (PostgreSQL + Auth)
```

## Database Schema

### Products
Table replacing `src/data.ts` static data.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto-generated |
| slug | TEXT UNIQUE | e.g. 'gomitas-explosion-galactica' |
| name | TEXT | |
| description | TEXT | |
| category | TEXT | 'Gomitas', 'Chocolates', 'Acidulados', 'Caramelos', 'Regalos' |
| base_price | DECIMAL(10,2) | |
| image_url | TEXT | |
| tags | TEXT[] | ['NUEVO', 'EXPLOSIÓN'] |
| stars | INTEGER | default 5 |
| reviews | INTEGER | default 0 |
| diet | TEXT[] | ['Vegan', 'Orgánico', 'Sin Azúcar'] |
| bestseller | BOOLEAN | default false |
| on_sale | BOOLEAN | default false |
| discount_percentage | INTEGER | default 0 |
| sizes | JSONB | {"250g": 12.50, "500g": 22.00} |
| created_at | TIMESTAMPTZ | |

### Profiles
Extends Supabase `auth.users`.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | FK → auth.users(id) |
| name | TEXT | display name |
| role | TEXT | 'customer' or 'admin' |
| created_at | TIMESTAMPTZ | |

### Cart Items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | → auth.users(id) |
| product_id | UUID FK | → products(id) |
| quantity | INTEGER | default 1 |
| selected_size | TEXT | |
| item_price | DECIMAL(10,2) | |
| created_at | TIMESTAMPTZ | |

### Orders
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | → auth.users(id) |
| status | TEXT | pending, paid, shipped, delivered |
| total | DECIMAL(10,2) | |
| promo_code_id | UUID FK | → promo_codes(id), nullable |
| discount_amount | DECIMAL(10,2) | default 0 |
| shipping_cost | DECIMAL(10,2) | |
| shipping_name | TEXT | |
| shipping_address | TEXT | |
| shipping_city | TEXT | |
| created_at | TIMESTAMPTZ | |

### Order Items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| order_id | UUID FK | → orders(id) |
| product_id | UUID FK | → products(id) |
| quantity | INTEGER | |
| selected_size | TEXT | |
| unit_price | DECIMAL(10,2) | |

### Favorites
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | → auth.users(id) |
| product_id | UUID FK | → products(id) |
| created_at | TIMESTAMPTZ | |
| UNIQUE | (user_id, product_id) | |

### Promo Codes
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| code | TEXT UNIQUE | 'DULCE2024' |
| percent | INTEGER | 15 |
| active | BOOLEAN | default true |
| max_uses | INTEGER | nullable |
| used_count | INTEGER | default 0 |
| expires_at | TIMESTAMPTZ | nullable |
| created_at | TIMESTAMPTZ | |

### Product Reviews
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| product_id | UUID FK | → products(id) |
| user_id | UUID FK | → auth.users(id) |
| rating | INTEGER | CHECK 1-5 |
| comment | TEXT | nullable |
| created_at | TIMESTAMPTZ | |

## RLS Policies

### products
- `SELECT`: anon (público)
- `INSERT/UPDATE/DELETE`: authenticated with role = 'admin'

### profiles
- `SELECT`: anon (público, solo name y role)
- `UPDATE`: authenticated where id = auth.uid()

### cart_items
- `SELECT/INSERT/UPDATE/DELETE`: authenticated where user_id = auth.uid()

### orders
- `SELECT/INSERT`: authenticated where user_id = auth.uid()
- `UPDATE`: admin only

### order_items
- `SELECT/INSERT`: authenticated where order.user_id = auth.uid()

### favorites
- `SELECT/INSERT/DELETE`: authenticated where user_id = auth.uid()

### promo_codes
- `SELECT`: anon (validar código)
- `INSERT/UPDATE/DELETE`: admin only

### product_reviews
- `SELECT`: anon
- `INSERT`: authenticated
- `UPDATE/DELETE`: authenticated where user_id = auth.uid()

## Express API Endpoints

### Auth (proxy a Supabase)
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user + profile
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - List (with filters, search, category)
- `GET /api/products/:slug` - Detail
- `POST /api/products` - Admin: create
- `PUT /api/products/:id` - Admin: update
- `DELETE /api/products/:id` - Admin: delete

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item
- `PUT /api/cart/:id` - Update quantity
- `DELETE /api/cart/:id` - Remove item

### Orders
- `GET /api/orders` - List user's orders
- `POST /api/orders` - Create order (checkout)
- `GET /api/orders/:id` - Order detail
- `PUT /api/orders/:id/status` - Admin: update status

### Favorites
- `GET /api/favorites` - List user's favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites/:productId` - Remove favorite

### Admin
- `GET /api/admin/users` - List users
- `GET /api/admin/orders` - All orders
- `GET /api/admin/stats` - Dashboard stats
- `POST /api/admin/promo-codes` - Create promo code

## Frontend Changes
- Replace direct `data.ts` imports with API calls
- Replace simulated auth with Supabase Auth via Express
- Replace localStorage cart with server-side cart
- Add session management with httpOnly cookies or JWT
