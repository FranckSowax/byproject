# 🚨 Plan de Disaster Recovery (DR)

**Application**: By Project - Compa Chantier  
**Date de création**: 8 Novembre 2025  
**Dernière mise à jour**: 8 Novembre 2025  
**Version**: 1.0  
**Responsable**: Équipe DevOps

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Objectifs de Récupération](#objectifs-de-récupération)
3. [Scénarios de Disaster](#scénarios-de-disaster)
4. [Procédures de Backup](#procédures-de-backup)
5. [Procédures de Restauration](#procédures-de-restauration)
6. [Contacts d'Urgence](#contacts-durgence)
7. [Tests de DR](#tests-de-dr)
8. [Checklist de Récupération](#checklist-de-récupération)

---

## 🎯 Vue d'Ensemble

Ce document décrit les procédures à suivre en cas de perte de données, panne système ou catastrophe affectant l'application By Project.

### **Objectifs**
- Minimiser la perte de données
- Restaurer les services rapidement
- Maintenir la confiance des utilisateurs
- Respecter les obligations légales (RGPD)

### **Portée**
- Base de données Supabase
- Fichiers stockés (Supabase Storage)
- Configuration de l'application
- Code source (GitHub)

---

## ⏱️ Objectifs de Récupération

### **RTO (Recovery Time Objective)**
**Temps maximum acceptable pour restaurer le service**

| Service | RTO | Priorité |
|---------|-----|----------|
| Base de données | 4 heures | Critique |
| Application web | 2 heures | Critique |
| Fichiers/Storage | 8 heures | Haute |
| Emails | 24 heures | Moyenne |

### **RPO (Recovery Point Objective)**
**Perte de données maximale acceptable**

| Données | RPO | Fréquence Backup |
|---------|-----|------------------|
| Base de données | 24 heures | Quotidien |
| Fichiers | 24 heures | Quotidien |
| Configuration | 1 semaine | Hebdomadaire |
| Code source | Temps réel | Git push |

---

## 🔥 Scénarios de Disaster

### **Scénario 1: Perte de Données (Corruption BDD)**

**Symptômes:**
- Erreurs SQL lors des requêtes
- Données incohérentes
- Tables manquantes

**Causes possibles:**
- Bug dans une migration
- Erreur humaine (DELETE sans WHERE)
- Corruption du disque

**Procédure:**
1. ✅ Arrêter immédiatement toutes les écritures
2. ✅ Identifier l'étendue de la corruption
3. ✅ Restaurer depuis le dernier backup sain
4. ✅ Vérifier l'intégrité des données
5. ✅ Communiquer avec les utilisateurs

**Temps estimé:** 2-4 heures

---

### **Scénario 2: Suppression Accidentelle**

**Symptômes:**
- Données manquantes
- Utilisateurs signalent des projets disparus

**Causes possibles:**
- Erreur humaine
- Bug dans le code
- Compte compromis

**Procédure:**
1. ✅ Identifier les données supprimées
2. ✅ Vérifier les logs système
3. ✅ Restauration sélective depuis backup
4. ✅ Implémenter soft delete si nécessaire
5. ✅ Audit de sécurité

**Temps estimé:** 1-2 heures

---

### **Scénario 3: Panne Supabase**

**Symptômes:**
- Application inaccessible
- Erreurs de connexion BDD
- Timeout sur toutes les requêtes

**Causes possibles:**
- Panne infrastructure Supabase
- Problème réseau
- Quota dépassé

**Procédure:**
1. ✅ Vérifier status.supabase.com
2. ✅ Contacter support Supabase
3. ✅ Activer page de maintenance
4. ✅ Communiquer sur les réseaux sociaux
5. ✅ Si > 4h, envisager migration temporaire

**Temps estimé:** Dépend de Supabase (généralement < 2h)

---

### **Scénario 4: Attaque Ransomware**

**Symptômes:**
- Données chiffrées
- Demande de rançon
- Accès bloqué

**Causes possibles:**
- Compte admin compromis
- Vulnérabilité exploitée
- Phishing réussi

**Procédure:**
1. ✅ **NE PAS PAYER LA RANÇON**
2. ✅ Isoler immédiatement le système
3. ✅ Contacter les autorités (ANSSI, Police)
4. ✅ Restaurer depuis backup offline
5. ✅ Audit de sécurité complet
6. ✅ Changer tous les mots de passe
7. ✅ Notification CNIL (RGPD)

**Temps estimé:** 1-3 jours

---

### **Scénario 5: Erreur de Migration**

**Symptômes:**
- Application cassée après déploiement
- Erreurs SQL
- Données incompatibles

**Causes possibles:**
- Migration non testée
- Rollback impossible
- Dépendances manquantes

**Procédure:**
1. ✅ Rollback immédiat du code
2. ✅ Restaurer backup pré-migration
3. ✅ Tester la migration en staging
4. ✅ Corriger les erreurs
5. ✅ Re-déployer avec prudence

**Temps estimé:** 30 min - 2 heures

---

## 💾 Procédures de Backup

### **Backup Automatique Quotidien**

**Configuration:**
```yaml
Fréquence: Tous les jours à 02:00 UTC
Type: Complet (Full backup)
Rétention: 30 jours
Compression: gzip
Encryption: AES-256
Storage: Supabase + S3 (redondance)
```

**Vérification:**
- Checksum MD5 calculé
- Test de restauration hebdomadaire
- Alerte si backup échoue

**Commande manuelle:**
```bash
# Via Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql

# Compression
gzip backup_$(date +%Y%m%d).sql

# Upload vers S3 (optionnel)
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://byproject-backups/
```

---

### **Backup Pré-Migration**

**Automatique avant chaque migration:**
```typescript
// Dans le script de migration
async function preMigrationBackup() {
  const backupName = `pre_migration_${migrationName}_${Date.now()}`;
  await createBackup({
    name: backupName,
    type: 'pre_migration',
    retention_days: 180 // 6 mois
  });
}
```

---

### **Backup Manuel**

**Via l'interface admin:**
1. Aller sur `/admin/database`
2. Cliquer sur "Créer Backup"
3. Ajouter une note descriptive
4. Confirmer

**Via API:**
```bash
curl -X POST https://byproject.netlify.app/api/admin/backups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "manual",
    "notes": "Backup avant modification importante"
  }'
```

---

## 🔄 Procédures de Restauration

### **Restauration Complète**

**Étape 1: Préparation**
```bash
# 1. Télécharger le backup
supabase storage download backups/backup_20251108.sql.gz

# 2. Décompresser
gunzip backup_20251108.sql.gz

# 3. Vérifier l'intégrité
md5sum backup_20251108.sql
# Comparer avec le checksum stocké
```

**Étape 2: Restauration**
```bash
# 1. Créer une nouvelle base (recommandé)
supabase db create byproject_restore

# 2. Restaurer le backup
psql -h db.xxx.supabase.co \
     -U postgres \
     -d byproject_restore \
     -f backup_20251108.sql

# 3. Vérifier les données
psql -h db.xxx.supabase.co \
     -U postgres \
     -d byproject_restore \
     -c "SELECT COUNT(*) FROM users;"
```

**Étape 3: Validation**
```sql
-- Vérifier les tables
SELECT table_name, 
       (SELECT COUNT(*) FROM table_name) as row_count
FROM information_schema.tables
WHERE table_schema = 'public';

-- Vérifier les contraintes
SELECT * FROM pg_constraint WHERE contype = 'f';

-- Vérifier les index
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

**Étape 4: Basculement**
```bash
# 1. Activer page de maintenance
# 2. Pointer l'application vers la nouvelle BDD
# 3. Tester en production
# 4. Désactiver maintenance
# 5. Monitorer les erreurs
```

---

### **Restauration Sélective (Table Spécifique)**

```bash
# 1. Extraire une table du backup
pg_restore -t users backup_20251108.sql > users_only.sql

# 2. Restaurer uniquement cette table
psql -h db.xxx.supabase.co \
     -U postgres \
     -d byproject \
     -c "TRUNCATE users CASCADE;"

psql -h db.xxx.supabase.co \
     -U postgres \
     -d byproject \
     -f users_only.sql
```

---

### **Restauration Point-in-Time (PITR)**

**Supabase Pro uniquement:**
```bash
# Restaurer à un point précis dans le temps
supabase db restore \
  --project-ref xxx \
  --timestamp "2025-11-08 14:30:00"
```

---

## 📞 Contacts d'Urgence

### **Équipe Technique**

| Rôle | Nom | Téléphone | Email | Disponibilité |
|------|-----|-----------|-------|---------------|
| DevOps Lead | - | - | devops@compachantier.com | 24/7 |
| DBA | - | - | dba@compachantier.com | 24/7 |
| CTO | - | - | cto@compachantier.com | 9h-18h |
| Support | - | - | support@compachantier.com | 9h-18h |

### **Fournisseurs**

| Service | Contact | Support | SLA |
|---------|---------|---------|-----|
| Supabase | support@supabase.io | https://supabase.com/support | 4h (Pro) |
| Netlify | support@netlify.com | https://netlify.com/support | 24h |
| AWS S3 | - | Console AWS | - |

### **Autorités (en cas d'attaque)**

| Organisme | Contact | Quand contacter |
|-----------|---------|-----------------|
| ANSSI | https://www.cert.ssi.gouv.fr | Cyberattaque |
| CNIL | https://www.cnil.fr | Fuite de données |
| Police | 17 | Cybercriminalité |

---

## 🧪 Tests de DR

### **Planning de Tests**

| Test | Fréquence | Dernière exécution | Prochaine |
|------|-----------|-------------------|-----------|
| Restauration complète | Mensuel | - | 2025-12-01 |
| Restauration sélective | Trimestriel | - | 2025-12-15 |
| Failover Supabase | Semestriel | - | 2026-01-15 |
| Simulation ransomware | Annuel | - | 2026-06-01 |

### **Procédure de Test**

**Test de Restauration Mensuel:**
1. ✅ Créer un backup de test
2. ✅ Restaurer sur environnement staging
3. ✅ Vérifier l'intégrité des données
4. ✅ Tester les fonctionnalités critiques
5. ✅ Mesurer le temps de restauration
6. ✅ Documenter les résultats
7. ✅ Identifier les améliorations

**Critères de Succès:**
- ✅ Restauration < RTO (4h)
- ✅ Perte de données < RPO (24h)
- ✅ Toutes les tables présentes
- ✅ Contraintes intactes
- ✅ Application fonctionnelle

---

## ✅ Checklist de Récupération

### **Phase 1: Détection (0-15 min)**
- [ ] Incident détecté et confirmé
- [ ] Équipe d'urgence notifiée
- [ ] Étendue du problème évaluée
- [ ] Décision de déclencher DR prise

### **Phase 2: Isolation (15-30 min)**
- [ ] Système affecté isolé
- [ ] Page de maintenance activée
- [ ] Utilisateurs notifiés
- [ ] Logs sauvegardés

### **Phase 3: Évaluation (30-60 min)**
- [ ] Cause racine identifiée
- [ ] Données affectées listées
- [ ] Backup approprié sélectionné
- [ ] Plan de restauration validé

### **Phase 4: Restauration (1-4h)**
- [ ] Backup téléchargé et vérifié
- [ ] Environnement de restauration préparé
- [ ] Données restaurées
- [ ] Intégrité vérifiée
- [ ] Tests fonctionnels passés

### **Phase 5: Validation (4-6h)**
- [ ] Application testée en profondeur
- [ ] Données vérifiées par échantillonnage
- [ ] Performance normale
- [ ] Sécurité vérifiée

### **Phase 6: Retour en Production (6-8h)**
- [ ] Basculement vers système restauré
- [ ] Monitoring intensif activé
- [ ] Page de maintenance désactivée
- [ ] Utilisateurs notifiés du retour

### **Phase 7: Post-Mortem (J+1)**
- [ ] Rapport d'incident rédigé
- [ ] Cause racine documentée
- [ ] Actions correctives identifiées
- [ ] Plan d'amélioration créé
- [ ] Équipe débriefée

---

## 📊 Métriques de DR

### **KPIs à Suivre**

| Métrique | Objectif | Actuel |
|----------|----------|--------|
| Temps moyen de restauration | < 4h | - |
| Taux de succès des backups | > 99% | - |
| Taux de succès des restaurations | > 95% | - |
| Perte de données moyenne | < 24h | - |
| Temps de détection incident | < 15 min | - |

---

## 🔐 Sécurité des Backups

### **Encryption**
- ✅ AES-256 pour tous les backups
- ✅ Clés stockées dans HashiCorp Vault
- ✅ Rotation des clés tous les 90 jours

### **Accès**
- ✅ Authentification 2FA obligatoire
- ✅ Logs d'accès aux backups
- ✅ Principe du moindre privilège

### **Stockage**
- ✅ Redondance géographique (3 régions)
- ✅ Versioning activé
- ✅ Immutabilité (WORM) pour backups critiques

---

## 📝 Historique des Révisions

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0 | 2025-11-08 | DevOps | Création initiale |

---

## 📚 Références

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [ANSSI - Guide Cybersécurité](https://www.ssi.gouv.fr/)
- [RGPD - Notification de violation](https://www.cnil.fr/fr/notifier-une-violation-de-donnees-personnelles)

---

**Ce plan doit être révisé et testé régulièrement. La dernière révision date du 8 Novembre 2025.**

**En cas d'urgence, appelez immédiatement l'équipe DevOps et suivez ce plan à la lettre.** 🚨
