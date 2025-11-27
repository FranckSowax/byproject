-- 1. Table des Missions (Le dossier global de la délégation)
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT,
    organization_name TEXT,
    description TEXT,
    status TEXT DEFAULT 'draft', -- 'draft', 'analyzing', 'proposal_ready', 'active', 'completed'
    
    -- Configuration Marque Blanche
    white_label_config JSONB DEFAULT '{}'::jsonb,
    
    -- Données contextuelles IA (Questions/Réponses)
    ai_context_data JSONB DEFAULT '{}'::jsonb,
    
    -- Métriques de la mission
    estimated_budget DECIMAL(12,2),
    start_date DATE,
    end_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Membres de la Délégation
CREATE TABLE IF NOT EXISTS delegates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    title TEXT, -- ex: "Ministre", "Directeur Technique"
    role TEXT, -- 'vip', 'technical', 'logistics', 'support'
    
    -- Données sensibles (à traiter avec précaution/chiffrement côté app si besoin)
    passport_number TEXT,
    nationality TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table du Planning (Factory Tour & Logistique)
CREATE TABLE IF NOT EXISTS itinerary_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL, -- 'factory_visit', 'transport', 'hotel', 'meeting', 'meal'
    title TEXT NOT NULL,
    
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    
    location_name TEXT,
    location_address TEXT,
    location_coordinates JSONB, -- {lat: ..., lng: ...}
    
    -- Lien optionnel vers un fournisseur existant pour les visites d'usine
    linked_supplier_id UUID REFERENCES suppliers(id),
    
    notes TEXT,
    status TEXT DEFAULT 'planned', -- 'planned', 'confirmed', 'completed', 'cancelled'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Mise en place de la sécurité (RLS)

-- Sécurité Missions
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own missions" 
    ON missions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own missions" 
    ON missions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own missions" 
    ON missions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own missions" 
    ON missions FOR DELETE 
    USING (auth.uid() = user_id);

-- Sécurité Délégués (Héritée de la mission)
ALTER TABLE delegates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view delegates of their missions" 
    ON delegates FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM missions WHERE missions.id = delegates.mission_id AND missions.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage delegates of their missions" 
    ON delegates FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM missions WHERE missions.id = delegates.mission_id AND missions.user_id = auth.uid()
    ));

-- Sécurité Itinéraire (Héritée de la mission)
ALTER TABLE itinerary_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view itinerary of their missions" 
    ON itinerary_events FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM missions WHERE missions.id = itinerary_events.mission_id AND missions.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage itinerary of their missions" 
    ON itinerary_events FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM missions WHERE missions.id = itinerary_events.mission_id AND missions.user_id = auth.uid()
    ));

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_missions_updated_at
    BEFORE UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
