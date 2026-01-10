-- Create supplier_tokens table for isolated supplier access
-- Each supplier gets their own unique token and workspace

CREATE TABLE IF NOT EXISTS supplier_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_request_id UUID NOT NULL REFERENCES supplier_requests(id) ON DELETE CASCADE,

  -- Unique token for this supplier
  token TEXT UNIQUE NOT NULL,

  -- Supplier info (filled by supplier on first access)
  supplier_name TEXT,
  supplier_email TEXT,
  supplier_company TEXT,
  supplier_country TEXT DEFAULT 'Chine',
  supplier_phone TEXT,
  supplier_whatsapp TEXT,
  supplier_wechat TEXT,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'in_progress', 'submitted')),

  -- Materials snapshot at time of sending (for sync tracking)
  materials_snapshot JSONB NOT NULL,
  materials_version INTEGER DEFAULT 1,

  -- Supplier's quotes for each material
  quoted_materials JSONB DEFAULT '[]'::jsonb,

  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  has_pending_updates BOOLEAN DEFAULT FALSE,
  pending_updates JSONB DEFAULT '[]'::jsonb,

  -- Access tracking
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,

  -- Expiration
  expires_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_supplier_tokens_request ON supplier_tokens(supplier_request_id);
CREATE INDEX idx_supplier_tokens_token ON supplier_tokens(token);
CREATE INDEX idx_supplier_tokens_status ON supplier_tokens(status);
CREATE INDEX idx_supplier_tokens_expires ON supplier_tokens(expires_at) WHERE expires_at IS NOT NULL;

-- RLS Policies
ALTER TABLE supplier_tokens ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage supplier tokens"
  ON supplier_tokens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Users can view tokens for their own supplier requests
CREATE POLICY "Users can view their supplier tokens"
  ON supplier_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM supplier_requests
      WHERE supplier_requests.id = supplier_tokens.supplier_request_id
      AND supplier_requests.user_id = auth.uid()
    )
  );

-- Public access with valid token (for suppliers without auth)
CREATE POLICY "Anyone can view with valid token"
  ON supplier_tokens FOR SELECT
  USING (
    token IS NOT NULL AND
    (expires_at IS NULL OR expires_at > NOW())
  );

-- Anyone can update their own token data (supplier filling info)
CREATE POLICY "Anyone can update with valid token"
  ON supplier_tokens FOR UPDATE
  USING (
    token IS NOT NULL AND
    (expires_at IS NULL OR expires_at > NOW())
  )
  WITH CHECK (
    token IS NOT NULL AND
    (expires_at IS NULL OR expires_at > NOW())
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_supplier_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supplier_tokens_updated_at
  BEFORE UPDATE ON supplier_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_tokens_updated_at();

-- Add column to supplier_requests to track sync status
ALTER TABLE supplier_requests ADD COLUMN IF NOT EXISTS materials_version INTEGER DEFAULT 1;
ALTER TABLE supplier_requests ADD COLUMN IF NOT EXISTS last_materials_update TIMESTAMPTZ;

-- Comment
COMMENT ON TABLE supplier_tokens IS 'Individual tokens for each supplier with isolated workspace and sync tracking';
