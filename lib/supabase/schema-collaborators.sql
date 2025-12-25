-- Schema pour le système de collaboration

-- Table des collaborateurs de projet
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

-- Table de l'historique des modifications
CREATE TABLE IF NOT EXISTS project_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'share', 'unshare'
  entity_type TEXT NOT NULL, -- 'project', 'material', 'price', 'supplier', 'photo'
  entity_id TEXT,
  entity_name TEXT,
  changes JSONB, -- Détails des changements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_email ON project_collaborators(email);
CREATE INDEX IF NOT EXISTS idx_project_history_project ON project_history(project_id);
CREATE INDEX IF NOT EXISTS idx_project_history_created ON project_history(created_at DESC);

-- RLS Policies pour project_collaborators
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les collaborateurs des projets dont ils font partie
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

-- Les propriétaires peuvent ajouter des collaborateurs
CREATE POLICY "Owners can add collaborators"
  ON project_collaborators FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM projects 
      WHERE id = project_id
    )
  );

-- Les propriétaires peuvent supprimer des collaborateurs
CREATE POLICY "Owners can remove collaborators"
  ON project_collaborators FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM projects 
      WHERE id = project_id
    )
  );

-- Les collaborateurs peuvent accepter/décliner leur invitation
CREATE POLICY "Users can update their own collaboration status"
  ON project_collaborators FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS Policies pour project_history
ALTER TABLE project_history ENABLE ROW LEVEL SECURITY;

-- Les collaborateurs peuvent voir l'historique des projets dont ils font partie
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

-- Tous les utilisateurs authentifiés peuvent créer des entrées d'historique
CREATE POLICY "Authenticated users can create history entries"
  ON project_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Personne ne peut supprimer l'historique (non effaçable)
-- Pas de policy DELETE = pas de suppression possible

-- Fonction pour enregistrer automatiquement les modifications
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
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
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

-- Triggers pour enregistrer les modifications
CREATE TRIGGER log_material_changes
  AFTER INSERT OR UPDATE OR DELETE ON materials
  FOR EACH ROW EXECUTE FUNCTION log_project_change();

CREATE TRIGGER log_price_changes
  AFTER INSERT OR UPDATE OR DELETE ON prices
  FOR EACH ROW EXECUTE FUNCTION log_project_change();

CREATE TRIGGER log_supplier_changes
  AFTER INSERT OR UPDATE OR DELETE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION log_project_change();

-- Fonction pour obtenir les permissions d'un utilisateur sur un projet
CREATE OR REPLACE FUNCTION get_user_project_role(p_project_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Vérifier si c'est le propriétaire
  SELECT 'owner' INTO v_role
  FROM projects
  WHERE id = p_project_id AND user_id = p_user_id;
  
  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;
  
  -- Vérifier si c'est un collaborateur
  SELECT role INTO v_role
  FROM project_collaborators
  WHERE project_id = p_project_id 
    AND user_id = p_user_id 
    AND status = 'accepted';
  
  RETURN COALESCE(v_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
