-- =====================================================
-- ROLES & PERMISSIONS SYSTEM
-- =====================================================
-- This migration creates a comprehensive role-based access control system
-- with predefined roles: admin, client, collaborator, supplier

-- =====================================================
-- 1. CREATE ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 0, -- Higher level = more permissions
  is_system BOOLEAN DEFAULT false, -- System roles cannot be deleted
  color VARCHAR(20) DEFAULT 'gray',
  icon VARCHAR(50) DEFAULT 'shield',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE PERMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- projects, materials, users, etc.
  action VARCHAR(50) NOT NULL, -- create, read, update, delete, manage
  resource VARCHAR(50) NOT NULL, -- projects, materials, users, etc.
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE ROLE_PERMISSIONS JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(role_id, permission_id)
);

-- =====================================================
-- 4. CREATE USER_ROLES TABLE (for custom role assignments)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, role_id)
);

-- =====================================================
-- 5. CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_level ON public.roles(level);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);

-- =====================================================
-- 6. INSERT DEFAULT ROLES
-- =====================================================
INSERT INTO public.roles (name, display_name, description, level, is_system, color, icon) VALUES
  ('admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités du système', 100, true, 'red', 'shield-check'),
  ('client', 'Client', 'Peut créer et gérer ses propres projets', 50, true, 'blue', 'user'),
  ('collaborator', 'Collaborateur', 'Peut collaborer sur des projets partagés', 30, true, 'green', 'users'),
  ('supplier', 'Fournisseur', 'Peut soumettre des cotations et gérer son profil', 20, true, 'purple', 'package')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 7. INSERT DEFAULT PERMISSIONS
-- =====================================================

-- Project Permissions
INSERT INTO public.permissions (name, display_name, description, category, action, resource, is_system) VALUES
  ('projects.create', 'Créer des projets', 'Peut créer de nouveaux projets', 'projects', 'create', 'projects', true),
  ('projects.read.own', 'Voir ses projets', 'Peut voir ses propres projets', 'projects', 'read', 'projects', true),
  ('projects.read.all', 'Voir tous les projets', 'Peut voir tous les projets du système', 'projects', 'read', 'projects', true),
  ('projects.update.own', 'Modifier ses projets', 'Peut modifier ses propres projets', 'projects', 'update', 'projects', true),
  ('projects.update.all', 'Modifier tous les projets', 'Peut modifier tous les projets', 'projects', 'update', 'projects', true),
  ('projects.delete.own', 'Supprimer ses projets', 'Peut supprimer ses propres projets', 'projects', 'delete', 'projects', true),
  ('projects.delete.all', 'Supprimer tous les projets', 'Peut supprimer tous les projets', 'projects', 'delete', 'projects', true),
  ('projects.collaborate', 'Collaborer sur projets', 'Peut être invité comme collaborateur', 'projects', 'collaborate', 'projects', true),

-- Material Permissions
  ('materials.create', 'Créer des matériaux', 'Peut ajouter des matériaux aux projets', 'materials', 'create', 'materials', true),
  ('materials.read', 'Voir les matériaux', 'Peut consulter les matériaux', 'materials', 'read', 'materials', true),
  ('materials.update', 'Modifier les matériaux', 'Peut modifier les matériaux', 'materials', 'update', 'materials', true),
  ('materials.delete', 'Supprimer les matériaux', 'Peut supprimer les matériaux', 'materials', 'delete', 'materials', true),

-- Price/Quotation Permissions
  ('prices.create', 'Créer des prix', 'Peut ajouter des prix aux matériaux', 'prices', 'create', 'prices', true),
  ('prices.read', 'Voir les prix', 'Peut consulter les prix', 'prices', 'read', 'prices', true),
  ('prices.update', 'Modifier les prix', 'Peut modifier les prix', 'prices', 'update', 'prices', true),
  ('prices.delete', 'Supprimer les prix', 'Peut supprimer les prix', 'prices', 'delete', 'prices', true),

-- Quotation Permissions (for suppliers)
  ('quotations.submit', 'Soumettre des cotations', 'Peut soumettre des cotations', 'quotations', 'create', 'quotations', true),
  ('quotations.read.own', 'Voir ses cotations', 'Peut voir ses propres cotations', 'quotations', 'read', 'quotations', true),
  ('quotations.read.all', 'Voir toutes les cotations', 'Peut voir toutes les cotations', 'quotations', 'read', 'quotations', true),
  ('quotations.manage', 'Gérer les cotations', 'Peut gérer toutes les cotations', 'quotations', 'manage', 'quotations', true),

-- User Management Permissions
  ('users.read', 'Voir les utilisateurs', 'Peut consulter la liste des utilisateurs', 'users', 'read', 'users', true),
  ('users.create', 'Créer des utilisateurs', 'Peut créer de nouveaux utilisateurs', 'users', 'create', 'users', true),
  ('users.update', 'Modifier les utilisateurs', 'Peut modifier les utilisateurs', 'users', 'update', 'users', true),
  ('users.delete', 'Supprimer les utilisateurs', 'Peut supprimer les utilisateurs', 'users', 'delete', 'users', true),
  ('users.manage.roles', 'Gérer les rôles', 'Peut assigner des rôles aux utilisateurs', 'users', 'manage', 'roles', true),

-- Supplier Management Permissions
  ('suppliers.read', 'Voir les fournisseurs', 'Peut consulter les fournisseurs', 'suppliers', 'read', 'suppliers', true),
  ('suppliers.create', 'Créer des fournisseurs', 'Peut créer des fournisseurs', 'suppliers', 'create', 'suppliers', true),
  ('suppliers.update', 'Modifier les fournisseurs', 'Peut modifier les fournisseurs', 'suppliers', 'update', 'suppliers', true),
  ('suppliers.delete', 'Supprimer les fournisseurs', 'Peut supprimer les fournisseurs', 'suppliers', 'delete', 'suppliers', true),
  ('suppliers.manage.profile', 'Gérer son profil fournisseur', 'Peut gérer son propre profil fournisseur', 'suppliers', 'manage', 'suppliers', true),

-- Template Permissions
  ('templates.read', 'Voir les templates', 'Peut consulter les templates', 'templates', 'read', 'templates', true),
  ('templates.create', 'Créer des templates', 'Peut créer des templates', 'templates', 'create', 'templates', true),
  ('templates.update', 'Modifier les templates', 'Peut modifier les templates', 'templates', 'update', 'templates', true),
  ('templates.delete', 'Supprimer les templates', 'Peut supprimer les templates', 'templates', 'delete', 'templates', true),

-- System/Admin Permissions
  ('system.settings', 'Paramètres système', 'Peut modifier les paramètres système', 'system', 'manage', 'settings', true),
  ('system.analytics', 'Voir les analytics', 'Peut consulter les analytics', 'system', 'read', 'analytics', true),
  ('system.logs', 'Voir les logs', 'Peut consulter les logs système', 'system', 'read', 'logs', true),
  ('system.database', 'Gérer la base de données', 'Peut gérer la base de données', 'system', 'manage', 'database', true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 8. ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- Get role IDs
DO $$
DECLARE
  admin_role_id UUID;
  client_role_id UUID;
  collaborator_role_id UUID;
  supplier_role_id UUID;
BEGIN
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
  SELECT id INTO client_role_id FROM public.roles WHERE name = 'client';
  SELECT id INTO collaborator_role_id FROM public.roles WHERE name = 'collaborator';
  SELECT id INTO supplier_role_id FROM public.roles WHERE name = 'supplier';

  -- ADMIN: All permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT admin_role_id, id FROM public.permissions
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- CLIENT: Project and material management
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT client_role_id, id FROM public.permissions WHERE name IN (
    'projects.create',
    'projects.read.own',
    'projects.update.own',
    'projects.delete.own',
    'projects.collaborate',
    'materials.create',
    'materials.read',
    'materials.update',
    'materials.delete',
    'prices.read',
    'quotations.read.own',
    'templates.read',
    'suppliers.read'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- COLLABORATOR: Limited project access
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT collaborator_role_id, id FROM public.permissions WHERE name IN (
    'projects.read.own',
    'projects.collaborate',
    'materials.read',
    'materials.create',
    'materials.update',
    'prices.read',
    'templates.read'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- SUPPLIER: Quotation and profile management
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT supplier_role_id, id FROM public.permissions WHERE name IN (
    'quotations.submit',
    'quotations.read.own',
    'suppliers.manage.profile',
    'materials.read',
    'prices.read'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

-- =====================================================
-- 9. CREATE UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Roles policies
CREATE POLICY "Roles are viewable by everyone" ON public.roles
  FOR SELECT USING (true);

CREATE POLICY "Roles are manageable by admins" ON public.roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Permissions policies
CREATE POLICY "Permissions are viewable by everyone" ON public.permissions
  FOR SELECT USING (true);

CREATE POLICY "Permissions are manageable by admins" ON public.permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Role_permissions policies
CREATE POLICY "Role permissions are viewable by everyone" ON public.role_permissions
  FOR SELECT USING (true);

CREATE POLICY "Role permissions are manageable by admins" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- User_roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- 11. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_id UUID,
  permission_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  -- Check via user_roles
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_id
    AND p.name = permission_name
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS TABLE (
  permission_name VARCHAR,
  permission_display_name VARCHAR,
  category VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.display_name, p.category
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role_id = rp.role_id
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = user_id
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
