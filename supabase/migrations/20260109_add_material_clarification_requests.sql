-- Add clarification_requests column to materials table to track info requests
ALTER TABLE materials ADD COLUMN IF NOT EXISTS clarification_request JSONB DEFAULT NULL;

-- Structure of clarification_request:
-- {
--   "requested_at": "2024-01-09T10:00:00Z",
--   "requested_by": "admin-user-id",
--   "message": "Please provide more details and images",
--   "needs_images": true,
--   "needs_description": true,
--   "resolved_at": null
-- }

-- Add index for quick filtering of materials needing clarification
CREATE INDEX IF NOT EXISTS idx_materials_clarification ON materials ((clarification_request IS NOT NULL));

-- Add comment
COMMENT ON COLUMN materials.clarification_request IS 'Stores clarification request details when admin needs more info from client';
