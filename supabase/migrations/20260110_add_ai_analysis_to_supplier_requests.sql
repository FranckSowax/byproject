-- =====================================================
-- Add AI Analysis fields to supplier_requests
-- Tracks the AI verification status before sending to suppliers
-- =====================================================

-- Add AI analysis status to supplier_requests
ALTER TABLE supplier_requests
  ADD COLUMN IF NOT EXISTS ai_analysis_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_analysis_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_analysis_result JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS materials_needing_clarification INTEGER DEFAULT 0;

-- Add constraint for valid AI analysis statuses
-- pending: Not yet analyzed
-- analyzing: Currently being analyzed by AI
-- needs_clarification: Some materials need more info from client
-- ready: All materials have sufficient info, ready to send
-- sent_with_warnings: Sent despite some materials having incomplete info
ALTER TABLE supplier_requests
  DROP CONSTRAINT IF EXISTS valid_ai_analysis_status;

ALTER TABLE supplier_requests
  ADD CONSTRAINT valid_ai_analysis_status
  CHECK (ai_analysis_status IN ('pending', 'analyzing', 'needs_clarification', 'ready', 'sent_with_warnings'));

-- Add index for filtering by AI analysis status
CREATE INDEX IF NOT EXISTS idx_supplier_requests_ai_status ON supplier_requests(ai_analysis_status);

-- Update materials clarification_request structure to include AI-generated fields
COMMENT ON COLUMN materials.clarification_request IS
'Stores clarification request details. Structure:
{
  "requested_at": "2024-01-09T10:00:00Z",
  "requested_by": "ai" | "admin-user-id",
  "source": "ai_analysis" | "manual",
  "message": "Please provide more details",
  "missing_fields": ["dimensions", "material_type", "color"],
  "needs_images": true,
  "needs_description": true,
  "ai_suggestions": ["Add length, width, height", "Specify material (wood, metal, plastic)"],
  "resolved_at": null
}';

-- Add a view to easily see materials pending clarification
CREATE OR REPLACE VIEW materials_pending_clarification AS
SELECT
  m.id,
  m.name,
  m.project_id,
  m.clarification_request,
  m.clarification_request->>'requested_at' as requested_at,
  m.clarification_request->>'message' as message,
  m.clarification_request->'missing_fields' as missing_fields,
  (m.clarification_request->>'needs_images')::boolean as needs_images,
  p.name as project_name,
  p.user_id
FROM materials m
JOIN projects p ON m.project_id = p.id
WHERE m.clarification_request IS NOT NULL
  AND m.clarification_request->>'resolved_at' IS NULL;

COMMENT ON VIEW materials_pending_clarification IS 'Materials that have pending clarification requests from AI or admin';
