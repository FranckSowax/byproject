-- ============================================
-- CORRECTION RLS SIMPLE - ACCÈS COMPLET
-- Date: 15 novembre 2025
-- Objectif: Permettre l'accès complet aux projets et matériaux
-- ============================================

-- OPTION 1: Désactiver RLS temporairement (pour développement)
-- ============================================
-- Décommenter ces lignes pour désactiver RLS complètement

-- ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE prices DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE photos DISABLE ROW LEVEL SECURITY;


-- OPTION 2: Créer des policies permissives (RECOMMANDÉ)
-- ============================================

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;
DROP POLICY IF EXISTS "materials_select_policy" ON materials;
DROP POLICY IF EXISTS "materials_insert_policy" ON materials;
DROP POLICY IF EXISTS "materials_update_policy" ON materials;
DROP POLICY IF EXISTS "materials_delete_policy" ON materials;

-- PROJECTS: Accès complet pour tous les utilisateurs authentifiés
CREATE POLICY "projects_select_all" 
ON projects 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "projects_insert_all" 
ON projects 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "projects_update_all" 
ON projects 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "projects_delete_all" 
ON projects 
FOR DELETE 
TO authenticated
USING (true);

-- MATERIALS: Accès complet pour tous les utilisateurs authentifiés
CREATE POLICY "materials_select_all" 
ON materials 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "materials_insert_all" 
ON materials 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "materials_update_all" 
ON materials 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "materials_delete_all" 
ON materials 
FOR DELETE 
TO authenticated
USING (true);

-- PRICES: Accès complet
DROP POLICY IF EXISTS "prices_select_all" ON prices;
DROP POLICY IF EXISTS "prices_insert_all" ON prices;
DROP POLICY IF EXISTS "prices_update_all" ON prices;
DROP POLICY IF EXISTS "prices_delete_all" ON prices;

CREATE POLICY "prices_select_all" 
ON prices 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "prices_insert_all" 
ON prices 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "prices_update_all" 
ON prices 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "prices_delete_all" 
ON prices 
FOR DELETE 
TO authenticated
USING (true);

-- SUPPLIERS: Accès complet
DROP POLICY IF EXISTS "suppliers_select_all" ON suppliers;
DROP POLICY IF EXISTS "suppliers_insert_all" ON suppliers;
DROP POLICY IF EXISTS "suppliers_update_all" ON suppliers;
DROP POLICY IF EXISTS "suppliers_delete_all" ON suppliers;

CREATE POLICY "suppliers_select_all" 
ON suppliers 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "suppliers_insert_all" 
ON suppliers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "suppliers_update_all" 
ON suppliers 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "suppliers_delete_all" 
ON suppliers 
FOR DELETE 
TO authenticated
USING (true);

-- PHOTOS: Accès complet
DROP POLICY IF EXISTS "photos_select_all" ON photos;
DROP POLICY IF EXISTS "photos_insert_all" ON photos;
DROP POLICY IF EXISTS "photos_update_all" ON photos;
DROP POLICY IF EXISTS "photos_delete_all" ON photos;

CREATE POLICY "photos_select_all" 
ON photos 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "photos_insert_all" 
ON photos 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "photos_update_all" 
ON photos 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "photos_delete_all" 
ON photos 
FOR DELETE 
TO authenticated
USING (true);

-- COLUMN_MAPPINGS: Accès complet
DROP POLICY IF EXISTS "column_mappings_select_all" ON column_mappings;
DROP POLICY IF EXISTS "column_mappings_insert_all" ON column_mappings;
DROP POLICY IF EXISTS "column_mappings_update_all" ON column_mappings;
DROP POLICY IF EXISTS "column_mappings_delete_all" ON column_mappings;

CREATE POLICY "column_mappings_select_all" 
ON column_mappings 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "column_mappings_insert_all" 
ON column_mappings 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "column_mappings_update_all" 
ON column_mappings 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "column_mappings_delete_all" 
ON column_mappings 
FOR DELETE 
TO authenticated
USING (true);

-- Vérifier que RLS est activé
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE column_mappings ENABLE ROW LEVEL SECURITY;

-- Vérification
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('projects', 'materials', 'prices', 'suppliers', 'photos', 'column_mappings')
ORDER BY tablename, cmd, policyname;
