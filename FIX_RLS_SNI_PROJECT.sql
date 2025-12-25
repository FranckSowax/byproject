-- ============================================
-- CORRECTION RLS POUR LE PROJET SNI
-- Date: 15 novembre 2025
-- Objectif: Permettre l'accès au projet SNI importé
-- ============================================

-- Étape 1: Supprimer toutes les anciennes politiques
-- ============================================

DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

-- Étape 2: Créer des politiques qui fonctionnent avec la table users
-- ============================================

-- SELECT: Les utilisateurs peuvent voir leurs propres projets
-- On vérifie que le user_id du projet correspond à l'utilisateur connecté
CREATE POLICY "projects_select_policy" 
ON projects 
FOR SELECT 
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- INSERT: Les utilisateurs peuvent créer des projets
CREATE POLICY "projects_insert_policy" 
ON projects 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- UPDATE: Les utilisateurs peuvent modifier leurs propres projets
CREATE POLICY "projects_update_policy" 
ON projects 
FOR UPDATE 
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- DELETE: Les utilisateurs peuvent supprimer leurs propres projets
CREATE POLICY "projects_delete_policy" 
ON projects 
FOR DELETE 
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- Étape 3: Politiques pour les matériaux
-- ============================================

DROP POLICY IF EXISTS "materials_select_policy" ON materials;
DROP POLICY IF EXISTS "materials_insert_policy" ON materials;
DROP POLICY IF EXISTS "materials_update_policy" ON materials;
DROP POLICY IF EXISTS "materials_delete_policy" ON materials;

-- SELECT: Les utilisateurs peuvent voir les matériaux de leurs projets
CREATE POLICY "materials_select_policy" 
ON materials 
FOR SELECT 
TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  )
);

-- INSERT: Les utilisateurs peuvent créer des matériaux dans leurs projets
CREATE POLICY "materials_insert_policy" 
ON materials 
FOR INSERT 
TO authenticated
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  )
);

-- UPDATE: Les utilisateurs peuvent modifier les matériaux de leurs projets
CREATE POLICY "materials_update_policy" 
ON materials 
FOR UPDATE 
TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  )
)
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  )
);

-- DELETE: Les utilisateurs peuvent supprimer les matériaux de leurs projets
CREATE POLICY "materials_delete_policy" 
ON materials 
FOR DELETE 
TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  )
);

-- Étape 4: Vérifier que RLS est activé
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Étape 5: Vérification
-- ============================================

-- Afficher toutes les politiques actives pour projects
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY cmd, policyname;

-- Afficher toutes les politiques actives pour materials
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'materials'
ORDER BY cmd, policyname;

-- Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('projects', 'materials');
