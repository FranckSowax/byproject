# 📦 Import du Projet SNI - Guide d'utilisation

## 🎯 Objectif

Ce script permet d'importer automatiquement tous les fichiers CSV du dossier `csv/` pour créer un projet complet nommé **"Projet SNI 1 maison"** avec tous les matériaux.

## 📋 Prérequis

1. Les fichiers CSV doivent être dans le dossier `csv/` à la racine du projet
2. Les variables d'environnement Supabase doivent être configurées dans `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 🚀 Utilisation

### 1. Installer les dépendances (si ce n'est pas déjà fait)

```bash
npm install
```

### 2. Exécuter le script d'importation

```bash
npm run import:sni
```

## 📊 Fichiers CSV traités

Le script traite automatiquement tous les fichiers CSV présents dans le dossier `csv/`:

- ✅ COMMANDE 300-ELECTRICITE-Tableau 1.csv
- ✅ COMMANDE 400-PLOMBERIE-Tableau 1.csv
- ✅ COMMANDE 500-REVETEMNT SOL-MUR-Tableau 1.csv
- ✅ COMMANDE 600-CHPENTE-CVERTURE-Tableau 1.csv
- ✅ COMMANDE 700-MENUISERIE BOIS-Tableau 1.csv
- ✅ COMMANDE 700-MENUISERIE ALU-Tableau 1.csv
- ✅ COMMANDE 800-PEINTURE-Tableau 1.csv

## 📝 Structure des données importées

Pour chaque matériau, le script extrait et enregistre:

- **Nom** : Désignation du produit
- **Catégorie** : Extraite du nom du fichier (ex: "300 ELECTRICITE")
- **Quantité** : Quantité du matériau
- **Specs** (JSON):
  - `unit` : Unité de mesure (ml, u, kg, etc.)
  - `prix_unitaire_ht` : Prix unitaire HT
  - `prix_total_ht` : Prix total HT
  - `fournisseur` : Nom du fournisseur
  - `description` : Description (utilise l'unité)

## ✨ Fonctionnalités

- ✅ Création automatique du projet "Projet SNI 1 maison"
- ✅ Extraction intelligente des données depuis les CSV
- ✅ Nettoyage automatique des nombres (suppression des espaces)
- ✅ Catégorisation automatique par type de matériau
- ✅ Insertion par lots pour optimiser les performances
- ✅ Gestion des erreurs avec messages détaillés
- ✅ Logs détaillés du processus d'importation

## 🔍 Exemple de sortie

```
🚀 Début de l'importation du projet SNI...

✅ Utilisateur trouvé: abc123...

✅ Projet créé: Projet SNI 1 maison (ID: xyz789...)

📁 7 fichiers CSV trouvés:

   - COMMANDE 300-ELECTRICITE-Tableau 1.csv
   - COMMANDE 400-PLOMBERIE-Tableau 1.csv
   ...

📄 Traitement de COMMANDE 300-ELECTRICITE-Tableau 1.csv...
   ✅ 28 matériaux extraits

📊 Total: 150 matériaux à insérer

✅ Lot 1: 100 matériaux insérés (Total: 100/150)
✅ Lot 2: 50 matériaux insérés (Total: 150/150)

🎉 Importation terminée avec succès!
   - Projet: Projet SNI 1 maison
   - ID: xyz789...
   - Matériaux insérés: 150/150
```

## 🛠️ Dépannage

### Erreur: "Aucun utilisateur trouvé"
- Assurez-vous qu'au moins un utilisateur existe dans la base de données

### Erreur: "Failed to fetch"
- Vérifiez que les variables d'environnement Supabase sont correctement configurées
- Vérifiez que la connexion à Supabase fonctionne

### Erreur lors du parsing CSV
- Vérifiez que les fichiers CSV sont bien encodés en UTF-8
- Vérifiez que la structure des colonnes correspond au format attendu

## 📧 Support

Pour toute question ou problème, consultez la documentation du projet ou contactez l'équipe de développement.
