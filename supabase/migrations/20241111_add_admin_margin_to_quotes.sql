-- Add admin_margin and sent_to_client_at columns to supplier_quotes table
ALTER TABLE supplier_quotes 
ADD COLUMN IF NOT EXISTS admin_margin DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_to_client_at TIMESTAMP WITH TIME ZONE;

-- Update status check constraint to include 'sent_to_client'
ALTER TABLE supplier_quotes 
DROP CONSTRAINT IF EXISTS supplier_quotes_status_check;

ALTER TABLE supplier_quotes 
ADD CONSTRAINT supplier_quotes_status_check 
CHECK (status IN ('draft', 'submitted', 'sent_to_client', 'accepted', 'rejected'));

-- Add index for faster queries on sent_to_client_at
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_sent_to_client 
ON supplier_quotes(sent_to_client_at) 
WHERE sent_to_client_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN supplier_quotes.admin_margin IS 'Admin margin percentage applied before sending to client';
COMMENT ON COLUMN supplier_quotes.sent_to_client_at IS 'Timestamp when quote was sent to client with admin margin';
