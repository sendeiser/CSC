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
