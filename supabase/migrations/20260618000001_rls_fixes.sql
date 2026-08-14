-- Allow regular users to update their own orders (status changes)
DROP POLICY IF EXISTS "orders_update_self" ON orders;
CREATE POLICY "orders_update_self" ON orders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow stock updates by authenticated users
DROP POLICY IF EXISTS "products_update_stock" ON products;
CREATE POLICY "products_update_stock" ON products
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
