-- Add supplier_reference column to supplier_tokens for anonymous client-facing references
-- This reference will be shown to clients instead of actual supplier names

-- Add the column
ALTER TABLE supplier_tokens ADD COLUMN IF NOT EXISTS supplier_reference TEXT;

-- Create a function to generate unique supplier references
CREATE OR REPLACE FUNCTION generate_supplier_reference()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate format: REF-XXXX (4 alphanumeric characters)
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN 'REF-' || result;
END;
$$ LANGUAGE plpgsql;

-- Update existing records with references (if any without reference)
UPDATE supplier_tokens
SET supplier_reference = generate_supplier_reference()
WHERE supplier_reference IS NULL;

-- Create trigger to auto-generate reference on insert
CREATE OR REPLACE FUNCTION set_supplier_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.supplier_reference IS NULL THEN
    -- Generate unique reference, retry if collision
    LOOP
      NEW.supplier_reference := generate_supplier_reference();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM supplier_tokens WHERE supplier_reference = NEW.supplier_reference
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supplier_tokens_set_reference
  BEFORE INSERT ON supplier_tokens
  FOR EACH ROW
  EXECUTE FUNCTION set_supplier_reference();

-- Also add to supplier_quotes for legacy system
ALTER TABLE supplier_quotes ADD COLUMN IF NOT EXISTS supplier_reference TEXT;

-- Update legacy quotes with references
UPDATE supplier_quotes
SET supplier_reference = generate_supplier_reference()
WHERE supplier_reference IS NULL;

-- Create trigger for legacy table
CREATE OR REPLACE FUNCTION set_supplier_quote_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.supplier_reference IS NULL THEN
    LOOP
      NEW.supplier_reference := generate_supplier_reference();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM supplier_quotes WHERE supplier_reference = NEW.supplier_reference
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supplier_quotes_set_reference
  BEFORE INSERT ON supplier_quotes
  FOR EACH ROW
  EXECUTE FUNCTION set_supplier_quote_reference();

-- Add index for quick reference lookups
CREATE INDEX IF NOT EXISTS idx_supplier_tokens_reference ON supplier_tokens(supplier_reference);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_reference ON supplier_quotes(supplier_reference);

-- Comment
COMMENT ON COLUMN supplier_tokens.supplier_reference IS 'Anonymous reference ID shown to clients instead of supplier name';
COMMENT ON COLUMN supplier_quotes.supplier_reference IS 'Anonymous reference ID shown to clients instead of supplier name';
