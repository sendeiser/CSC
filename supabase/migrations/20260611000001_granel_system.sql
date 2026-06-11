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
