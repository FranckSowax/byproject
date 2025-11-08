-- Migration: Système de logs centralisé
-- Date: 2025-11-08
-- Description: Création de la table system_logs pour stocker tous les événements système

-- Créer la table system_logs
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Informations de base
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success', 'debug')),
  category TEXT NOT NULL, -- auth, database, api, system, security, user, export, backup, storage
  message TEXT NOT NULL,
  
  -- Contexte
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Détails techniques
  details JSONB,
  stack_trace TEXT,
  request_id TEXT,
  
  -- Métadonnées
  environment TEXT DEFAULT 'production', -- production, staging, development
  version TEXT,
  
  -- Index pour recherche rapide
  search_vector TSVECTOR
);

-- Index pour performance
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_category ON system_logs(category);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_environment ON system_logs(environment);
CREATE INDEX idx_system_logs_search ON system_logs USING GIN(search_vector);

-- Trigger pour mettre à jour search_vector
CREATE OR REPLACE FUNCTION update_system_logs_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('french', COALESCE(NEW.message, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.category, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.user_email, '')), 'C') ||
    setweight(to_tsvector('french', COALESCE(NEW.details::text, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_logs_search_vector
  BEFORE INSERT OR UPDATE ON system_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_system_logs_search_vector();

-- RLS Policies
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent lire les logs
CREATE POLICY "Admins can read all logs"
  ON system_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Le système peut insérer des logs (via service role)
CREATE POLICY "System can insert logs"
  ON system_logs
  FOR INSERT
  WITH CHECK (true);

-- Seuls les admins peuvent supprimer les vieux logs
CREATE POLICY "Admins can delete old logs"
  ON system_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
    AND created_at < NOW() - INTERVAL '90 days'
  );

-- Créer une fonction pour nettoyer automatiquement les vieux logs
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  -- Supprimer les logs de plus de 90 jours (sauf erreurs)
  DELETE FROM system_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND level != 'error';
  
  -- Supprimer les logs d'erreur de plus de 1 an
  DELETE FROM system_logs
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND level = 'error';
  
  -- Supprimer les logs debug de plus de 7 jours
  DELETE FROM system_logs
  WHERE created_at < NOW() - INTERVAL '7 days'
  AND level = 'debug';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une table pour les métriques de performance
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Métriques
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT, -- ms, bytes, count, percent
  
  -- Contexte
  endpoint TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Métadonnées
  tags JSONB,
  environment TEXT DEFAULT 'production'
);

-- Index pour performance
CREATE INDEX idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_endpoint ON performance_metrics(endpoint);

-- RLS pour performance_metrics
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all metrics"
  ON performance_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "System can insert metrics"
  ON performance_metrics
  FOR INSERT
  WITH CHECK (true);

-- Créer une table pour les alertes
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Alerte
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Contexte
  alert_type TEXT NOT NULL, -- error_rate, response_time, uptime, security, resource
  threshold_value NUMERIC,
  current_value NUMERIC,
  
  -- Actions
  notified BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  
  -- Métadonnées
  details JSONB,
  environment TEXT DEFAULT 'production'
);

-- Index pour alertes
CREATE INDEX idx_system_alerts_created_at ON system_alerts(created_at DESC);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_system_alerts_resolved ON system_alerts(resolved_at) WHERE resolved_at IS NULL;

-- RLS pour system_alerts
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage alerts"
  ON system_alerts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Fonction pour créer une alerte automatiquement
CREATE OR REPLACE FUNCTION create_alert_from_logs()
RETURNS TRIGGER AS $$
DECLARE
  error_count INTEGER;
  alert_exists BOOLEAN;
BEGIN
  -- Si c'est une erreur, vérifier s'il faut créer une alerte
  IF NEW.level = 'error' THEN
    -- Compter les erreurs similaires dans les 5 dernières minutes
    SELECT COUNT(*) INTO error_count
    FROM system_logs
    WHERE level = 'error'
    AND category = NEW.category
    AND created_at > NOW() - INTERVAL '5 minutes';
    
    -- Si plus de 5 erreurs similaires, créer une alerte
    IF error_count >= 5 THEN
      -- Vérifier si une alerte similaire existe déjà
      SELECT EXISTS (
        SELECT 1 FROM system_alerts
        WHERE alert_type = 'error_rate'
        AND details->>'category' = NEW.category
        AND resolved_at IS NULL
        AND created_at > NOW() - INTERVAL '1 hour'
      ) INTO alert_exists;
      
      -- Créer l'alerte si elle n'existe pas
      IF NOT alert_exists THEN
        INSERT INTO system_alerts (
          severity,
          title,
          description,
          alert_type,
          current_value,
          details
        ) VALUES (
          'high',
          'Taux d''erreur élevé détecté',
          format('Plus de %s erreurs dans la catégorie %s en 5 minutes', error_count, NEW.category),
          'error_rate',
          error_count,
          jsonb_build_object(
            'category', NEW.category,
            'error_count', error_count,
            'last_error', NEW.message
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_alert_from_logs
  AFTER INSERT ON system_logs
  FOR EACH ROW
  EXECUTE FUNCTION create_alert_from_logs();

-- Insérer quelques logs de test
INSERT INTO system_logs (level, category, message, details) VALUES
  ('info', 'system', 'Système de logs initialisé', '{"version": "1.0"}'),
  ('success', 'database', 'Migration exécutée avec succès', '{"migration": "20251108_create_system_logs"}');

-- Commentaires
COMMENT ON TABLE system_logs IS 'Stocke tous les événements et logs système';
COMMENT ON TABLE performance_metrics IS 'Métriques de performance de l''application';
COMMENT ON TABLE system_alerts IS 'Alertes système automatiques';
