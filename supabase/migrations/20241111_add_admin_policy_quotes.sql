-- Add policy for admins to view all supplier quotes
CREATE POLICY "Admins can view all quotes"
  ON supplier_quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Add policy for admins to update all quotes (for adding margin and sending to client)
CREATE POLICY "Admins can update all quotes"
  ON supplier_quotes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

COMMENT ON POLICY "Admins can view all quotes" ON supplier_quotes IS 'Allows administrators to view all supplier quotes regardless of ownership';
COMMENT ON POLICY "Admins can update all quotes" ON supplier_quotes IS 'Allows administrators to update quotes (add margin, send to client, etc.)';
