-- Create supplier_requests table
CREATE TABLE IF NOT EXISTS supplier_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Request details
  request_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'in_progress', 'completed', 'cancelled')),
  num_suppliers INTEGER NOT NULL DEFAULT 1,
  
  -- Materials data (snapshot at time of request)
  materials_data JSONB NOT NULL,
  materials_translated_en JSONB,
  materials_translated_zh JSONB,
  
  -- Supplier responses
  supplier_responses JSONB DEFAULT '[]'::jsonb,
  
  -- Progress tracking
  total_materials INTEGER NOT NULL,
  filled_materials INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Public access
  public_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin notes
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create supplier_quotes table for individual supplier responses
CREATE TABLE IF NOT EXISTS supplier_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_request_id UUID NOT NULL REFERENCES supplier_requests(id) ON DELETE CASCADE,
  
  -- Supplier info
  supplier_name TEXT NOT NULL,
  supplier_email TEXT,
  supplier_company TEXT,
  supplier_country TEXT DEFAULT 'China',
  
  -- Quote data
  quoted_materials JSONB NOT NULL,
  total_quote_amount DECIMAL(15,2),
  currency TEXT DEFAULT 'CNY',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected')),
  
  -- Notes
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_supplier_requests_project ON supplier_requests(project_id);
CREATE INDEX idx_supplier_requests_user ON supplier_requests(user_id);
CREATE INDEX idx_supplier_requests_status ON supplier_requests(status);
CREATE INDEX idx_supplier_requests_token ON supplier_requests(public_token);
CREATE INDEX idx_supplier_quotes_request ON supplier_quotes(supplier_request_id);

-- Enable RLS
ALTER TABLE supplier_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supplier_requests
CREATE POLICY "Users can view their own supplier requests"
  ON supplier_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create supplier requests for their projects"
  ON supplier_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = supplier_requests.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own supplier requests"
  ON supplier_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Public access policy for supplier form
CREATE POLICY "Anyone can view supplier requests with valid token"
  ON supplier_requests FOR SELECT
  USING (
    public_token IS NOT NULL AND
    (expires_at IS NULL OR expires_at > NOW())
  );

-- RLS Policies for supplier_quotes
CREATE POLICY "Users can view quotes for their requests"
  ON supplier_quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM supplier_requests
      WHERE supplier_requests.id = supplier_quotes.supplier_request_id
      AND supplier_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create quotes with valid token"
  ON supplier_quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplier_requests
      WHERE supplier_requests.id = supplier_quotes.supplier_request_id
      AND supplier_requests.public_token IS NOT NULL
      AND (supplier_requests.expires_at IS NULL OR supplier_requests.expires_at > NOW())
    )
  );

CREATE POLICY "Anyone can update their own quotes"
  ON supplier_quotes FOR UPDATE
  USING (true);

-- Function to update progress
CREATE OR REPLACE FUNCTION update_supplier_request_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE supplier_requests
  SET 
    filled_materials = (
      SELECT COUNT(DISTINCT material_id)
      FROM jsonb_array_elements(NEW.quoted_materials) AS material
      WHERE (material->>'unit_price')::numeric > 0
    ),
    progress_percentage = (
      (SELECT COUNT(DISTINCT material_id)
       FROM jsonb_array_elements(NEW.quoted_materials) AS material
       WHERE (material->>'unit_price')::numeric > 0)::decimal 
      / NULLIF(total_materials, 0) * 100
    ),
    updated_at = NOW()
  WHERE id = NEW.supplier_request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update progress
CREATE TRIGGER trigger_update_progress
  AFTER INSERT OR UPDATE ON supplier_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_request_progress();

-- Function to generate request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  counter := (SELECT COUNT(*) FROM supplier_requests) + 1;
  new_number := 'SR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE supplier_requests IS 'Stores requests sent to Chinese suppliers for material quotations';
COMMENT ON TABLE supplier_quotes IS 'Stores individual supplier responses with quoted prices';
