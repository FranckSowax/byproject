-- =====================================================
-- Migration: Ajout des Secteurs d'Activité
-- Date: 2025-11-29
-- Description: Transformation de ByProject en plateforme 
--              de sourcing universelle multi-secteurs
-- =====================================================

-- 1. Créer la table des secteurs d'activité
CREATE TABLE IF NOT EXISTS sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  default_categories JSONB DEFAULT '[]'::jsonb,
  item_label TEXT DEFAULT 'Article',
  item_label_plural TEXT DEFAULT 'Articles',
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ajouter les secteurs par défaut
INSERT INTO sectors (name, slug, icon, description, default_categories, item_label, item_label_plural, color, sort_order) VALUES
  (
    'Construction & BTP',
    'construction',
    'building-2',
    'Matériaux de construction, outillage, équipements de chantier',
    '["Gros œuvre", "Second œuvre", "Électricité", "Plomberie", "Menuiserie", "Peinture", "Outillage", "Sécurité"]'::jsonb,
    'Matériau',
    'Matériaux',
    '#f59e0b',
    1
  ),
  (
    'Hôtellerie',
    'hotellerie',
    'hotel',
    'Équipements hôteliers, literie, mobilier de chambre, amenities',
    '["Literie", "Mobilier chambre", "Salle de bain", "Amenities", "Linge", "Décoration", "Électroménager", "Signalétique"]'::jsonb,
    'Article',
    'Articles',
    '#8b5cf6',
    2
  ),
  (
    'Restauration',
    'restauration',
    'utensils',
    'Cuisine professionnelle, vaisselle, mobilier de restaurant',
    '["Cuisine pro", "Vaisselle", "Couverts", "Mobilier salle", "Équipement froid", "Équipement chaud", "Petit matériel", "Hygiène"]'::jsonb,
    'Article',
    'Articles',
    '#ef4444',
    3
  ),
  (
    'Commerce & Retail',
    'retail',
    'store',
    'Présentoirs, PLV, packaging, équipements de magasin',
    '["Présentoirs", "PLV", "Packaging", "Caisses", "Étagères", "Mannequins", "Éclairage", "Sécurité"]'::jsonb,
    'Article',
    'Articles',
    '#10b981',
    4
  ),
  (
    'Mobilier de Bureau',
    'bureau',
    'briefcase',
    'Bureaux, chaises, rangements, équipements de bureau',
    '["Bureaux", "Sièges", "Rangements", "Salles de réunion", "Accueil", "Cloisons", "Éclairage", "Accessoires"]'::jsonb,
    'Article',
    'Articles',
    '#3b82f6',
    5
  ),
  (
    'Médical & Santé',
    'medical',
    'heart-pulse',
    'Équipements médicaux, consommables, mobilier médical',
    '["Diagnostic", "Mobilier médical", "Consommables", "Protection", "Stérilisation", "Laboratoire", "Rééducation", "Imagerie"]'::jsonb,
    'Équipement',
    'Équipements',
    '#06b6d4',
    6
  ),
  (
    'Événementiel',
    'evenementiel',
    'party-popper',
    'Stands, décoration événementielle, signalétique, mobilier événementiel',
    '["Stands", "Mobilier événementiel", "Décoration", "Signalétique", "Éclairage", "Sonorisation", "Tentes", "Accessoires"]'::jsonb,
    'Article',
    'Articles',
    '#ec4899',
    7
  ),
  (
    'Autre',
    'autre',
    'package',
    'Autres secteurs d''activité et projets personnalisés',
    '["Général", "Électronique", "Textile", "Cosmétique", "Alimentaire", "Industriel", "Agricole", "Divers"]'::jsonb,
    'Article',
    'Articles',
    '#6b7280',
    99
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. Ajouter la colonne sector_id à la table projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES sectors(id);

-- 4. Ajouter les colonnes budget et délai à projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS estimated_budget DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS budget_currency TEXT DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS target_date DATE,
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'sourcing';

-- 5. Créer un index pour les recherches par secteur
CREATE INDEX IF NOT EXISTS idx_projects_sector_id ON projects(sector_id);
CREATE INDEX IF NOT EXISTS idx_sectors_slug ON sectors(slug);
CREATE INDEX IF NOT EXISTS idx_sectors_is_active ON sectors(is_active);

-- 6. Activer RLS sur la table sectors
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;

-- 7. Politique RLS: Tout le monde peut lire les secteurs actifs
CREATE POLICY "allow_read_active_sectors" ON sectors
  FOR SELECT
  USING (is_active = true);

-- 8. Politique RLS: Seuls les admins peuvent modifier les secteurs
CREATE POLICY "allow_admin_manage_sectors" ON sectors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 9. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_sectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_sectors_updated_at ON sectors;
CREATE TRIGGER trigger_sectors_updated_at
  BEFORE UPDATE ON sectors
  FOR EACH ROW
  EXECUTE FUNCTION update_sectors_updated_at();

-- 11. Migrer les projets existants vers le secteur "Construction" par défaut
UPDATE projects 
SET sector_id = (SELECT id FROM sectors WHERE slug = 'construction')
WHERE sector_id IS NULL;

-- =====================================================
-- Vérification
-- =====================================================
-- SELECT * FROM sectors ORDER BY sort_order;
-- SELECT id, name, sector_id FROM projects;
