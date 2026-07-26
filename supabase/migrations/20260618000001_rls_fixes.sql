-- Allow regular users to update their own orders (status changes)
CREATE POLICY "orders_update_self" ON orders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow stock updates by authenticated users
CREATE POLICY "products_update_stock" ON products
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
