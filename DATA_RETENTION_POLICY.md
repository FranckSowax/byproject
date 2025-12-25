# 📋 Politique de Rétention des Données

**Application**: By Project - Compa Chantier  
**Date d'entrée en vigueur**: 8 Novembre 2025  
**Version**: 1.0  
**Conformité**: RGPD, ISO 27001

---

## 🎯 Objectifs

Cette politique définit les durées de conservation des données pour :
- Respecter les obligations légales (RGPD)
- Optimiser les coûts de stockage
- Faciliter la gestion des données
- Garantir la sécurité et la confidentialité

---

## 📊 Catégories de Données

### **1. Données Utilisateurs**

| Type de Données | Durée de Rétention | Base Légale | Suppression |
|-----------------|-------------------|-------------|-------------|
| **Compte actif** | Tant que le compte est actif | Exécution du contrat | - |
| **Compte inactif** | 3 ans après dernière connexion | Intérêt légitime | Automatique |
| **Compte supprimé** | 30 jours (soft delete) | Obligation légale | Automatique |
| **Logs de connexion** | 1 an | Sécurité | Automatique |
| **Données de paiement** | 10 ans | Obligation fiscale | Manuelle |
| **Consentements RGPD** | 3 ans après retrait | Obligation légale | Automatique |

**Actions automatiques:**
```sql
-- Soft delete des comptes inactifs > 3 ans
UPDATE users 
SET deleted_at = NOW(), 
    deletion_reason = 'inactivity'
WHERE last_login_at < NOW() - INTERVAL '3 years'
AND deleted_at IS NULL;

-- Hard delete des comptes soft deleted > 30 jours
DELETE FROM users 
WHERE deleted_at < NOW() - INTERVAL '30 days';
```

---

### **2. Données de Projets**

| Type de Données | Durée de Rétention | Base Légale | Suppression |
|-----------------|-------------------|-------------|-------------|
| **Projet actif** | Tant que le projet est actif | Exécution du contrat | - |
| **Projet archivé** | 5 ans après archivage | Intérêt légitime | Automatique |
| **Projet supprimé** | 90 jours (soft delete) | Obligation légale | Automatique |
| **Matériaux** | Lié au projet | Exécution du contrat | Cascade |
| **Prix** | Lié au projet | Exécution du contrat | Cascade |
| **Photos/Documents** | Lié au projet | Exécution du contrat | Cascade |
| **Historique modifications** | 2 ans | Audit | Automatique |

**Actions automatiques:**
```sql
-- Archiver les projets terminés > 1 an
UPDATE projects 
SET status = 'archived', 
    archived_at = NOW()
WHERE status = 'completed'
AND updated_at < NOW() - INTERVAL '1 year'
AND archived_at IS NULL;

-- Soft delete des projets archivés > 5 ans
UPDATE projects 
SET deleted_at = NOW()
WHERE archived_at < NOW() - INTERVAL '5 years'
AND deleted_at IS NULL;

-- Hard delete des projets soft deleted > 90 jours
DELETE FROM projects 
WHERE deleted_at < NOW() - INTERVAL '90 days';
```

---

### **3. Données Fournisseurs**

| Type de Données | Durée de Rétention | Base Légale | Suppression |
|-----------------|-------------------|-------------|-------------|
| **Fournisseur actif** | Tant qu'actif | Exécution du contrat | - |
| **Fournisseur inactif** | 3 ans après dernière activité | Intérêt légitime | Automatique |
| **Demandes de cotation** | 2 ans | Obligation légale | Automatique |
| **Cotations reçues** | 5 ans | Obligation comptable | Automatique |
| **Contrats** | 10 ans après fin | Obligation légale | Manuelle |

---

### **4. Logs et Monitoring**

| Type de Logs | Durée de Rétention | Base Légale | Suppression |
|--------------|-------------------|-------------|-------------|
| **Logs système (info)** | 90 jours | Sécurité | Automatique |
| **Logs d'erreur** | 1 an | Sécurité | Automatique |
| **Logs de sécurité** | 3 ans | Obligation légale | Automatique |
| **Logs debug** | 7 jours | Développement | Automatique |
| **Métriques performance** | 6 mois | Optimisation | Automatique |
| **Alertes** | 1 an | Sécurité | Automatique |

**Implémenté dans:**
- `cleanup_old_logs()` fonction (voir `system_logs` table)

---

### **5. Backups**

| Type de Backup | Durée de Rétention | Fréquence | Suppression |
|----------------|-------------------|-----------|-------------|
| **Backup automatique** | 30 jours | Quotidien | Automatique |
| **Backup manuel** | 90 jours | À la demande | Automatique |
| **Backup pré-migration** | 180 jours | Avant migration | Automatique |
| **Backup annuel** | 7 ans | Annuel | Manuelle |

**Implémenté dans:**
- `cleanup_expired_backups()` fonction (voir `database_backups` table)

---

### **6. Données Financières**

| Type de Données | Durée de Rétention | Base Légale | Suppression |
|-----------------|-------------------|-------------|-------------|
| **Factures** | 10 ans | Obligation fiscale | Manuelle |
| **Paiements** | 10 ans | Obligation fiscale | Manuelle |
| **Devis** | 5 ans | Obligation comptable | Automatique |
| **Taux de change** | 5 ans | Obligation comptable | Automatique |

---

### **7. Communications**

| Type de Données | Durée de Rétention | Base Légale | Suppression |
|-----------------|-------------------|-------------|-------------|
| **Emails envoyés** | 1 an | Preuve | Automatique |
| **Notifications** | 90 jours | Fonctionnalité | Automatique |
| **Messages support** | 3 ans | Service client | Automatique |
| **Commentaires** | Lié au projet | Exécution du contrat | Cascade |

---

## 🤖 Automatisation

### **Tâches Automatiques Quotidiennes**

**Cron Job (02:00 UTC):**
```bash
#!/bin/bash
# /scripts/daily_cleanup.sh

# 1. Nettoyer les logs expirés
psql -c "SELECT cleanup_old_logs();"

# 2. Nettoyer les backups expirés
psql -c "SELECT cleanup_expired_backups();"

# 3. Soft delete comptes inactifs
psql -c "
  UPDATE users 
  SET deleted_at = NOW(), deletion_reason = 'inactivity'
  WHERE last_login_at < NOW() - INTERVAL '3 years'
  AND deleted_at IS NULL;
"

# 4. Archiver projets terminés
psql -c "
  UPDATE projects 
  SET status = 'archived', archived_at = NOW()
  WHERE status = 'completed'
  AND updated_at < NOW() - INTERVAL '1 year'
  AND archived_at IS NULL;
"

# 5. Logger l'exécution
psql -c "
  INSERT INTO system_logs (level, category, message, details)
  VALUES ('info', 'system', 'Nettoyage automatique quotidien exécuté', 
          jsonb_build_object('timestamp', NOW()));
"
```

**Configuration Netlify Functions:**
```typescript
// netlify/functions/scheduled-cleanup.ts
import { schedule } from '@netlify/functions';

export const handler = schedule('0 2 * * *', async () => {
  // Exécuter les tâches de nettoyage
  await cleanupOldLogs();
  await cleanupExpiredBackups();
  await archiveOldProjects();
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Cleanup completed' })
  };
});
```

---

### **Tâches Automatiques Hebdomadaires**

**Cron Job (Dimanche 03:00 UTC):**
```bash
#!/bin/bash
# /scripts/weekly_cleanup.sh

# 1. Hard delete des données soft deleted
psql -c "DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '30 days';"
psql -c "DELETE FROM projects WHERE deleted_at < NOW() - INTERVAL '90 days';"

# 2. Nettoyer les notifications lues
psql -c "DELETE FROM notifications WHERE read = true AND read_at < NOW() - INTERVAL '90 days';"

# 3. Rapport de nettoyage
psql -c "
  INSERT INTO system_logs (level, category, message, details)
  VALUES ('info', 'system', 'Nettoyage hebdomadaire exécuté',
          jsonb_build_object('timestamp', NOW()));
"
```

---

### **Tâches Automatiques Mensuelles**

**Cron Job (1er du mois, 04:00 UTC):**
```bash
#!/bin/bash
# /scripts/monthly_cleanup.sh

# 1. Analyser l'utilisation du stockage
psql -c "
  SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
"

# 2. Générer rapport de rétention
psql -c "SELECT * FROM get_retention_report();"

# 3. Nettoyer les fichiers orphelins dans Storage
# (Fichiers sans référence dans la BDD)
```

---

## 📧 Notifications

### **Alertes Automatiques**

**Avant suppression définitive:**
```sql
-- Notifier l'utilisateur 7 jours avant suppression
CREATE OR REPLACE FUNCTION notify_before_deletion()
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT 
    id,
    'account_deletion',
    'Votre compte sera supprimé dans 7 jours',
    'Votre compte est inactif depuis 3 ans. Il sera définitivement supprimé dans 7 jours. Connectez-vous pour le conserver.',
    '/login'
  FROM users
  WHERE deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '23 days'
  AND deleted_at < NOW() - INTERVAL '22 days';
END;
$$ LANGUAGE plpgsql;
```

---

## 🔍 Audit et Conformité

### **Registre des Traitements (RGPD)**

**Données conservées:**
- Type de données
- Finalité du traitement
- Base légale
- Durée de conservation
- Destinataires
- Mesures de sécurité

**Rapport mensuel:**
```sql
CREATE OR REPLACE FUNCTION get_retention_report()
RETURNS TABLE(
  data_type TEXT,
  total_records BIGINT,
  oldest_record TIMESTAMPTZ,
  to_delete_soon BIGINT,
  storage_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'users'::TEXT,
    COUNT(*),
    MIN(created_at),
    COUNT(*) FILTER (WHERE deleted_at < NOW() - INTERVAL '23 days'),
    pg_size_pretty(pg_total_relation_size('users'))
  FROM users
  UNION ALL
  SELECT 
    'projects'::TEXT,
    COUNT(*),
    MIN(created_at),
    COUNT(*) FILTER (WHERE deleted_at < NOW() - INTERVAL '83 days'),
    pg_size_pretty(pg_total_relation_size('projects'))
  FROM projects;
END;
$$ LANGUAGE plpgsql;
```

---

## 🛡️ Droits des Utilisateurs (RGPD)

### **Droit à l'Effacement**

**Procédure:**
1. Utilisateur demande suppression via `/settings/account`
2. Soft delete immédiat du compte
3. Email de confirmation envoyé
4. Période de grâce de 30 jours
5. Hard delete après 30 jours

**Implémentation:**
```typescript
async function deleteUserAccount(userId: string) {
  // 1. Soft delete
  await supabase
    .from('users')
    .update({ 
      deleted_at: new Date(),
      deletion_reason: 'user_request'
    })
    .eq('id', userId);
  
  // 2. Anonymiser les données
  await anonymizeUserData(userId);
  
  // 3. Notification
  await sendDeletionConfirmation(userId);
  
  // 4. Logger
  await logger.info('user', 'Compte supprimé sur demande', { userId });
}
```

---

### **Droit à la Portabilité**

**Export des données:**
```typescript
async function exportUserData(userId: string) {
  const data = {
    user: await getUserData(userId),
    projects: await getUserProjects(userId),
    materials: await getUserMaterials(userId),
    prices: await getUserPrices(userId)
  };
  
  return JSON.stringify(data, null, 2);
}
```

---

## 📊 Métriques de Rétention

### **KPIs à Suivre**

| Métrique | Objectif | Fréquence |
|----------|----------|-----------|
| Taux de conformité RGPD | 100% | Mensuel |
| Données supprimées automatiquement | > 90% | Mensuel |
| Coût de stockage | Stable ou ↓ | Mensuel |
| Temps de réponse demandes RGPD | < 30 jours | Par demande |

---

## 🔄 Révision de la Politique

**Fréquence:** Annuelle ou en cas de :
- Changement législatif
- Évolution de l'application
- Incident de sécurité
- Audit externe

**Prochaine révision:** 8 Novembre 2026

---

## 📚 Références Légales

- **RGPD**: Article 5 (limitation de la conservation)
- **RGPD**: Article 17 (droit à l'effacement)
- **Code de commerce**: Article L123-22 (conservation comptable)
- **Code général des impôts**: Article L102 B (conservation fiscale)

---

## ✅ Checklist de Conformité

- [x] Durées de rétention définies pour chaque type de données
- [x] Base légale identifiée pour chaque traitement
- [x] Processus de suppression automatique implémenté
- [x] Notifications avant suppression configurées
- [x] Droit à l'effacement implémenté
- [x] Droit à la portabilité implémenté
- [x] Registre des traitements à jour
- [x] Politique communiquée aux utilisateurs
- [ ] Formation de l'équipe effectuée
- [ ] Audit externe réalisé

---

## 📞 Contact DPO

**Data Protection Officer (DPO):**
- Email: dpo@compachantier.com
- Téléphone: -
- Adresse: -

**Pour toute question sur cette politique ou pour exercer vos droits RGPD.**

---

**Cette politique est effective à partir du 8 Novembre 2025 et s'applique à toutes les données de l'application By Project.** 📋✅
