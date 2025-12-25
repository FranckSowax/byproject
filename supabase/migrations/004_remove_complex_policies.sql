-- Migration: Remove complex INSERT policies
-- Date: 2025-11-08
-- Description: Remove old policies with complex joins that caused 403 errors
-- Applied via: Supabase MCP

-- Issue: POST material_comments returned 403 Forbidden
-- Cause: Old complex policies with joins to auth.users table

-- Drop all old INSERT policies with complex joins
DROP POLICY IF EXISTS "Collaborators can add comments" ON material_comments;
DROP POLICY IF EXISTS "Users can delete their own comments or project owner can delete" ON material_comments;

-- Note: The simple "Authenticated users can add comments" policy is already correct
-- and was created in migration 003_fix_users_rls.sql

-- Final active policies on material_comments:
-- 1. Anyone can view comments (SELECT) - is_deleted = false
-- 2. Authenticated users can add comments (INSERT) - auth.uid() IS NOT NULL AND user_id = auth.uid()
-- 3. Users can update their own comments (UPDATE) - user_id = auth.uid()
-- 4. Users can delete their own comments (UPDATE) - soft delete with is_deleted = true
