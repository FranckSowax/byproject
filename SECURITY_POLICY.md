# 🔒 Politique de Sécurité - By Project

**Date**: 8 Novembre 2025  
**Version**: 1.0  
**Statut**: En vigueur

---

## 📋 Vue d'Ensemble

Ce document définit les politiques et mesures de sécurité mises en place pour protéger l'application By Project, ses utilisateurs et leurs données.

---

## 🔐 1. Authentification

### Politique de Mots de Passe

**Exigences minimales:**
- ✅ Minimum 8 caractères
- ✅ Au moins une majuscule (A-Z)
- ✅ Au moins une minuscule (a-z)
- ✅ Au moins un chiffre (0-9)
- ✅ Au moins un caractère spécial (!@#$%^&*...)

**Bonnes pratiques:**
- 🔒 Utiliser un gestionnaire de mots de passe
- 🔒 Ne jamais réutiliser le même mot de passe
- 🔒 Changer régulièrement de mot de passe
- 🔒 Ne jamais partager son mot de passe

### Récupération de Mot de Passe

- ✅ Lien de réinitialisation envoyé par email
- ✅ Lien valide pendant 24 heures
- ✅ Lien à usage unique
- ✅ Confirmation par email après changement

### Sessions

- ✅ Session automatique après connexion
- ✅ Déconnexion automatique après inactivité (7 jours)
- ✅ Possibilité de déconnexion manuelle
- ✅ Révocation de toutes les sessions possible

---

## 🛡️ 2. Protection des Données

### Chiffrement

**En transit:**
- ✅ HTTPS/TLS 1.3 obligatoire en production
- ✅ Certificat SSL valide
- ✅ HSTS activé (Strict-Transport-Security)

**Au repos:**
- ✅ Base de données chiffrée (Supabase)
- ✅ Fichiers uploadés chiffrés
- ✅ Mots de passe hashés (bcrypt via Supabase Auth)

### Données Sensibles

**Stockage:**
- ❌ Jamais de mots de passe en clair
- ❌ Jamais de données bancaires stockées
- ✅ Tokens d'authentification sécurisés
- ✅ Logs sans données sensibles

**Transmission:**
- ✅ Toujours via HTTPS
- ✅ Headers de sécurité configurés
- ✅ Pas de données sensibles dans les URLs

---

## 🚫 3. Protection contre les Attaques

### XSS (Cross-Site Scripting)

**Mesures:**
- ✅ Sanitization de toutes les entrées utilisateur
- ✅ Content Security Policy (CSP) configurée
- ✅ Échappement automatique dans React
- ✅ DOMPurify pour le nettoyage HTML

**Validation:**
- ✅ Validation côté client ET serveur
- ✅ Rejet des scripts dans les entrées
- ✅ Encodage des sorties

### SQL Injection

**Mesures:**
- ✅ Requêtes paramétrées (Supabase)
- ✅ ORM sécurisé
- ✅ Row Level Security (RLS) activé
- ✅ Validation des entrées

**Supabase RLS:**
```sql
-- Exemple de politique RLS
CREATE POLICY "Users can only see their own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);
```

### CSRF (Cross-Site Request Forgery)

**Mesures:**
- ✅ Vérification de l'origine des requêtes
- ✅ SameSite cookies
- ✅ Tokens CSRF pour les actions sensibles
- ✅ Vérification du referer

### Rate Limiting

**Limites par endpoint:**

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| Login | 5 requêtes | 15 min |
| Signup | 3 requêtes | 1 heure |
| Reset Password | 3 requêtes | 1 heure |
| API Générale | 60 requêtes | 1 min |
| Upload | 10 requêtes | 1 min |
| Export | 5 requêtes | 1 min |

**Réponse en cas de dépassement:**
- Status: 429 Too Many Requests
- Header: Retry-After
- Message explicite

---

## 📁 4. Gestion des Fichiers

### Upload

**Types autorisés:**

**Images:**
- ✅ JPEG/JPG
- ✅ PNG
- ✅ WebP
- ✅ GIF
- ❌ SVG (risque XSS)

**Documents:**
- ✅ PDF
- ✅ Excel (.xlsx, .xls)
- ✅ CSV
- ❌ Exécutables (.exe, .sh, etc.)

**Limites:**
- 📏 Images: 5 MB max
- 📏 Documents: 10 MB max

**Validation:**
- ✅ Vérification du type MIME
- ✅ Vérification de l'extension
- ✅ Scan antivirus (recommandé en production)
- ✅ Renommage des fichiers

### Stockage

- ✅ Supabase Storage sécurisé
- ✅ URLs signées pour l'accès
- ✅ Permissions granulaires
- ✅ Expiration des liens temporaires

---

## 👥 5. Gestion des Accès

### Rôles

**User (Utilisateur):**
- ✅ Créer ses propres projets
- ✅ Partager ses projets
- ✅ Voir les projets partagés avec lui
- ❌ Accéder aux projets des autres
- ❌ Accéder à l'admin

**Admin (Administrateur):**
- ✅ Tous les droits utilisateur
- ✅ Gérer les demandes de cotation
- ✅ Modifier les taux de change
- ✅ Voir les statistiques
- ✅ Gérer les utilisateurs (futur)

### Permissions sur les Projets

**Owner (Propriétaire):**
- ✅ Toutes les actions
- ✅ Partager le projet
- ✅ Supprimer le projet

**Editor (Éditeur):**
- ✅ Modifier le projet
- ✅ Ajouter/modifier/supprimer matériaux et prix
- ❌ Supprimer le projet
- ❌ Gérer les permissions

**Viewer (Lecteur):**
- ✅ Voir le projet
- ✅ Exporter en PDF
- ❌ Modifier quoi que ce soit

---

## 🔍 6. Audit et Monitoring

### Logs

**Événements loggés:**
- ✅ Connexions/déconnexions
- ✅ Tentatives de connexion échouées
- ✅ Modifications de données sensibles
- ✅ Erreurs serveur
- ✅ Violations de rate limiting

**Rétention:**
- 📅 Logs d'accès: 30 jours
- 📅 Logs d'erreur: 90 jours
- 📅 Logs de sécurité: 1 an

### Monitoring

**Outils:**
- 🔧 Sentry (erreurs)
- 🔧 Vercel Analytics (performance)
- 🔧 Supabase Dashboard (database)
- 🔧 UptimeRobot (disponibilité)

**Alertes:**
- 🚨 Erreurs critiques
- 🚨 Taux d'erreur élevé
- 🚨 Temps de réponse lent
- 🚨 Downtime

---

## 🔄 7. Backup et Recovery

### Backup

**Fréquence:**
- 📅 Base de données: Quotidien
- 📅 Fichiers: Quotidien
- 📅 Configuration: À chaque changement

**Rétention:**
- 📦 Backups quotidiens: 30 jours
- 📦 Backups hebdomadaires: 3 mois
- 📦 Backups mensuels: 1 an

**Stockage:**
- ✅ Stockage géographiquement distribué
- ✅ Chiffrement au repos
- ✅ Accès restreint

### Disaster Recovery

**RTO (Recovery Time Objective):** 4 heures  
**RPO (Recovery Point Objective):** 24 heures

**Plan:**
1. Détection de l'incident
2. Évaluation de l'impact
3. Activation du plan de recovery
4. Restauration depuis backup
5. Vérification de l'intégrité
6. Retour en production
7. Post-mortem

---

## 📱 8. Sécurité des API

### Authentification

- ✅ JWT tokens (Supabase Auth)
- ✅ Expiration des tokens
- ✅ Refresh tokens sécurisés
- ✅ Révocation possible

### Validation

**Toutes les requêtes:**
- ✅ Validation des paramètres
- ✅ Sanitization des entrées
- ✅ Vérification des types
- ✅ Limites de taille

**Réponses:**
- ✅ Pas de stack traces en production
- ✅ Messages d'erreur génériques
- ✅ Codes HTTP appropriés
- ✅ Headers de sécurité

---

## 🔐 9. Conformité

### RGPD

**Droits des utilisateurs:**
- ✅ Droit d'accès aux données
- ✅ Droit de rectification
- ✅ Droit à l'effacement
- ✅ Droit à la portabilité
- ✅ Droit d'opposition

**Mesures:**
- ✅ Consentement explicite
- ✅ Politique de confidentialité claire
- ✅ Minimisation des données
- ✅ Chiffrement des données
- ✅ Notification de violation (72h)

### Cookies

- ✅ Cookies essentiels uniquement
- ✅ Pas de cookies tiers
- ✅ SameSite=Strict
- ✅ Secure flag en production

---

## 📞 10. Signalement de Vulnérabilités

### Programme de Bug Bounty

**Contact:**
- 📧 Email: security@byproject.com
- 🔒 PGP: [Clé publique]

**Processus:**
1. Signaler la vulnérabilité
2. Confirmation de réception (24h)
3. Évaluation de la criticité
4. Correction et déploiement
5. Notification du reporter
6. Publication (si approprié)

**Récompenses:**
- 🏆 Critique: 500€ - 2000€
- 🥈 Majeur: 100€ - 500€
- 🥉 Mineur: Remerciements publics

---

## ✅ Checklist de Sécurité

### Avant Chaque Déploiement

- [ ] Tests de sécurité passés
- [ ] Scan de vulnérabilités OK
- [ ] Dépendances à jour
- [ ] Secrets non exposés
- [ ] HTTPS configuré
- [ ] Headers de sécurité OK
- [ ] Rate limiting testé
- [ ] Backup récent disponible

### Mensuellement

- [ ] Revue des logs de sécurité
- [ ] Mise à jour des dépendances
- [ ] Test de restauration backup
- [ ] Revue des permissions
- [ ] Audit des accès admin

### Annuellement

- [ ] Audit de sécurité complet
- [ ] Penetration testing
- [ ] Revue de la politique
- [ ] Formation de l'équipe
- [ ] Mise à jour de la documentation

---

## 📚 Ressources

### Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

### Outils

- [Snyk](https://snyk.io/) - Scan de vulnérabilités
- [OWASP ZAP](https://www.zaproxy.org/) - Penetration testing
- [SSL Labs](https://www.ssllabs.com/) - Test SSL/TLS

---

**Cette politique est revue et mise à jour régulièrement pour s'adapter aux nouvelles menaces et meilleures pratiques.**

**Dernière mise à jour**: 8 Novembre 2025  
**Prochaine revue**: 8 Février 2026
