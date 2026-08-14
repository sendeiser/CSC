-- Add combo support
ALTER TABLE products ADD COLUMN is_combo BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN combo_capacity INTEGER;

ALTER TABLE cart_items ADD COLUMN combo_selections JSONB DEFAULT '[]'::jsonb;
ALTER TABLE order_items ADD COLUMN combo_selections JSONB DEFAULT '[]'::jsonb;

-- Drop the unique constraint on cart_items to allow duplicate products if they are combos
DO $$
DECLARE
    const_name text;
BEGIN
    SELECT conname INTO const_name
    FROM pg_constraint
    WHERE conrelid = 'cart_items'::regclass
      AND contype = 'u'
      AND conname LIKE '%user_id%product_id%selected_size%';

    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE cart_items DROP CONSTRAINT ' || const_name;
    END IF;
END $$;
