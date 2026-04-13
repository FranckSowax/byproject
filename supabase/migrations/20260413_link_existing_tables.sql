-- ============================================================================
-- Migration: Link existing tables to client request system
-- Non-destructive: adds nullable FK columns only
-- ============================================================================

-- Link materials to client request items (for conversion flow)
ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS client_request_item_id UUID REFERENCES client_request_items(id) ON DELETE SET NULL;

-- Link material_quotations to marketplace search results
ALTER TABLE material_quotations
  ADD COLUMN IF NOT EXISTS marketplace_search_result_id UUID REFERENCES marketplace_search_results(id) ON DELETE SET NULL;

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_materials_client_request_item ON materials(client_request_item_id);
CREATE INDEX IF NOT EXISTS idx_material_quotations_marketplace_result ON material_quotations(marketplace_search_result_id);
