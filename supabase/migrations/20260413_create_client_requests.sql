-- ============================================================================
-- Migration: Client Request System (Twinsk-inspired)
-- Adds 6 new tables for the client request → marketplace search → proposal workflow
-- ============================================================================

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- Table 1: client_requests
-- Top-level request created by admin (UUID link) or client directly
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Public access via unique link
  public_uuid TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,

  -- Client info (filled on submission)
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_company TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Request metadata
  request_number TEXT UNIQUE NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'submitted',
    'searching',
    'search_complete',
    'proposal_ready',
    'proposal_reviewed',
    'quoted',
    'accepted',
    'rejected',
    'cancelled'
  )),

  -- Linking to existing ByProject system
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  supplier_request_id UUID REFERENCES supplier_requests(id) ON DELETE SET NULL,

  -- Sector for auto-project creation
  sector_id UUID,

  -- Admin fields
  admin_notes TEXT,
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  search_started_at TIMESTAMPTZ,
  proposal_sent_at TIMESTAMPTZ,
  client_reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- Table 2: client_request_items
-- Individual items submitted by the client (images + text descriptions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_request_id UUID NOT NULL REFERENCES client_requests(id) ON DELETE CASCADE,

  -- Item details (from client)
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'pièce',
  images TEXT[] DEFAULT '{}',
  reference_url TEXT,

  -- Auto-translations
  name_zh TEXT,
  name_en TEXT,
  description_zh TEXT,
  description_en TEXT,

  -- Admin curation
  admin_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'searching',
    'results_available',
    'curated',
    'no_results'
  )),

  -- Link to ByProject material (created on conversion)
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,

  -- Client note on this item (from proposal review)
  client_note TEXT,

  -- Ordering
  sort_order INTEGER DEFAULT 0,
  added_by TEXT DEFAULT 'client' CHECK (added_by IN ('client', 'admin')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table 3: marketplace_search_results
-- Results from Taobao, 1688, and Kimi factory searches
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_request_item_id UUID NOT NULL REFERENCES client_request_items(id) ON DELETE CASCADE,

  -- Source marketplace
  source TEXT NOT NULL CHECK (source IN ('1688', 'taobao', 'kimi_factory', 'manual')),

  -- Product data
  external_id TEXT,
  title TEXT NOT NULL,
  title_zh TEXT,
  title_fr TEXT,
  description TEXT,
  description_zh TEXT,
  description_fr TEXT,

  -- Pricing
  price_min NUMERIC(15,2),
  price_max NUMERIC(15,2),
  currency TEXT DEFAULT 'CNY',

  -- Product details
  moq INTEGER,
  image_url TEXT,
  main_image_url TEXT,
  extra_images JSONB DEFAULT '[]',
  product_url TEXT,

  -- Supplier info
  supplier_name TEXT,
  supplier_location TEXT,
  supplier_rating NUMERIC(5,2),
  supplier_years INTEGER,
  supplier_verified BOOLEAN DEFAULT FALSE,
  supplier_contact JSONB DEFAULT '{}',

  -- Weight & dimensions (for shipping)
  weight NUMERIC(10,3),
  volume NUMERIC(10,3),
  dimensions TEXT,

  -- Admin curation
  is_selected BOOLEAN DEFAULT FALSE,
  admin_margin_percent NUMERIC(5,2) DEFAULT 0,
  client_price NUMERIC(15,2),
  client_currency TEXT DEFAULT 'EUR',
  quantity INTEGER DEFAULT 1,
  admin_notes TEXT,

  -- Client response (from proposal review)
  client_selected BOOLEAN,
  client_quantity INTEGER,

  -- Raw API data for debugging
  raw_data JSONB DEFAULT '{}',

  -- Timestamps
  searched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table 4: client_proposals
-- Curated proposals sent to the client for review
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_request_id UUID NOT NULL REFERENCES client_requests(id) ON DELETE CASCADE,

  -- Proposal metadata
  proposal_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',
    'sent',
    'viewed',
    'accepted',
    'rejected',
    'expired'
  )),

  -- Pricing
  total_amount NUMERIC(15,2),
  currency TEXT DEFAULT 'EUR',
  default_margin_percent NUMERIC(5,2) DEFAULT 20.00,

  -- Document
  document_type TEXT DEFAULT 'devis' CHECK (document_type IN ('devis', 'packing_list', 'proforma')),
  pdf_url TEXT,

  -- Validity
  valid_until TIMESTAMPTZ,

  -- Client response
  client_selections JSONB DEFAULT '[]',
  client_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
);

-- ============================================================================
-- Table 5: client_request_notes
-- Notes/communication between admin and client per item
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_request_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Can be attached to an item or a search result
  client_request_item_id UUID REFERENCES client_request_items(id) ON DELETE CASCADE,
  marketplace_search_result_id UUID REFERENCES marketplace_search_results(id) ON DELETE CASCADE,

  -- Author
  author_type TEXT NOT NULL CHECK (author_type IN ('admin', 'client', 'system')),
  author_id UUID,

  -- Content
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- At least one FK must be set
  CONSTRAINT notes_must_have_parent CHECK (
    client_request_item_id IS NOT NULL OR marketplace_search_result_id IS NOT NULL
  )
);

-- ============================================================================
-- Table 6: notification_events
-- Track notifications sent at key lifecycle events
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event info
  event_type TEXT NOT NULL,
  client_request_id UUID REFERENCES client_requests(id) ON DELETE CASCADE,

  -- Recipient
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('admin', 'client')),
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'email', 'in_app')),
  recipient_address TEXT,

  -- Payload
  payload JSONB DEFAULT '{}',

  -- Status
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_client_requests_public_uuid ON client_requests(public_uuid);
CREATE INDEX idx_client_requests_status ON client_requests(status);
CREATE INDEX idx_client_requests_user ON client_requests(user_id);
CREATE INDEX idx_client_requests_project ON client_requests(project_id);

CREATE INDEX idx_client_request_items_request ON client_request_items(client_request_id);
CREATE INDEX idx_client_request_items_status ON client_request_items(status);
CREATE INDEX idx_client_request_items_material ON client_request_items(material_id);

CREATE INDEX idx_marketplace_results_item ON marketplace_search_results(client_request_item_id);
CREATE INDEX idx_marketplace_results_source ON marketplace_search_results(source);
CREATE INDEX idx_marketplace_results_selected ON marketplace_search_results(is_selected);
CREATE INDEX idx_marketplace_results_external ON marketplace_search_results(source, external_id);

CREATE INDEX idx_client_proposals_request ON client_proposals(client_request_id);
CREATE INDEX idx_client_proposals_status ON client_proposals(status);

CREATE INDEX idx_client_request_notes_item ON client_request_notes(client_request_item_id);
CREATE INDEX idx_client_request_notes_result ON client_request_notes(marketplace_search_result_id);

CREATE INDEX idx_notification_events_request ON notification_events(client_request_id);
CREATE INDEX idx_notification_events_type ON notification_events(event_type);

-- Full-text search on marketplace results
CREATE INDEX idx_marketplace_results_title_trgm ON marketplace_search_results USING gin (title gin_trgm_ops);
CREATE INDEX idx_marketplace_results_supplier_trgm ON marketplace_search_results USING gin (supplier_name gin_trgm_ops);

-- ============================================================================
-- Enable RLS
-- ============================================================================
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_request_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- client_requests: public access via public_uuid, owner access via user_id
CREATE POLICY "Public access to client requests via UUID"
  ON client_requests FOR SELECT
  USING (public_uuid IS NOT NULL);

CREATE POLICY "Users can view their own client requests"
  ON client_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create client requests"
  ON client_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own client requests"
  ON client_requests FOR UPDATE
  USING (auth.uid() = user_id OR public_uuid IS NOT NULL);

CREATE POLICY "Service role full access to client_requests"
  ON client_requests FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- client_request_items: access via parent request
CREATE POLICY "Public access to client request items"
  ON client_request_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_requests
      WHERE client_requests.id = client_request_items.client_request_id
    )
  );

CREATE POLICY "Anyone can add items to client requests"
  ON client_request_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update client request items"
  ON client_request_items FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete client request items"
  ON client_request_items FOR DELETE
  USING (true);

-- marketplace_search_results: read access for all, write for service role
CREATE POLICY "Public read access to marketplace results"
  ON marketplace_search_results FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage marketplace results"
  ON marketplace_search_results FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- client_proposals: public read via parent request
CREATE POLICY "Public access to proposals"
  ON client_proposals FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage proposals"
  ON client_proposals FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- client_request_notes: read/write for all parties
CREATE POLICY "Public access to request notes"
  ON client_request_notes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add notes"
  ON client_request_notes FOR INSERT
  WITH CHECK (true);

-- notification_events: service role only
CREATE POLICY "Service role manages notifications"
  ON notification_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Functions
-- ============================================================================

-- Auto-generate client request number
CREATE OR REPLACE FUNCTION generate_client_request_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  counter := (SELECT COUNT(*) FROM client_requests) + 1;
  new_number := 'CR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate proposal number
CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  counter := (SELECT COUNT(*) FROM client_proposals) + 1;
  new_number := 'PR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER trigger_client_requests_updated
  BEFORE UPDATE ON client_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_client_request_timestamp();

CREATE TRIGGER trigger_client_request_items_updated
  BEFORE UPDATE ON client_request_items
  FOR EACH ROW
  EXECUTE FUNCTION update_client_request_timestamp();

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE client_requests IS 'Client sourcing requests with marketplace search workflow (Twinsk-inspired)';
COMMENT ON TABLE client_request_items IS 'Individual items submitted by clients with images and descriptions';
COMMENT ON TABLE marketplace_search_results IS 'Product results from Taobao, 1688, and Kimi factory searches';
COMMENT ON TABLE client_proposals IS 'Curated proposals sent to clients with margin-applied pricing';
COMMENT ON TABLE client_request_notes IS 'Communication threads between admin and client per item/result';
COMMENT ON TABLE notification_events IS 'Notification event tracking for Telegram, email, and in-app';
