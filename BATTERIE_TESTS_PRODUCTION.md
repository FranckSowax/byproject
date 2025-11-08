# 🧪 Batterie de Tests - Production

**Date**: 8 Novembre 2025  
**Version**: 1.0  
**Objectif**: Valider la mise en production de By Project

---

## 📋 Vue d'Ensemble

Cette batterie de tests couvre tous les aspects critiques de l'application pour garantir une mise en production sécurisée et stable.

**Durée estimée totale**: 40-50 heures  
**Équipe recommandée**: 2-3 testeurs

---

## 1. TESTS FONCTIONNELS (15h)

### 1.1 Authentification (2h)

#### Test 1.1.1 - Inscription
- [ ] Inscription avec email valide
- [ ] Inscription avec email invalide (doit échouer)
- [ ] Inscription avec email déjà utilisé (doit échouer)
- [ ] Inscription avec mot de passe faible (vérifier politique)
- [ ] Vérification email envoyé (si implémenté)
- [ ] Redirection après inscription

#### Test 1.1.2 - Connexion
- [ ] Connexion avec identifiants corrects
- [ ] Connexion avec identifiants incorrects (doit échouer)
- [ ] Connexion avec email non vérifié (comportement attendu)
- [ ] Remember me fonctionne
- [ ] Redirection après connexion

#### Test 1.1.3 - Déconnexion
- [ ] Déconnexion réussie
- [ ] Session supprimée
- [ ] Redirection vers page d'accueil
- [ ] Impossible d'accéder aux pages protégées après déconnexion

#### Test 1.1.4 - Récupération mot de passe
- [ ] Demande de réinitialisation
- [ ] Email reçu avec lien
- [ ] Lien valide pendant 24h
- [ ] Changement de mot de passe réussi
- [ ] Connexion avec nouveau mot de passe

---

### 1.2 Gestion de Projets (3h)

#### Test 1.2.1 - Création de projet
- [ ] Créer projet avec nom uniquement
- [ ] Créer projet avec image
- [ ] Créer projet avec fichier Excel
- [ ] Créer projet avec fichier CSV
- [ ] Créer projet avec fichier PDF
- [ ] Vérifier que le projet apparaît dans la liste
- [ ] Vérifier les permissions (owner)

#### Test 1.2.2 - Modification de projet
- [ ] Modifier le nom
- [ ] Modifier l'image
- [ ] Vérifier que les modifications sont sauvegardées
- [ ] Vérifier les permissions (seul owner/editor peut modifier)

#### Test 1.2.3 - Suppression de projet
- [ ] Supprimer un projet
- [ ] Confirmation demandée
- [ ] Projet supprimé de la liste
- [ ] Matériaux associés supprimés (cascade)
- [ ] Prix associés supprimés (cascade)

#### Test 1.2.4 - Partage de projet
- [ ] Partager avec un autre utilisateur (viewer)
- [ ] Partager avec un autre utilisateur (editor)
- [ ] Vérifier que l'invité reçoit notification
- [ ] Vérifier les permissions viewer (lecture seule)
- [ ] Vérifier les permissions editor (modification)
- [ ] Révoquer un accès

---

### 1.3 Gestion de Matériaux (4h)

#### Test 1.3.1 - Ajout manuel
- [ ] Ajouter un matériau avec nom uniquement
- [ ] Ajouter un matériau avec tous les champs
- [ ] Ajouter une image au matériau
- [ ] Vérifier validation des champs
- [ ] Vérifier que le matériau apparaît dans la liste

#### Test 1.3.2 - Import IA
- [ ] Importer fichier Excel valide
- [ ] Importer fichier CSV valide
- [ ] Importer fichier avec colonnes non standard
- [ ] Vérifier que l'IA mappe correctement les colonnes
- [ ] Vérifier que tous les matériaux sont importés
- [ ] Importer fichier corrompu (doit échouer gracieusement)
- [ ] Importer fichier trop volumineux (>10MB)

#### Test 1.3.3 - Modification de matériau
- [ ] Modifier le nom
- [ ] Modifier la quantité
- [ ] Modifier les specs
- [ ] Ajouter/supprimer une image
- [ ] Vérifier sauvegarde

#### Test 1.3.4 - Suppression de matériau
- [ ] Supprimer un matériau sans prix
- [ ] Supprimer un matériau avec prix (cascade)
- [ ] Confirmation demandée
- [ ] Vérifier suppression

#### Test 1.3.5 - Commentaires
- [ ] Ajouter un commentaire
- [ ] Modifier un commentaire
- [ ] Supprimer un commentaire
- [ ] Vérifier que les commentaires sont visibles par les collaborateurs

---

### 1.4 Gestion des Prix (3h)

#### Test 1.4.1 - Ajout de prix
- [ ] Ajouter prix en FCFA
- [ ] Ajouter prix en CNY (vérifier conversion)
- [ ] Ajouter prix en USD (vérifier conversion)
- [ ] Ajouter prix en EUR (vérifier conversion)
- [ ] Ajouter prix avec nouveau fournisseur
- [ ] Ajouter prix avec fournisseur existant
- [ ] Ajouter photos au prix
- [ ] Vérifier que le taux de change est utilisé

#### Test 1.4.2 - Modification de prix
- [ ] Modifier le montant
- [ ] Modifier la devise (vérifier reconversion)
- [ ] Modifier le fournisseur
- [ ] Ajouter/supprimer des photos
- [ ] Vérifier sauvegarde

#### Test 1.4.3 - Suppression de prix
- [ ] Supprimer un prix
- [ ] Confirmation demandée
- [ ] Vérifier suppression

#### Test 1.4.4 - Fournisseurs
- [ ] Créer un nouveau fournisseur
- [ ] Modifier un fournisseur
- [ ] Vérifier que les infos fournisseur sont affichées avec le prix

---

### 1.5 Comparaison de Prix (2h)

#### Test 1.5.1 - Calculs
- [ ] Vérifier calcul coût total local (meilleurs prix locaux)
- [ ] Vérifier calcul coût total Chine (meilleurs prix chinois)
- [ ] Vérifier calcul frais de transport maritime
- [ ] Vérifier calcul des économies
- [ ] Vérifier pourcentage d'économie
- [ ] Vérifier que les drapeaux s'affichent correctement

#### Test 1.5.2 - Filtres
- [ ] Filtrer par "Tous les pays"
- [ ] Filtrer par "Chine"
- [ ] Filtrer par "Gabon"
- [ ] Filtrer par autres pays
- [ ] Vérifier que les totaux se mettent à jour

#### Test 1.5.3 - Export PDF
- [ ] Générer PDF
- [ ] Vérifier contenu du PDF (résumé, détails, recommandation)
- [ ] Vérifier que les chiffres sont corrects
- [ ] Vérifier que le PDF se télécharge

---

### 1.6 Demandes de Cotation (1h)

#### Test 1.6.1 - Création de demande
- [ ] Créer demande pour projet existant
- [ ] Créer demande pour nouveau projet
- [ ] Vérifier que la demande apparaît dans la liste
- [ ] Vérifier que l'admin reçoit une notification

#### Test 1.6.2 - Lien fournisseur
- [ ] Copier le lien fournisseur
- [ ] Ouvrir le lien dans un navigateur
- [ ] Vérifier que la page se charge
- [ ] Vérifier que les matériaux sont affichés

#### Test 1.6.3 - Soumission fournisseur
- [ ] Remplir informations fournisseur
- [ ] Ajouter prix pour tous les matériaux
- [ ] Soumettre la cotation
- [ ] Vérifier que l'utilisateur reçoit une notification
- [ ] Vérifier que les prix apparaissent dans le projet

---

### 1.7 Notifications (1h)

#### Test 1.7.1 - Notifications utilisateur
- [ ] Recevoir notification de cotation traitée
- [ ] Recevoir notification de cotation reçue
- [ ] Marquer comme lue
- [ ] Supprimer une notification
- [ ] Cliquer sur notification (redirection)

#### Test 1.7.2 - Notifications admin
- [ ] Recevoir notification de nouvelle demande
- [ ] Recevoir notification de nouveau projet
- [ ] Marquer comme lue
- [ ] Supprimer une notification

#### Test 1.7.3 - Temps réel
- [ ] Vérifier que les notifications apparaissent en temps réel
- [ ] Vérifier que le compteur se met à jour
- [ ] Vérifier que le badge disparaît quand tout est lu

---

## 2. TESTS DE SÉCURITÉ (8h)

### 2.1 Injection SQL (2h)
- [ ] Tester injection dans champs de recherche
- [ ] Tester injection dans formulaires
- [ ] Tester injection dans paramètres URL
- [ ] Vérifier que Supabase RLS protège

### 2.2 XSS (Cross-Site Scripting) (2h)
- [ ] Injecter script dans nom de projet
- [ ] Injecter script dans nom de matériau
- [ ] Injecter script dans commentaires
- [ ] Vérifier que le contenu est échappé

### 2.3 CSRF (Cross-Site Request Forgery) (1h)
- [ ] Tenter requête POST depuis site externe
- [ ] Vérifier protection CSRF

### 2.4 Authentification & Autorisation (2h)
- [ ] Accéder à un projet sans être connecté (doit échouer)
- [ ] Accéder à un projet d'un autre utilisateur (doit échouer)
- [ ] Modifier un projet sans permission (doit échouer)
- [ ] Accéder à l'admin sans être admin (doit échouer)
- [ ] Tester toutes les RLS policies

### 2.5 Rate Limiting (1h)
- [ ] Faire 100 requêtes en 1 minute
- [ ] Vérifier que le rate limiting bloque
- [ ] Vérifier message d'erreur approprié

---

## 3. TESTS DE PERFORMANCE (6h)

### 3.1 Temps de Chargement (2h)
- [ ] Page d'accueil < 2s
- [ ] Dashboard < 2s
- [ ] Page projet < 3s
- [ ] Page comparaison < 3s
- [ ] Lighthouse score > 90

### 3.2 Requêtes Lourdes (2h)
- [ ] Projet avec 1000 matériaux
- [ ] Matériau avec 50 prix
- [ ] Comparaison avec 100 matériaux
- [ ] Export PDF de gros projet
- [ ] Vérifier temps de réponse acceptable

### 3.3 Upload de Fichiers (1h)
- [ ] Upload fichier 1MB
- [ ] Upload fichier 5MB
- [ ] Upload fichier 10MB
- [ ] Upload fichier 20MB (doit échouer si limite)
- [ ] Vérifier temps d'upload

### 3.4 Charge Concurrente (1h)
- [ ] 10 utilisateurs simultanés
- [ ] 50 utilisateurs simultanés
- [ ] 100 utilisateurs simultanés
- [ ] Vérifier stabilité
- [ ] Vérifier temps de réponse

---

## 4. TESTS D'INTÉGRATION (4h)

### 4.1 Supabase Auth (1h)
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Session persiste
- [ ] Déconnexion fonctionne

### 4.2 Supabase Database (1h)
- [ ] CRUD sur toutes les tables
- [ ] RLS policies fonctionnent
- [ ] Triggers fonctionnent
- [ ] Relations fonctionnent

### 4.3 Supabase Storage (1h)
- [ ] Upload d'images
- [ ] Upload de fichiers
- [ ] Suppression de fichiers
- [ ] URLs publiques fonctionnent

### 4.4 Supabase Realtime (1h)
- [ ] Notifications en temps réel
- [ ] Mise à jour automatique des données
- [ ] Reconnexion après perte de connexion

---

## 5. TESTS DE COMPATIBILITÉ (3h)

### 5.1 Navigateurs (2h)
- [ ] Chrome (dernière version)
- [ ] Firefox (dernière version)
- [ ] Safari (dernière version)
- [ ] Edge (dernière version)
- [ ] Chrome mobile
- [ ] Safari mobile

### 5.2 Appareils (1h)
- [ ] Desktop 1920x1080
- [ ] Laptop 1366x768
- [ ] Tablet 768x1024
- [ ] Mobile 375x667
- [ ] Mobile 414x896

---

## 6. TESTS DE DONNÉES (4h)

### 6.1 Validation des Entrées (2h)
- [ ] Email invalide
- [ ] Montant négatif
- [ ] Quantité négative
- [ ] Devise inexistante
- [ ] Caractères spéciaux
- [ ] Champs vides requis
- [ ] Longueur maximale dépassée

### 6.2 Formats de Fichiers (1h)
- [ ] Excel (.xlsx)
- [ ] Excel ancien (.xls)
- [ ] CSV
- [ ] PDF
- [ ] Fichier texte (doit échouer)
- [ ] Image (doit échouer pour import matériaux)

### 6.3 Cas Limites (1h)
- [ ] Nom très long (>255 caractères)
- [ ] Montant très élevé (>1 milliard)
- [ ] Quantité très élevée (>1 million)
- [ ] Projet sans matériaux
- [ ] Matériau sans prix
- [ ] Caractères Unicode (émojis, chinois, arabe)

---

## 7. SCÉNARIOS UTILISATEUR COMPLETS (6h)

### Scénario 1 - Nouvel Utilisateur (1.5h)
```
1. Accéder à la page d'accueil
2. Cliquer sur "S'inscrire"
3. Remplir le formulaire d'inscription
4. Vérifier l'email (si implémenté)
5. Se connecter
6. Créer un nouveau projet "Mon Projet Test"
7. Importer un fichier Excel avec 20 matériaux
8. Vérifier que les matériaux sont importés
9. Ajouter manuellement 2 prix pour un matériau
10. Aller sur la page de comparaison
11. Vérifier les calculs
12. Exporter le PDF
13. Créer une demande de cotation
14. Vérifier la notification
15. Se déconnecter
```

### Scénario 2 - Fournisseur (1h)
```
1. Recevoir un lien de cotation par email
2. Ouvrir le lien
3. Remplir les informations fournisseur
4. Ajouter des prix pour 5 matériaux
5. Ajouter des photos
6. Soumettre la cotation
7. Vérifier le message de confirmation
```

### Scénario 3 - Admin (1.5h)
```
1. Se connecter en tant qu'admin
2. Aller sur /admin/supplier-requests
3. Voir la liste des demandes
4. Traiter une demande
5. Aller sur /admin/exchange-rates
6. Modifier le taux CNY de 85 à 90
7. Vérifier qu'un projet existant utilise le nouveau taux
8. Voir les notifications admin
9. Se déconnecter
```

### Scénario 4 - Collaboration (1h)
```
1. User A crée un projet
2. User A partage avec User B (editor)
3. User B reçoit notification
4. User B accepte l'invitation
5. User B modifie un matériau
6. User A voit la modification
7. User A révoque l'accès de User B
8. User B ne peut plus accéder au projet
```

### Scénario 5 - Workflow Complet (1h)
```
1. Créer un projet
2. Importer 50 matériaux via Excel
3. Ajouter 10 prix locaux (Gabon, Cameroun)
4. Demander une cotation chinoise
5. Admin traite la demande
6. 3 fournisseurs chinois soumettent leurs prix
7. User reçoit 3 notifications
8. User va sur la page de comparaison
9. User compare Local vs Chine
10. User exporte le PDF
11. User prend une décision
```

---

## 8. TESTS DE RÉGRESSION (2h)

Après chaque modification, re-tester :

- [ ] Authentification (login/logout)
- [ ] Création de projet
- [ ] Import de matériaux
- [ ] Ajout de prix
- [ ] Calcul de comparaison
- [ ] Demande de cotation
- [ ] Notifications
- [ ] Export PDF

---

## 9. TESTS D'ACCESSIBILITÉ (2h)

### 9.1 Contraste
- [ ] Vérifier ratio de contraste > 4.5:1
- [ ] Tester avec outil (WAVE, axe)

### 9.2 Navigation Clavier
- [ ] Tab pour naviguer
- [ ] Enter pour activer
- [ ] Esc pour fermer modales
- [ ] Tous les éléments accessibles

### 9.3 Screen Readers
- [ ] Tester avec VoiceOver (Mac)
- [ ] Tester avec NVDA (Windows)
- [ ] ARIA labels présents
- [ ] Alt text sur images

---

## 10. TESTS DE CHARGE (4h)

### 10.1 Base de Données
- [ ] 100 utilisateurs
- [ ] 1000 projets
- [ ] 10000 matériaux
- [ ] 50000 prix
- [ ] Vérifier performance

### 10.2 Trafic
- [ ] 100 requêtes/seconde
- [ ] 1000 requêtes/seconde
- [ ] Pic de trafic
- [ ] Vérifier temps de réponse

### 10.3 Stress Test
- [ ] Augmenter charge progressivement
- [ ] Identifier le point de rupture
- [ ] Vérifier récupération après pic

---

## 📊 Rapport de Tests

### Template de Rapport

```markdown
# Rapport de Tests - [Date]

## Résumé
- Tests exécutés: X/Y
- Tests réussis: X
- Tests échoués: Y
- Bugs critiques: Z

## Bugs Identifiés

### Bug #1 - [Titre]
- **Sévérité**: Critique/Majeur/Mineur
- **Description**: ...
- **Steps to reproduce**: ...
- **Expected**: ...
- **Actual**: ...
- **Screenshot**: ...

## Recommandations
- [ ] Bloquer la production
- [ ] Corriger avant production
- [ ] Corriger après production
- [ ] Nice to have

## Conclusion
✅ Prêt pour production
⚠️ Corrections mineures nécessaires
❌ Corrections majeures nécessaires
```

---

## ✅ Critères de Validation

### Pour autoriser la mise en production :

- ✅ **100%** des tests critiques passent
- ✅ **95%** des tests fonctionnels passent
- ✅ **0** bug critique
- ✅ **<5** bugs majeurs
- ✅ Lighthouse score **>90**
- ✅ Temps de réponse **<3s**
- ✅ Uptime test **>99%**
- ✅ Audit de sécurité **validé**

---

**Prochaine étape**: Exécuter les tests et documenter les résultats
