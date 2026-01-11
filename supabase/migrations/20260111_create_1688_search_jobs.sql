-- Migration: Create 1688 search jobs table
-- This table stores background search jobs for 1688.com product searches

-- Create enum for job status
CREATE TYPE search_job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- Create the search jobs table
CREATE TABLE IF NOT EXISTS search_jobs_1688 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Job identification
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    supplier_request_id UUID REFERENCES supplier_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Job status
    status search_job_status NOT NULL DEFAULT 'pending',

    -- Search parameters
    search_terms JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of search terms
    options JSONB DEFAULT '{}'::jsonb, -- Search options (maxResults, etc.)

    -- Progress tracking
    total_terms INTEGER NOT NULL DEFAULT 0,
    completed_terms INTEGER NOT NULL DEFAULT 0,
    failed_terms INTEGER NOT NULL DEFAULT 0,
    current_term TEXT,

    -- Results storage
    results JSONB DEFAULT '[]'::jsonb, -- Array of SearchResult1688

    -- Error tracking
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_search_jobs_1688_project ON search_jobs_1688(project_id);
CREATE INDEX idx_search_jobs_1688_supplier_request ON search_jobs_1688(supplier_request_id);
CREATE INDEX idx_search_jobs_1688_user ON search_jobs_1688(user_id);
CREATE INDEX idx_search_jobs_1688_status ON search_jobs_1688(status);
CREATE INDEX idx_search_jobs_1688_created ON search_jobs_1688(created_at DESC);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_search_jobs_1688_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_search_jobs_1688_updated_at
    BEFORE UPDATE ON search_jobs_1688
    FOR EACH ROW
    EXECUTE FUNCTION update_search_jobs_1688_updated_at();

-- RLS policies
ALTER TABLE search_jobs_1688 ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access to search_jobs_1688"
    ON search_jobs_1688
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() AND r.name = 'Admin'
        )
    );

-- Users can view their own jobs
CREATE POLICY "Users can view own search_jobs_1688"
    ON search_jobs_1688
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Service role can do everything (for background functions)
CREATE POLICY "Service role full access to search_jobs_1688"
    ON search_jobs_1688
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comment
COMMENT ON TABLE search_jobs_1688 IS 'Stores background search jobs for 1688.com product searches';
