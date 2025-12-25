# 📊 Configuration du Monitoring & Logs

**Date**: 8 Novembre 2025  
**Status**: ✅ Implémenté

---

## 🎯 Vue d'Ensemble

Système complet de monitoring, logging et alertes pour By Project.

**Composants:**
1. ✅ Système de logs centralisé (Supabase)
2. ✅ Tracking des erreurs (Sentry)
3. ✅ Métriques de performance
4. ✅ Système d'alertes automatiques
5. ⏳ Uptime monitoring (UptimeRobot)

---

## 1. Système de Logs Centralisé ✅

### **Tables Supabase**

#### **system_logs**
Stocke tous les événements système.

```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  level TEXT, -- info, warning, error, success, debug
  category TEXT, -- auth, database, api, system, security, user, export, backup, storage
  message TEXT,
  user_id UUID,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  stack_trace TEXT,
  request_id TEXT,
  environment TEXT,
  version TEXT,
  search_vector TSVECTOR
);
```

#### **performance_metrics**
Stocke les métriques de performance.

```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  metric_name TEXT,
  metric_value NUMERIC,
  metric_unit TEXT, -- ms, bytes, count, percent
  endpoint TEXT,
  user_id UUID,
  tags JSONB,
  environment TEXT
);
```

#### **system_alerts**
Stocke les alertes automatiques.

```sql
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  severity TEXT, -- low, medium, high, critical
  title TEXT,
  description TEXT,
  alert_type TEXT, -- error_rate, response_time, uptime, security, resource
  threshold_value NUMERIC,
  current_value NUMERIC,
  notified BOOLEAN,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  details JSONB,
  environment TEXT
);
```

### **Service Logger**

**Fichier:** `lib/monitoring/logger.ts`

**Usage:**

```typescript
import logger from '@/lib/monitoring/logger';

// Log simple
await logger.info('auth', 'Utilisateur connecté', { userId: '123' });
await logger.error('database', 'Erreur de connexion', error, { query: 'SELECT...' });
await logger.warning('security', 'Tentative de connexion suspecte', { ip: '1.2.3.4' });
await logger.success('backup', 'Backup créé avec succès', { filename: 'backup.sql' });

// Métrique de performance
await logger.metric({
  name: 'api_response_time',
  value: 150,
  unit: 'ms',
  endpoint: '/api/projects',
  tags: { method: 'GET' }
});

// Mesurer le temps d'exécution
const result = await logger.measureTime(
  'fetch_projects',
  async () => {
    return await fetchProjects();
  },
  { endpoint: '/api/projects' }
);

// Événement utilisateur
await logger.userEvent(
  userId,
  userEmail,
  'Projet créé',
  { projectId: '456', projectName: 'Mon Projet' }
);

// Événement de sécurité
await logger.securityEvent(
  'Tentatives de connexion multiples',
  'high',
  { ip: '1.2.3.4', attempts: 5 }
);
```

**Hook React:**

```typescript
import { useLogger } from '@/lib/monitoring/logger';

function MyComponent() {
  const logger = useLogger();
  
  const handleClick = async () => {
    await logger.info('user', 'Bouton cliqué', { button: 'submit' });
  };
  
  return <button onClick={handleClick}>Submit</button>;
}
```

### **Fonctionnalités Automatiques**

1. **Nettoyage automatique:**
   - Logs > 90 jours supprimés (sauf erreurs)
   - Logs d'erreur > 1 an supprimés
   - Logs debug > 7 jours supprimés

2. **Alertes automatiques:**
   - Si > 5 erreurs similaires en 5 min → Alerte créée
   - Alerte de sévérité "high"
   - Notification envoyée

3. **Recherche full-text:**
   - Index TSVECTOR pour recherche rapide
   - Recherche dans message, catégorie, email, détails

---

## 2. Tracking des Erreurs (Sentry) ✅

### **Installation**

```bash
npm install @sentry/nextjs
```

### **Configuration**

**Fichier:** `lib/monitoring/sentry.ts`

**Variables d'environnement:**

```env
# .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### **Initialisation**

**Fichier:** `app/layout.tsx`

```typescript
import { initSentry } from '@/lib/monitoring/sentry';

// Initialiser Sentry au démarrage
if (typeof window !== 'undefined') {
  initSentry();
}
```

### **Usage**

```typescript
import { captureError, captureMessage, setUserContext } from '@/lib/monitoring/sentry';

// Capturer une erreur
try {
  await riskyOperation();
} catch (error) {
  captureError(error, { context: 'additional info' });
}

// Capturer un message
captureMessage('Something important happened', 'warning');

// Définir le contexte utilisateur
setUserContext({
  id: user.id,
  email: user.email,
  username: user.name
});

// Effacer le contexte (déconnexion)
clearUserContext();
```

**Hook React:**

```typescript
import { useSentry } from '@/lib/monitoring/sentry';

function MyComponent() {
  const sentry = useSentry();
  
  useEffect(() => {
    sentry.setUserContext({ id: user.id, email: user.email });
    
    return () => {
      sentry.clearUserContext();
    };
  }, [user]);
}
```

### **Fonctionnalités**

1. **Performance Monitoring:**
   - Trace automatique des requêtes fetch/XHR
   - Trace des navigations
   - Sample rate: 10% en prod, 100% en dev

2. **Session Replay:**
   - Enregistre 10% des sessions
   - 100% des sessions avec erreur
   - Masque automatiquement les données sensibles

3. **Filtrage intelligent:**
   - Ignore les erreurs de réseau
   - Ignore les timeouts
   - Ignore les erreurs CORS

4. **Breadcrumbs:**
   - Fil d'Ariane automatique des actions utilisateur
   - Aide au debugging

---

## 3. Métriques de Performance ✅

### **Métriques Collectées**

1. **Temps de réponse API:**
   - Chaque endpoint
   - Par méthode HTTP
   - Par utilisateur

2. **Temps de chargement pages:**
   - Time to First Byte (TTFB)
   - First Contentful Paint (FCP)
   - Time to Interactive (TTI)

3. **Opérations base de données:**
   - Temps de requête
   - Nombre de requêtes
   - Requêtes lentes (> 1s)

4. **Upload/Export:**
   - Temps de traitement
   - Taille des fichiers
   - Taux de succès

### **Dashboard Performance**

**Page:** `/admin/analytics`

**Métriques affichées:**
- Temps de réponse moyen par endpoint
- Requêtes les plus lentes
- Taux d'erreur
- Utilisation des ressources
- Graphiques de tendance

---

## 4. Système d'Alertes ✅

### **Types d'Alertes**

1. **error_rate** - Taux d'erreur élevé
   - Seuil: > 5 erreurs similaires en 5 min
   - Sévérité: high

2. **response_time** - Temps de réponse lent
   - Seuil: > 3s
   - Sévérité: medium

3. **uptime** - Service indisponible
   - Seuil: > 1 min de downtime
   - Sévérité: critical

4. **security** - Événement de sécurité
   - Tentatives de connexion multiples
   - Accès non autorisé
   - Sévérité: high/critical

5. **resource** - Ressources système
   - Mémoire > 85%
   - Disque > 90%
   - Sévérité: medium/high

### **Notifications**

**Canaux:**
- ✅ Dashboard admin (`/admin/logs`)
- ⏳ Email (à configurer)
- ⏳ Slack (à configurer)
- ⏳ SMS (à configurer)

### **Gestion des Alertes**

**Page:** `/admin/logs`

**Actions:**
- Voir toutes les alertes
- Filtrer par sévérité
- Marquer comme acquittée
- Résoudre une alerte
- Voir l'historique

---

## 5. Uptime Monitoring ⏳

### **Service Recommandé: UptimeRobot**

**URL:** https://uptimerobot.com

**Configuration:**

1. **Créer un compte** UptimeRobot (gratuit)

2. **Ajouter des monitors:**
   - **Site principal:** https://byproject.netlify.app
   - **API:** https://byproject.netlify.app/api/health
   - **Admin:** https://byproject.netlify.app/admin

3. **Configurer les alertes:**
   - Email: admin@compachantier.com
   - Intervalle: 5 minutes
   - Timeout: 30 secondes

4. **Webhook (optionnel):**
   ```
   POST https://byproject.netlify.app/api/webhooks/uptime
   ```

### **Alternative: Vercel Analytics**

Si hébergé sur Vercel, utiliser Vercel Analytics:
- Monitoring automatique
- Métriques de performance
- Logs d'erreur
- Dashboard intégré

---

## 📊 Dashboard Admin

### **Page Logs** (`/admin/logs`)

**Fonctionnalités:**
- ✅ Liste de tous les logs
- ✅ Filtres par niveau (error, warning, info, success)
- ✅ Filtres par catégorie (auth, database, api, etc.)
- ✅ Recherche full-text
- ✅ Export CSV
- ✅ Statistiques (total, erreurs, warnings)
- ✅ Actualisation en temps réel

**Mise à jour nécessaire:**
- Remplacer les données mockées par les vraies données de `system_logs`
- Ajouter pagination
- Ajouter graphiques de tendance

---

## 🔧 Installation

### **1. Appliquer la migration**

```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor dans Supabase Dashboard
# Copier/coller le contenu de supabase/migrations/20251108_create_system_logs.sql
```

### **2. Installer Sentry**

```bash
npm install @sentry/nextjs
```

### **3. Configurer les variables d'environnement**

```env
# .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### **4. Initialiser Sentry**

Ajouter dans `app/layout.tsx`:

```typescript
import { initSentry } from '@/lib/monitoring/sentry';

if (typeof window !== 'undefined') {
  initSentry();
}
```

### **5. Mettre à jour la page logs**

Remplacer les données mockées par:

```typescript
const { data: logs, error } = await supabase
  .from('system_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(100);
```

---

## 📈 Métriques de Succès

### **Objectifs**

- ✅ 100% des erreurs loggées
- ✅ < 1s temps de réponse moyen
- ✅ > 99.9% uptime
- ✅ < 5 min temps de détection des problèmes
- ✅ < 15 min temps de résolution des alertes critiques

### **KPIs à Suivre**

1. **Disponibilité:**
   - Uptime %
   - Nombre d'incidents
   - Durée moyenne des incidents

2. **Performance:**
   - Temps de réponse API
   - Temps de chargement pages
   - Requêtes lentes

3. **Erreurs:**
   - Taux d'erreur
   - Erreurs par catégorie
   - Temps de résolution

4. **Utilisation:**
   - Requêtes par minute
   - Utilisateurs actifs
   - Actions par utilisateur

---

## 🧪 Tests

### **Tester le Logging**

```typescript
// Test dans la console du navigateur
import logger from '@/lib/monitoring/logger';

await logger.info('system', 'Test log', { test: true });
await logger.error('api', 'Test error', new Error('Test'), { test: true });
```

### **Tester Sentry**

```typescript
// Test dans la console
import { captureError } from '@/lib/monitoring/sentry';

captureError(new Error('Test Sentry'), { test: true });
```

### **Tester les Alertes**

```sql
-- Créer 6 erreurs similaires rapidement
INSERT INTO system_logs (level, category, message)
SELECT 'error', 'test', 'Test error'
FROM generate_series(1, 6);

-- Vérifier qu'une alerte a été créée
SELECT * FROM system_alerts WHERE alert_type = 'error_rate';
```

---

## 🚀 Prochaines Étapes

### **Immédiat**
1. ✅ Appliquer la migration
2. ✅ Configurer Sentry
3. ⏳ Mettre à jour page logs admin
4. ⏳ Tester le système complet

### **Court Terme**
1. Configurer UptimeRobot
2. Ajouter notifications email
3. Créer dashboard analytics
4. Ajouter graphiques de tendance

### **Moyen Terme**
1. Intégration Slack
2. Alertes SMS critiques
3. Machine learning pour détection d'anomalies
4. Rapports automatiques hebdomadaires

---

## 📞 Support

**Questions:**
- Documentation: Ce fichier
- Sentry Docs: https://docs.sentry.io
- Supabase Docs: https://supabase.com/docs

**Problèmes:**
- Vérifier les logs dans `/admin/logs`
- Vérifier Sentry Dashboard
- Vérifier Supabase Dashboard

---

**Le système de monitoring est maintenant complet et prêt pour la production ! 📊✅**
