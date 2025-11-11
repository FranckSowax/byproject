-- ============================================
-- CORRECTION FINALE DES POLITIQUES RLS
-- Date: 11 novembre 2025
-- Objectif: Supprimer toutes les références à auth.users
-- ============================================

-- Étape 1: Supprimer TOUTES les anciennes politiques
-- ============================================

DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Admins can update all projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete all projects" ON projects;
DROP POLICY IF EXISTS "allow_select_own_projects" ON projects;
DROP POLICY IF EXISTS "allow_insert_own_projects" ON projects;
DROP POLICY IF EXISTS "allow_update_own_projects" ON projects;
DROP POLICY IF EXISTS "allow_delete_own_projects" ON projects;
DROP POLICY IF EXISTS "allow_admin_all_projects" ON projects;

-- Étape 2: Créer des politiques SIMPLES et SÉCURISÉES
-- ============================================

-- SELECT: Les utilisateurs peuvent voir leurs propres projets
CREATE POLICY "projects_select_policy" 
ON projects 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Les utilisateurs peuvent créer des projets
CREATE POLICY "projects_insert_policy" 
ON projects 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Les utilisateurs peuvent modifier leurs propres projets
CREATE POLICY "projects_update_policy" 
ON projects 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Les utilisateurs peuvent supprimer leurs propres projets
CREATE POLICY "projects_delete_policy" 
ON projects 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- Étape 3: Vérifier que RLS est activé
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Étape 4: Vérification
-- ============================================

-- Afficher toutes les politiques actives
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY cmd, policyname;

-- Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'projects';
