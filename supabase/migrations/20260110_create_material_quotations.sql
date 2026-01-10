-- =====================================================
-- Material Quotations Table
-- Stores historical price quotations per material from suppliers
-- =====================================================

-- Create material_quotations table
CREATE TABLE IF NOT EXISTS material_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to the material (by name since materials can be across projects)
  material_name TEXT NOT NULL,
  material_category TEXT,

  -- Original material reference (if from a specific project)
  original_material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Supplier information
  supplier_email TEXT NOT NULL,
  supplier_company TEXT,
  supplier_name TEXT,
  supplier_country TEXT,
  supplier_phone TEXT,
  supplier_whatsapp TEXT,
  supplier_wechat TEXT,
  supplier_reference TEXT, -- Anonymous reference for client (e.g., REF-A1B2)

  -- Price information
  unit_price NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  unit TEXT, -- e.g., 'piece', 'kg', 'm2', etc.
  min_quantity INTEGER,
  max_quantity INTEGER,
  moq INTEGER, -- Minimum Order Quantity

  -- Price variations (for different quantities/specs)
  variations JSONB DEFAULT '[]',

  -- Converted price for comparison
  converted_price_fcfa NUMERIC(15,2),
  exchange_rate_used NUMERIC(10,4),

  -- Source tracking
  source_type TEXT NOT NULL DEFAULT 'quotation', -- 'quotation', 'manual', 'import'
  source_quote_id UUID, -- Reference to supplier_quotes or supplier_tokens
  source_request_id UUID REFERENCES supplier_requests(id) ON DELETE SET NULL,

  -- Status and validity
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'superseded'
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  -- Additional info
  specifications JSONB DEFAULT '{}', -- Material specifications from quote
  notes TEXT,
  images TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_price CHECK (unit_price >= 0),
  CONSTRAINT valid_currency CHECK (currency IN ('CNY', 'USD', 'EUR', 'FCFA', 'XAF'))
);

-- Create indexes for efficient querying
CREATE INDEX idx_material_quotations_name ON material_quotations(material_name);
CREATE INDEX idx_material_quotations_supplier ON material_quotations(supplier_email);
CREATE INDEX idx_material_quotations_country ON material_quotations(supplier_country);
CREATE INDEX idx_material_quotations_category ON material_quotations(material_category);
CREATE INDEX idx_material_quotations_status ON material_quotations(status);
CREATE INDEX idx_material_quotations_created ON material_quotations(created_at DESC);
CREATE INDEX idx_material_quotations_price ON material_quotations(unit_price);

-- Full text search on material name
CREATE INDEX idx_material_quotations_name_search ON material_quotations USING gin(to_tsvector('french', material_name));

-- Composite index for common queries
CREATE INDEX idx_material_quotations_name_country ON material_quotations(material_name, supplier_country);
CREATE INDEX idx_material_quotations_name_price ON material_quotations(material_name, unit_price);
CREATE INDEX idx_material_quotations_reference ON material_quotations(supplier_reference);

-- Enable RLS
ALTER TABLE material_quotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can manage all material quotations
CREATE POLICY "Admins can manage material quotations"
  ON material_quotations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

-- Service role has full access (for API routes)
CREATE POLICY "Service role full access to material quotations"
  ON material_quotations FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can view quotations for their project materials
CREATE POLICY "Users can view their project material quotations"
  ON material_quotations FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_material_quotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_material_quotations_timestamp
  BEFORE UPDATE ON material_quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_material_quotations_updated_at();

-- =====================================================
-- Supplier Price History View
-- Aggregated view of supplier pricing per material
-- =====================================================

CREATE OR REPLACE VIEW supplier_material_prices AS
SELECT
  material_name,
  material_category,
  supplier_email,
  supplier_company,
  supplier_country,
  COUNT(*) as quotation_count,
  AVG(unit_price) as avg_price,
  MIN(unit_price) as min_price,
  MAX(unit_price) as max_price,
  MODE() WITHIN GROUP (ORDER BY currency) as most_common_currency,
  MAX(created_at) as last_quotation_date,
  MIN(created_at) as first_quotation_date
FROM material_quotations
WHERE status = 'active'
GROUP BY
  material_name,
  material_category,
  supplier_email,
  supplier_company,
  supplier_country;

-- =====================================================
-- Material Price Comparison View
-- Compare prices across suppliers for same materials
-- =====================================================

CREATE OR REPLACE VIEW material_price_comparison AS
SELECT
  material_name,
  material_category,
  COUNT(DISTINCT supplier_email) as supplier_count,
  COUNT(*) as total_quotations,
  AVG(unit_price) as avg_price,
  MIN(unit_price) as lowest_price,
  MAX(unit_price) as highest_price,
  STDDEV(unit_price) as price_stddev,
  MODE() WITHIN GROUP (ORDER BY currency) as most_common_currency,
  AVG(converted_price_fcfa) as avg_price_fcfa,
  MIN(converted_price_fcfa) as lowest_price_fcfa,
  MAX(converted_price_fcfa) as highest_price_fcfa
FROM material_quotations
WHERE status = 'active'
GROUP BY material_name, material_category
HAVING COUNT(*) > 0
ORDER BY material_name;

-- Comment on table
COMMENT ON TABLE material_quotations IS 'Historical database of material price quotations from suppliers';
COMMENT ON VIEW supplier_material_prices IS 'Aggregated supplier pricing statistics per material';
COMMENT ON VIEW material_price_comparison IS 'Price comparison across suppliers for materials';
