-- Add weight_grams to cart_items so weight-based items can be tracked
ALTER TABLE cart_items ADD COLUMN weight_grams INTEGER;

-- Update stock for existing products (migration compat)
UPDATE products SET stock = 10000 WHERE stock = 0 AND unit_type = 'weight';
UPDATE products SET stock = 200 WHERE stock = 0 AND unit_type = 'piece';
