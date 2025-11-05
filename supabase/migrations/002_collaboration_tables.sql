-- Migration: Add collaboration tables
-- Date: 2025-11-05
-- Description: Creates material_comments, project_history, and project_collaborators tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: project_collaborators
-- ============================================
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, email)
);

-- ============================================
-- Table: material_comments
-- ============================================
CREATE TABLE IF NOT EXISTS material_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  comment TEXT NOT NULL,
  parent_id UUID REFERENCES material_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- ============================================
-- Table: project_history
-- ============================================
CREATE TABLE IF NOT EXISTS project_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'create', 'update', 'delete', 'share', 'unshare'
  entity_type TEXT NOT NULL, -- 'project', 'material', 'price', 'supplier', 'photo', 'comment'
  entity_id TEXT,
  entity_name TEXT,
  changes JSONB, -- Details of changes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_email ON project_collaborators(email);

CREATE INDEX IF NOT EXISTS idx_material_comments_material ON material_comments(material_id);
CREATE INDEX IF NOT EXISTS idx_material_comments_parent ON material_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_material_comments_created ON material_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_history_project ON project_history(project_id);
CREATE INDEX IF NOT EXISTS idx_project_history_created ON project_history(created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: project_collaborators
-- ============================================

-- Users can view collaborators of their projects
CREATE POLICY "Users can view collaborators of their projects"
  ON project_collaborators FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM project_collaborators 
      WHERE project_id = project_collaborators.project_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM projects 
      WHERE id = project_collaborators.project_id
    )
  );

-- Owners can add collaborators
CREATE POLICY "Owners can add collaborators"
  ON project_collaborators FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM projects 
      WHERE id = project_id
    )
  );

-- Owners can remove collaborators
CREATE POLICY "Owners can remove collaborators"
  ON project_collaborators FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM projects 
      WHERE id = project_id
    )
  );

-- Users can update their own collaboration status
CREATE POLICY "Users can update their own collaboration status"
  ON project_collaborators FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============================================
-- RLS Policies: material_comments
-- ============================================

-- Collaborators can view comments on materials in their projects
CREATE POLICY "Collaborators can view comments"
  ON material_comments FOR SELECT
  USING (
    material_id IN (
      SELECT m.id FROM materials m
      INNER JOIN projects p ON m.project_id = p.id
      WHERE p.user_id = auth.uid()
         OR p.id IN (
           SELECT project_id FROM project_collaborators
           WHERE user_id = auth.uid() AND status = 'accepted'
         )
    )
  );

-- Authenticated users can add comments (will be restricted by app logic)
CREATE POLICY "Authenticated users can add comments"
  ON material_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON material_comments FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON material_comments FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- RLS Policies: project_history
-- ============================================

-- Collaborators can view project history
CREATE POLICY "Collaborators can view project history"
  ON project_history FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM project_collaborators 
      WHERE project_id = project_history.project_id
      AND status = 'accepted'
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM projects 
      WHERE id = project_history.project_id
    )
  );

-- Authenticated users can create history entries
CREATE POLICY "Authenticated users can create history entries"
  ON project_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- Triggers and Functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_material_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.is_edited = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for material_comments updated_at
CREATE TRIGGER material_comments_updated_at
  BEFORE UPDATE ON material_comments
  FOR EACH ROW
  WHEN (OLD.comment IS DISTINCT FROM NEW.comment)
  EXECUTE FUNCTION update_material_comments_updated_at();

-- Function to log project changes automatically
CREATE OR REPLACE FUNCTION log_project_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_history (
    project_id,
    user_id,
    user_email,
    action_type,
    entity_type,
    entity_id,
    entity_name,
    changes
  )
  VALUES (
    COALESCE(NEW.project_id, OLD.project_id),
    auth.uid(),
    COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), 'system'),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'INSERT'
      WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
      WHEN TG_OP = 'DELETE' THEN 'DELETE'
    END,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    COALESCE(NEW.name, OLD.name),
    CASE
      WHEN TG_OP = 'UPDATE' THEN 
        jsonb_build_object(
          'old', to_jsonb(OLD),
          'new', to_jsonb(NEW)
        )
      WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic history logging
DROP TRIGGER IF EXISTS log_material_changes ON materials;
CREATE TRIGGER log_material_changes
  AFTER INSERT OR UPDATE OR DELETE ON materials
  FOR EACH ROW EXECUTE FUNCTION log_project_change();

DROP TRIGGER IF EXISTS log_price_changes ON prices;
CREATE TRIGGER log_price_changes
  AFTER INSERT OR UPDATE OR DELETE ON prices
  FOR EACH ROW EXECUTE FUNCTION log_project_change();

DROP TRIGGER IF EXISTS log_supplier_changes ON suppliers;
CREATE TRIGGER log_supplier_changes
  AFTER INSERT OR UPDATE OR DELETE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION log_project_change();

-- Function to get user project role
CREATE OR REPLACE FUNCTION get_user_project_role(p_project_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if owner
  SELECT 'owner' INTO v_role
  FROM projects
  WHERE id = p_project_id AND user_id = p_user_id;
  
  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;
  
  -- Check if collaborator
  SELECT role INTO v_role
  FROM project_collaborators
  WHERE project_id = p_project_id 
    AND user_id = p_user_id 
    AND status = 'accepted';
  
  RETURN COALESCE(v_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
