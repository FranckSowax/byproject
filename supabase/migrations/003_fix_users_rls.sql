-- Migration: Fix users table RLS policies
-- Date: 2025-11-08
-- Description: Allow authenticated users to read basic user info from auth.users

-- Note: auth.users is a system table, we need to create a view or use auth.uid()
-- Instead, we'll modify material_comments policies to not require direct access to users table

-- Drop existing policies that might cause issues
DROP POLICY IF EXISTS "Collaborators can view comments" ON material_comments;
DROP POLICY IF EXISTS "Authenticated users can add comments" ON material_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON material_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON material_comments;

-- ============================================
-- RLS Policies: material_comments (Fixed)
-- ============================================

-- Anyone can view non-deleted comments (public read)
CREATE POLICY "Anyone can view comments"
  ON material_comments FOR SELECT
  USING (is_deleted = false);

-- Authenticated users can add comments
CREATE POLICY "Authenticated users can add comments"
  ON material_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON material_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can soft delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON material_comments FOR UPDATE
  USING (user_id = auth.uid() AND is_deleted = false)
  WITH CHECK (is_deleted = true);
