# 🧪 Tests des Flows Critiques - By Project

**Date**: 8 Novembre 2025  
**Version**: 1.0  
**Objectif**: Valider tous les flows critiques avant mise en production

---

## 📋 Vue d'Ensemble

**Durée estimée totale:** 4 heures  
**Nombre de flows:** 8 flows critiques  
**Environnement:** Production (ou staging identique)

---

## ✅ Checklist Pré-Tests

### Préparation
- [ ] Environnement de test prêt
- [ ] Variables d'environnement configurées
- [ ] Base de données accessible
- [ ] Supabase Dashboard ouvert
- [ ] Console navigateur ouverte (F12)
- [ ] Outil de capture d'écran prêt
- [ ] Document de rapport de bugs prêt

### Vérifications Initiales
- [ ] Site accessible (https://byproject.netlify.app)
- [ ] SSL/HTTPS actif
- [ ] Pas d'erreurs console au chargement
- [ ] Page d'accueil se charge correctement

---

## 🔐 FLOW 1: Inscription avec Vérification Email

**Durée:** 30 minutes  
**Priorité:** 🔴 CRITIQUE

### Étapes de Test

#### 1.1 Accès à la Page d'Inscription
```
URL: /signup
```

**Actions:**
- [ ] Naviguer vers `/signup`
- [ ] Vérifier que la page se charge sans erreur
- [ ] Vérifier la présence du logo
- [ ] Vérifier tous les champs du formulaire

**Résultat attendu:**
- ✅ Page se charge en < 2s
- ✅ Formulaire complet visible
- ✅ Pas d'erreurs console

#### 1.2 Validation du Formulaire
**Actions:**
- [ ] Essayer de soumettre formulaire vide
- [ ] Entrer email invalide (ex: "test@")
- [ ] Entrer mot de passe faible (ex: "123")
- [ ] Vérifier messages d'erreur

**Résultat attendu:**
- ✅ Messages d'erreur clairs
- ✅ Champs requis indiqués
- ✅ Validation email format
- ✅ Validation mot de passe fort

#### 1.3 Inscription Valide
**Données de test:**
```
Email: test+[timestamp]@example.com
Nom: Test User
Mot de passe: TestPass123!@#
```

**Actions:**
- [ ] Remplir tous les champs avec données valides
- [ ] Cocher conditions d'utilisation (si présent)
- [ ] Cliquer sur "S'inscrire"
- [ ] Observer le comportement

**Résultat attendu:**
- ✅ Formulaire soumis sans erreur
- ✅ Message de succès affiché
- ✅ Redirection vers page de vérification ou dashboard
- ✅ Toast notification visible

#### 1.4 Vérification Email Envoyé
**Actions:**
- [ ] Ouvrir boîte mail (test+[timestamp]@example.com)
- [ ] Chercher email de By Project
- [ ] Vérifier contenu de l'email
- [ ] Vérifier présence du lien de confirmation

**Résultat attendu:**
- ✅ Email reçu en < 2 minutes
- ✅ Expéditeur correct (noreply@byproject.com ou Supabase)
- ✅ Lien de confirmation présent
- ✅ Design email professionnel

#### 1.5 Confirmation Email
**Actions:**
- [ ] Cliquer sur le lien de confirmation
- [ ] Observer la redirection
- [ ] Vérifier page de confirmation

**Résultat attendu:**
- ✅ Redirection vers `/auth/confirm`
- ✅ Message "Email confirmé !" affiché
- ✅ Icône de succès (checkmark vert)
- ✅ Redirection automatique vers dashboard après 3s

#### 1.6 Vérification Base de Données
**Actions:**
- [ ] Ouvrir Supabase Dashboard
- [ ] Aller dans Authentication → Users
- [ ] Chercher l'utilisateur créé
- [ ] Vérifier `email_confirmed_at`

**Résultat attendu:**
- ✅ Utilisateur présent dans la liste
- ✅ `email_confirmed_at` renseigné
- ✅ Statut "Confirmed"

#### 1.7 Connexion Post-Confirmation
**Actions:**
- [ ] Se déconnecter
- [ ] Aller sur `/login`
- [ ] Se connecter avec les identifiants
- [ ] Vérifier accès au dashboard

**Résultat attendu:**
- ✅ Connexion réussie
- ✅ Redirection vers `/dashboard`
- ✅ Nom utilisateur affiché
- ✅ Pas d'erreurs

---

## 🔑 FLOW 2: Récupération de Mot de Passe

**Durée:** 20 minutes  
**Priorité:** 🔴 CRITIQUE

### Étapes de Test

#### 2.1 Accès à la Page Forgot Password
```
URL: /forgot-password
```

**Actions:**
- [ ] Naviguer vers `/forgot-password`
- [ ] Vérifier présence du formulaire
- [ ] Vérifier lien retour vers login

**Résultat attendu:**
- ✅ Page se charge correctement
- ✅ Champ email présent
- ✅ Bouton "Envoyer le lien"

#### 2.2 Email Invalide
**Actions:**
- [ ] Entrer email invalide (ex: "notanemail")
- [ ] Cliquer sur "Envoyer"
- [ ] Observer le message d'erreur

**Résultat attendu:**
- ✅ Message d'erreur format email
- ✅ Formulaire non soumis

#### 2.3 Email Valide
**Données de test:**
```
Email: [utilisateur créé précédemment]
```

**Actions:**
- [ ] Entrer email valide
- [ ] Cliquer sur "Envoyer le lien"
- [ ] Observer le comportement

**Résultat attendu:**
- ✅ Message "Email envoyé !"
- ✅ Icône de succès
- ✅ Instructions affichées
- ✅ Bouton "Renvoyer l'email" visible

#### 2.4 Email de Récupération
**Actions:**
- [ ] Ouvrir boîte mail
- [ ] Chercher email de récupération
- [ ] Vérifier contenu
- [ ] Cliquer sur le lien

**Résultat attendu:**
- ✅ Email reçu en < 2 minutes
- ✅ Lien de réinitialisation présent
- ✅ Redirection vers `/reset-password`

#### 2.5 Réinitialisation du Mot de Passe
```
URL: /reset-password?token=...
```

**Données de test:**
```
Nouveau mot de passe: NewPass456!@#
Confirmation: NewPass456!@#
```

**Actions:**
- [ ] Vérifier présence des champs
- [ ] Entrer nouveau mot de passe
- [ ] Confirmer mot de passe
- [ ] Cliquer sur "Réinitialiser"

**Résultat attendu:**
- ✅ Validation mot de passe fort
- ✅ Vérification correspondance
- ✅ Message de succès
- ✅ Redirection vers login

#### 2.6 Connexion avec Nouveau Mot de Passe
**Actions:**
- [ ] Aller sur `/login`
- [ ] Utiliser email + nouveau mot de passe
- [ ] Se connecter

**Résultat attendu:**
- ✅ Connexion réussie
- ✅ Accès au dashboard
- ✅ Ancien mot de passe ne fonctionne plus

---

## 🔐 FLOW 3: Changement de Mot de Passe (Connecté)

**Durée:** 15 minutes  
**Priorité:** 🔴 CRITIQUE

### Étapes de Test

#### 3.1 Accès aux Paramètres
```
URL: /dashboard/settings
```

**Actions:**
- [ ] Se connecter
- [ ] Naviguer vers `/dashboard/settings`
- [ ] Chercher section "Sécurité"
- [ ] Vérifier présence du formulaire

**Résultat attendu:**
- ✅ Page settings accessible
- ✅ Formulaire changement mot de passe visible
- ✅ 3 champs présents (actuel, nouveau, confirmation)

#### 3.2 Validation du Mot de Passe
**Actions:**
- [ ] Entrer mot de passe faible (ex: "abc")
- [ ] Observer les indicateurs de validation

**Résultat attendu:**
- ✅ Indicateurs visuels (rouge/vert)
- ✅ Critères affichés:
  - Minimum 8 caractères
  - Majuscule
  - Minuscule
  - Chiffre
  - Caractère spécial

#### 3.3 Mots de Passe Non Correspondants
**Actions:**
- [ ] Entrer nouveau mot de passe valide
- [ ] Entrer confirmation différente
- [ ] Observer le message

**Résultat attendu:**
- ✅ Message "Les mots de passe ne correspondent pas"
- ✅ Bouton submit désactivé

#### 3.4 Changement Réussi
**Données de test:**
```
Nouveau mot de passe: SecurePass789!@#
Confirmation: SecurePass789!@#
```

**Actions:**
- [ ] Entrer nouveau mot de passe valide
- [ ] Confirmer
- [ ] Cliquer sur "Changer le mot de passe"

**Résultat attendu:**
- ✅ Toast "Mot de passe modifié avec succès !"
- ✅ Formulaire réinitialisé
- ✅ Pas d'erreurs

#### 3.5 Vérification
**Actions:**
- [ ] Se déconnecter
- [ ] Se reconnecter avec nouveau mot de passe

**Résultat attendu:**
- ✅ Connexion réussie avec nouveau mot de passe
- ✅ Ancien mot de passe ne fonctionne plus

---

## 👤 FLOW 4: Gestion du Profil Utilisateur

**Durée:** 15 minutes  
**Priorité:** 🟡 IMPORTANT

### Étapes de Test

#### 4.1 Accès au Profil
```
URL: /dashboard/profile
```

**Actions:**
- [ ] Se connecter
- [ ] Naviguer vers `/dashboard/profile`
- [ ] Vérifier affichage des informations

**Résultat attendu:**
- ✅ Nom complet affiché
- ✅ Email affiché
- ✅ Badge vérification email (Vérifié/Non vérifié)
- ✅ Date de création affichée
- ✅ Bouton "Modifier" présent

#### 4.2 Modification du Nom
**Actions:**
- [ ] Cliquer sur "Modifier"
- [ ] Changer le nom complet
- [ ] Cliquer sur "Sauvegarder"

**Résultat attendu:**
- ✅ Champ devient éditable
- ✅ Toast "Profil mis à jour !"
- ✅ Nouveau nom affiché
- ✅ Changement persisté (refresh page)

#### 4.3 Annulation
**Actions:**
- [ ] Cliquer sur "Modifier"
- [ ] Changer le nom
- [ ] Cliquer sur "Annuler"

**Résultat attendu:**
- ✅ Changements annulés
- ✅ Nom original restauré
- ✅ Mode édition désactivé

---

## ⚙️ FLOW 5: Gestion des Préférences

**Durée:** 15 minutes  
**Priorité:** 🟡 IMPORTANT

### Étapes de Test

#### 5.1 Accès aux Paramètres
```
URL: /dashboard/settings
```

**Actions:**
- [ ] Naviguer vers `/dashboard/settings`
- [ ] Vérifier sections présentes

**Résultat attendu:**
- ✅ Section Langue
- ✅ Section Notifications
- ✅ Section Apparence
- ✅ Section Sécurité

#### 5.2 Changement de Langue
**Actions:**
- [ ] Sélectionner langue différente (ex: English)
- [ ] Observer le comportement

**Résultat attendu:**
- ✅ Toast "Préférences sauvegardées !"
- ✅ Changement immédiat (auto-save)
- ✅ Persisté après refresh

#### 5.3 Changement de Thème
**Actions:**
- [ ] Sélectionner thème différent (ex: Sombre)
- [ ] Observer le comportement

**Résultat attendu:**
- ✅ Toast de confirmation
- ✅ Changement sauvegardé
- ✅ Persisté après refresh

#### 5.4 Notifications
**Actions:**
- [ ] Toggle "Notifications par email"
- [ ] Toggle "Notifications de projet"
- [ ] Observer le comportement

**Résultat attendu:**
- ✅ Toast pour chaque changement
- ✅ État sauvegardé immédiatement
- ✅ Persisté après refresh

#### 5.5 Vérification Base de Données
**Actions:**
- [ ] Ouvrir Supabase Dashboard
- [ ] Table Editor → user_preferences
- [ ] Chercher ligne de l'utilisateur
- [ ] Vérifier valeurs

**Résultat attendu:**
- ✅ Ligne existe pour l'utilisateur
- ✅ Valeurs correspondent aux choix
- ✅ `updated_at` récent

---

## 🔒 FLOW 6: RLS Policies (Row Level Security)

**Durée:** 30 minutes  
**Priorité:** 🔴 CRITIQUE

### Étapes de Test

#### 6.1 Préparation
**Actions:**
- [ ] Créer 2 utilisateurs différents (User A et User B)
- [ ] User A: Créer un projet
- [ ] User A: Ajouter des matériaux au projet
- [ ] Noter les IDs

#### 6.2 Test Isolation Projets
**Actions:**
- [ ] Se connecter en tant que User B
- [ ] Essayer d'accéder au projet de User A
  ```
  URL: /dashboard/projects/[project_id_de_user_a]
  ```

**Résultat attendu:**
- ✅ Accès refusé ou page vide
- ✅ Pas de données affichées
- ✅ Message d'erreur approprié

#### 6.3 Test API Directe
**Actions:**
- [ ] Ouvrir console navigateur (F12)
- [ ] Exécuter requête Supabase:
  ```javascript
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', '[project_id_de_user_a]');
  console.log(data, error);
  ```

**Résultat attendu:**
- ✅ `data` vide ou null
- ✅ Pas d'accès aux données d'un autre utilisateur

#### 6.4 Test Autres Tables
**Tables à tester:**
- [ ] materials
- [ ] prices
- [ ] notifications
- [ ] user_preferences
- [ ] user_profiles

**Pour chaque table:**
- [ ] Essayer de lire données d'un autre user
- [ ] Essayer de modifier données d'un autre user
- [ ] Essayer de supprimer données d'un autre user

**Résultat attendu:**
- ✅ Accès refusé pour toutes les opérations
- ✅ Erreur RLS policy
- ✅ Données protégées

---

## 📊 FLOW 7: Analytics Dashboard

**Durée:** 20 minutes  
**Priorité:** 🟡 IMPORTANT

### Étapes de Test

#### 7.1 Accès Admin
```
URL: /admin/analytics
```

**Actions:**
- [ ] Se connecter en tant qu'admin
- [ ] Naviguer vers `/admin/analytics`
- [ ] Vérifier chargement de la page

**Résultat attendu:**
- ✅ Page se charge en < 3s
- ✅ Pas d'erreurs console
- ✅ Données affichées

#### 7.2 KPIs Principaux
**Actions:**
- [ ] Vérifier affichage des 4 KPIs:
  - Total utilisateurs
  - Total projets
  - Revenu total
  - Projets actifs
- [ ] Vérifier indicateurs de tendance (↗️ ↘️)

**Résultat attendu:**
- ✅ Chiffres cohérents
- ✅ Tendances affichées
- ✅ Format devise correct (XAF)

#### 7.3 Sélecteur de Période
**Actions:**
- [ ] Cliquer sur "7 jours"
- [ ] Observer changement des données
- [ ] Cliquer sur "90 jours"
- [ ] Observer changement

**Résultat attendu:**
- ✅ Données se mettent à jour
- ✅ Spinner de chargement visible
- ✅ Nouvelles données affichées

#### 7.4 Actualiser
**Actions:**
- [ ] Cliquer sur bouton "Actualiser"
- [ ] Observer le comportement

**Résultat attendu:**
- ✅ Icône rotation (spinner)
- ✅ Données rechargées
- ✅ Toast ou indication de succès

#### 7.5 Visualisations
**Actions:**
- [ ] Vérifier "Projets par Statut"
- [ ] Vérifier "Matériaux par Catégorie"
- [ ] Vérifier "Top Utilisateurs"
- [ ] Vérifier "Activité Récente"

**Résultat attendu:**
- ✅ Toutes les visualisations affichées
- ✅ Données cohérentes
- ✅ Barres de progression fonctionnelles

---

## 🔍 FLOW 8: Création et Gestion de Projet

**Durée:** 30 minutes  
**Priorité:** 🔴 CRITIQUE

### Étapes de Test

#### 8.1 Création de Projet
```
URL: /dashboard/projects
```

**Actions:**
- [ ] Cliquer sur "Nouveau projet"
- [ ] Remplir nom du projet
- [ ] Uploader fichier (Excel/CSV/PDF) ou créer vide
- [ ] Cliquer sur "Créer"

**Résultat attendu:**
- ✅ Projet créé avec succès
- ✅ Toast de confirmation
- ✅ Redirection vers page du projet
- ✅ Projet visible dans la liste

#### 8.2 Ajout de Matériaux
**Actions:**
- [ ] Dans le projet, cliquer "Ajouter matériau"
- [ ] Remplir les champs:
  - Nom
  - Catégorie
  - Quantité
  - Spécifications
- [ ] Sauvegarder

**Résultat attendu:**
- ✅ Matériau ajouté
- ✅ Visible dans la liste
- ✅ Données correctes

#### 8.3 Ajout de Prix
**Actions:**
- [ ] Sélectionner un matériau
- [ ] Ajouter un prix:
  - Fournisseur
  - Pays
  - Montant
  - Devise
- [ ] Sauvegarder

**Résultat attendu:**
- ✅ Prix ajouté
- ✅ Conversion automatique (si applicable)
- ✅ Affiché correctement

#### 8.4 Comparaison
**Actions:**
- [ ] Naviguer vers page de comparaison
- [ ] Vérifier calculs
- [ ] Vérifier affichage

**Résultat attendu:**
- ✅ Comparaison Local vs Chine
- ✅ Calculs corrects
- ✅ Transport maritime inclus
- ✅ Drapeaux pays affichés

#### 8.5 Export PDF
**Actions:**
- [ ] Cliquer sur "Exporter PDF"
- [ ] Attendre génération
- [ ] Ouvrir le PDF

**Résultat attendu:**
- ✅ PDF généré sans erreur
- ✅ Contenu correct
- ✅ Mise en page professionnelle
- ✅ Toutes les données présentes

---

## 📝 Rapport de Tests

### Template de Rapport

```markdown
# Rapport de Tests - [Date]

## Résumé
- Tests effectués: X/8
- Tests réussis: X
- Tests échoués: X
- Bugs trouvés: X

## Détails par Flow

### FLOW 1: Inscription
- ✅ Réussi / ❌ Échoué
- Bugs: [Liste]
- Notes: [Observations]

### FLOW 2: Récupération Mot de Passe
- ✅ Réussi / ❌ Échoué
- Bugs: [Liste]
- Notes: [Observations]

[... pour chaque flow]

## Bugs Identifiés

### Bug #1
- **Sévérité**: Critique / Majeur / Mineur
- **Flow**: [Nom du flow]
- **Description**: [Description détaillée]
- **Steps to reproduce**:
  1. [Étape 1]
  2. [Étape 2]
- **Résultat attendu**: [...]
- **Résultat obtenu**: [...]
- **Screenshots**: [Liens]

## Recommandations
- [Liste des recommandations]

## Conclusion
- ✅ Prêt pour production
- ⚠️ Corrections mineures nécessaires
- ❌ Corrections majeures nécessaires
```

---

## 🎯 Critères de Validation

### Pour Passer en Production

**Obligatoire (100%):**
- ✅ FLOW 1: Inscription - 100% réussi
- ✅ FLOW 2: Récupération mot de passe - 100% réussi
- ✅ FLOW 3: Changement mot de passe - 100% réussi
- ✅ FLOW 6: RLS Policies - 100% réussi
- ✅ FLOW 8: Création projet - 100% réussi

**Important (90%+):**
- ✅ FLOW 4: Profil utilisateur - 90%+ réussi
- ✅ FLOW 5: Préférences - 90%+ réussi
- ✅ FLOW 7: Analytics - 90%+ réussi

**Bugs:**
- ❌ 0 bug critique
- ⚠️ Max 2 bugs majeurs (avec plan de correction)
- ✅ Bugs mineurs acceptables

---

## 🔧 Outils Recommandés

### Navigateurs à Tester
- [ ] Chrome (dernière version)
- [ ] Firefox (dernière version)
- [ ] Safari (si Mac)
- [ ] Edge (dernière version)

### Outils de Test
- [ ] Console navigateur (F12)
- [ ] Supabase Dashboard
- [ ] Postman (pour tests API)
- [ ] Lighthouse (performance)
- [ ] Screenshot tool

### Monitoring
- [ ] Sentry (erreurs)
- [ ] Supabase Logs
- [ ] Netlify Logs

---

## ✅ Checklist Post-Tests

- [ ] Tous les flows testés
- [ ] Rapport de tests complété
- [ ] Bugs documentés
- [ ] Screenshots capturés
- [ ] Corrections prioritaires identifiées
- [ ] Plan d'action défini
- [ ] Équipe informée des résultats

---

**Bon courage pour les tests ! 🚀**
