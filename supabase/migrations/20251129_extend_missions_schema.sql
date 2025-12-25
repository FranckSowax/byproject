-- Extension du schéma missions pour le suivi complet des projets délégation
-- Cette migration ajoute les tables nécessaires pour:
-- 1. Les matériaux/fournitures de la mission
-- 2. Les demandes de cotation
-- 3. Les étapes de suivi de mission
-- 4. Les documents de mission

-- 1. Table des Matériaux/Fournitures de Mission
CREATE TABLE IF NOT EXISTS mission_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    
    -- Informations du matériau
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    quantity DECIMAL(12,2),
    unit TEXT DEFAULT 'unité',
    
    -- Spécifications techniques
    specifications JSONB DEFAULT '{}'::jsonb,
    
    -- Images et documents
    images TEXT[] DEFAULT '{}',
    documents TEXT[] DEFAULT '{}',
    
    -- Statut
    status TEXT DEFAULT 'pending', -- 'pending', 'quoted', 'ordered', 'delivered'
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- Prix et fournisseur sélectionné
    selected_price_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Prix/Cotations pour les matériaux de mission
CREATE TABLE IF NOT EXISTS mission_material_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES mission_materials(id) ON DELETE CASCADE,
    
    -- Informations fournisseur
    supplier_name TEXT NOT NULL,
    supplier_country TEXT,
    supplier_contact JSONB DEFAULT '{}'::jsonb, -- {name, phone, email, wechat, whatsapp}
    
    -- Prix
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'CNY',
    unit_price DECIMAL(12,2),
    
    -- Détails
    lead_time_days INTEGER,
    minimum_order_quantity DECIMAL(12,2),
    notes TEXT,
    
    -- Documents (devis, photos produit)
    documents TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    
    -- Statut
    status TEXT DEFAULT 'received', -- 'received', 'under_review', 'accepted', 'rejected'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Étapes de Mission (Timeline/Suivi)
CREATE TABLE IF NOT EXISTS mission_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    
    -- Informations de l'étape
    title TEXT NOT NULL,
    description TEXT,
    step_type TEXT NOT NULL, -- 'preparation', 'sourcing', 'quotation', 'validation', 'order', 'production', 'quality_control', 'shipping', 'delivery', 'completion'
    step_order INTEGER NOT NULL,
    
    -- Dates
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Statut
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked', 'skipped'
    completion_percentage INTEGER DEFAULT 0,
    
    -- Notes et documents
    notes TEXT,
    documents TEXT[] DEFAULT '{}',
    
    -- Responsable
    assigned_to TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des Documents de Mission
CREATE TABLE IF NOT EXISTS mission_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    
    -- Informations du document
    name TEXT NOT NULL,
    document_type TEXT NOT NULL, -- 'contract', 'invoice', 'proforma', 'packing_list', 'bill_of_lading', 'certificate', 'photo', 'report', 'other'
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    
    -- Métadonnées
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Lien optionnel vers un matériau ou une étape
    linked_material_id UUID REFERENCES mission_materials(id),
    linked_step_id UUID REFERENCES mission_steps(id),
    
    -- Qui a uploadé
    uploaded_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table des Demandes de Cotation (RFQ - Request for Quotation)
CREATE TABLE IF NOT EXISTS mission_rfqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    
    -- Informations de la demande
    title TEXT NOT NULL,
    description TEXT,
    
    -- Matériaux inclus dans cette demande
    material_ids UUID[] DEFAULT '{}',
    
    -- Dates
    sent_at TIMESTAMPTZ,
    deadline DATE,
    
    -- Destinataires (fournisseurs)
    recipients JSONB DEFAULT '[]'::jsonb, -- [{name, email, phone, country, status}]
    
    -- Statut
    status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'responses_received', 'closed'
    
    -- Token pour accès fournisseur (comme supplier-quote)
    access_token TEXT UNIQUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Ajouter des colonnes à la table missions existante
ALTER TABLE missions ADD COLUMN IF NOT EXISTS sector TEXT; -- 'btp', 'hotel', 'medical', 'retail', etc.
ALTER TABLE missions ADD COLUMN IF NOT EXISTS total_budget DECIMAL(15,2);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS spent_budget DECIMAL(15,2) DEFAULT 0;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS current_step_id UUID;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_mission_materials_mission_id ON mission_materials(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_materials_status ON mission_materials(status);
CREATE INDEX IF NOT EXISTS idx_mission_material_prices_material_id ON mission_material_prices(material_id);
CREATE INDEX IF NOT EXISTS idx_mission_steps_mission_id ON mission_steps(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_steps_status ON mission_steps(status);
CREATE INDEX IF NOT EXISTS idx_mission_documents_mission_id ON mission_documents(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_rfqs_mission_id ON mission_rfqs(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_rfqs_access_token ON mission_rfqs(access_token);

-- RLS Policies

-- Mission Materials
ALTER TABLE mission_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view materials of their missions" 
    ON mission_materials FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM missions WHERE missions.id = mission_materials.mission_id AND missions.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage materials of their missions" 
    ON mission_materials FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM missions WHERE missions.id = mission_materials.mission_id AND missions.user_id = auth.uid()
    ));

-- Mission Material Prices
ALTER TABLE mission_material_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prices of their mission materials" 
    ON mission_material_prices FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM mission_materials mm
        JOIN missions m ON m.id = mm.mission_id
        WHERE mm.id = mission_material_prices.material_id AND m.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage prices of their mission materials" 
    ON mission_material_prices FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM mission_materials mm
        JOIN missions m ON m.id = mm.mission_id
        WHERE mm.id = mission_material_prices.material_id AND m.user_id = auth.uid()
    ));

-- Mission Steps
ALTER TABLE mission_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view steps of their missions" 
    ON mission_steps FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM missions WHERE missions.id = mission_steps.mission_id AND missions.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage steps of their missions" 
    ON mission_steps FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM missions WHERE missions.id = mission_steps.mission_id AND missions.user_id = auth.uid()
    ));

-- Mission Documents
ALTER TABLE mission_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents of their missions" 
    ON mission_documents FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM missions WHERE missions.id = mission_documents.mission_id AND missions.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage documents of their missions" 
    ON mission_documents FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM missions WHERE missions.id = mission_documents.mission_id AND missions.user_id = auth.uid()
    ));

-- Mission RFQs
ALTER TABLE mission_rfqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view RFQs of their missions" 
    ON mission_rfqs FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM missions WHERE missions.id = mission_rfqs.mission_id AND missions.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage RFQs of their missions" 
    ON mission_rfqs FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM missions WHERE missions.id = mission_rfqs.mission_id AND missions.user_id = auth.uid()
    ));

-- Triggers pour updated_at
CREATE TRIGGER update_mission_materials_updated_at
    BEFORE UPDATE ON mission_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mission_steps_updated_at
    BEFORE UPDATE ON mission_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mission_rfqs_updated_at
    BEFORE UPDATE ON mission_rfqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer les étapes par défaut d'une mission
CREATE OR REPLACE FUNCTION create_default_mission_steps(p_mission_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO mission_steps (mission_id, title, description, step_type, step_order) VALUES
    (p_mission_id, 'Préparation', 'Définition des besoins et spécifications', 'preparation', 1),
    (p_mission_id, 'Sourcing', 'Recherche et identification des fournisseurs', 'sourcing', 2),
    (p_mission_id, 'Cotation', 'Collecte et comparaison des devis', 'quotation', 3),
    (p_mission_id, 'Validation', 'Validation des choix et négociation finale', 'validation', 4),
    (p_mission_id, 'Commande', 'Passation des commandes', 'order', 5),
    (p_mission_id, 'Production', 'Suivi de la production', 'production', 6),
    (p_mission_id, 'Contrôle Qualité', 'Inspection et validation qualité', 'quality_control', 7),
    (p_mission_id, 'Expédition', 'Organisation du transport', 'shipping', 8),
    (p_mission_id, 'Livraison', 'Réception et vérification', 'delivery', 9),
    (p_mission_id, 'Clôture', 'Finalisation et bilan de mission', 'completion', 10);
END;
$$ LANGUAGE plpgsql;
