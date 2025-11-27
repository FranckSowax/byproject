# Documentation Fonctionnelle Détaillée - CompaChantier

Ce document détaille chaque fonctionnalité de l'application, en précisant les données techniques (tables, fonctions) et les aspects visuels (design, couleurs).

---

## 1. Authentification & Profils Utilisateurs
*Gestion de l'inscription, de la connexion et des informations personnelles.*

### 🛠 Technique
*   **Tables Utilisées :**
    *   `auth.users` (Système Supabase) : Stocke l'email, le mot de passe crypté et l'ID unique (UUID).
    *   `public.profiles` : Extension du profil utilisateur.
        *   `id` : UUID (lié à auth.users).
        *   `full_name` : Nom complet.
        *   `avatar_url` : Photo de profil.
        *   `updated_at` : Date de modification.
    *   `public.roles` : Gère les permissions (`admin`, `user`, `supplier`).

*   **Fonctions Clés :**
    *   `handle_new_user` (Trigger SQL) : Se déclenche automatiquement après une inscription pour créer une ligne vide dans `public.profiles`.
    *   `updateProfile` (Frontend) : Met à jour les informations via Supabase SDK.

### 🎨 Design & Couleurs
*   **Style Global :** Épuré et centré pour maximiser la concentration.
*   **Couleurs :**
    *   Fond de page : Blanc (`bg-background`) ou gris très clair.
    *   Boutons d'action : Bleu primaire (`bg-primary` / `oklch(0.55 0.22 285)`).
*   **Composants :**
    *   `Card` : Conteneur blanc avec ombre légère pour le formulaire de login.
    *   `Input` : Champs de saisie avec bordure grise claire qui devient bleue au focus (`ring-primary`).

---

## 2. Tableau de Bord (Dashboard)
*Vue d'ensemble de tous les projets de l'utilisateur.*

### 🛠 Technique
*   **Tables Utilisées :**
    *   `projects` :
        *   `id` : Identifiant unique du projet.
        *   `name` : Nom du chantier.
        *   `user_id` : Propriétaire du projet.
        *   `created_at` : Date de création (utilisé pour le tri).
        *   `status` : État du projet (ex: en cours, terminé).

*   **Fonctions Clés :**
    *   `loadProjects` (Frontend) : Récupère la liste des projets. La sécurité RLS (Row Level Security) filtre automatiquement pour ne renvoyer que les projets de l'utilisateur connecté.

### 🎨 Design & Couleurs
*   **Fond de Page :** Dégradé subtil signature (`bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30`).
*   **Cartes Projets :**
    *   Fond blanc transluscide (`bg-white/80 backdrop-blur-sm`).
    *   Effet au survol : Légère élévation (`hover:shadow-md`).
*   **Typographie :**
    *   Titres : Gris foncé (`text-slate-900`).
    *   Dates/Infos : Gris moyen (`text-slate-500`).

---

## 3. Détail d'un Projet & Matériaux
*Le cœur de l'application : gestion des besoins matériels du chantier.*

### 🛠 Technique
*   **Tables Utilisées :**
    *   `materials` :
        *   `project_id` : Lien vers le projet.
        *   `name` : Nom du matériau.
        *   `category` : Catégorie (Gros œuvre, Électricité, etc.).
        *   `quantity`, `unit` : Métriques.
        *   `specs` (JSONB) : Stocke des caractéristiques flexibles (dimensions, couleur...).
        *   `images` (Array) : URLs des photos stockées.
    *   `project_collaborators` : Gère les droits (Qui peut voir/modifier ce projet).

*   **Fonctions Clés :**
    *   **Import Intelligent (`/api/ai/map-columns`)** :
        *   Analyse un fichier Excel/CSV uploadé.
        *   Utilise l'IA pour deviner que la colonne "Qté" correspond au champ `quantity`.
        *   Retourne un mapping JSON pour insérer les données correctement.
    *   `createClient` : Initialise la connexion Supabase côté client.

### 🎨 Design & Couleurs
*   **Interface :**
    *   En-tête avec fil d'ariane (Breadcrumbs).
    *   Barre d'actions (Boutons "Importer", "Nouveau Matériau").
*   **Liste des Matériaux :**
    *   Présentation en Grille ou Liste.
    *   Icônes par catégorie (ex: Brique pour Gros œuvre).
*   **Modales (Dialog) :**
    *   Utilisées pour l'édition et l'ajout pour ne pas quitter la page contextuelle.
    *   Boutons de validation verts (`bg-green-600`) ou bleus.

---

## 4. Gestion des Prix & Fournisseurs
*Comparaison des offres pour chaque matériau.*

### 🛠 Technique
*   **Tables Utilisées :**
    *   `suppliers` :
        *   `name`, `country`, `contact_info` (email, whatsapp).
    *   `prices` :
        *   `material_id` : Lien vers le matériau.
        *   `supplier_id` : Lien vers le fournisseur.
        *   `amount` : Prix original (ex: 100 RMB).
        *   `currency` : Devise d'origine.
        *   `converted_amount` : Prix calculé en FCFA.
    *   `exchange_rates` : Taux de conversion (ex: 1 RMB = 85 FCFA).

*   **Fonctions Clés :**
    *   **Calcul de conversion :** `converted_amount = amount * rate` (effectué à la volée lors de l'ajout).
    *   `uploadPhotosToStorage` : Envoie les photos de preuves (factures, produits) dans le bucket `price-proofs`.

### 🎨 Design & Couleurs
*   **Tableau de Prix :**
    *   Mise en avant du **Prix Converti** (souvent en gras).
    *   Badges colorés pour les statuts ("Meilleure offre" en vert).
*   **Indicateurs Pays :** Affichage du drapeau ou nom du pays d'origine (Chine, Turquie, Local).

---

## 5. Demande de Cotation (Sourcing)
*Module permettant de générer un lien public pour les fournisseurs.*

### 🛠 Technique
*   **Tables Utilisées :**
    *   `supplier_requests` :
        *   `public_token` : Clé unique (32 caractères) pour l'URL publique.
        *   `status` : État (`pending`, `open`, `closed`).
        *   `materials_snapshot` (JSONB) : Copie figée des matériaux demandés.

*   **Fonctions Clés :**
    *   `nanoid()` : Génère le token sécurisé aléatoire.
    *   `createQuotationRequest` : Création atomique de la demande et du snapshot.

### 🎨 Design & Couleurs
*   **Page de Création :**
    *   Style "Wizard" (Étape par étape).
    *   Illustration "Globe" dans un dégradé bleu/violet pour évoquer l'international.
*   **Interface Fournisseur (Externe) :**
    *   **Très sobre et professionnelle.**
    *   Optimisée pour mobile (responsive).
    *   Champs de saisie larges et clairs.

---

## 6. Administration Globale
*Back-office pour gérer la plateforme.*

### 🛠 Technique
*   **Tables Utilisées :**
    *   `exchange_rates` : Table de référence pour les devises.
    *   `global_materials` : Bibliothèque standard de matériaux.
    *   `system_logs` : Traçabilité des erreurs et actions importantes.

*   **Fonctions Clés :**
    *   Gestion CRUD (Create, Read, Update, Delete) sur toutes les tables référentielles.

### 🎨 Design & Couleurs
*   **Navigation :** Sidebar sombre (`bg-slate-900`, texte blanc) pour bien distinguer de l'interface utilisateur.
*   **Contenu :** Tableaux de données denses (Data Grids) pour une gestion efficace.
*   **Dashboard Admin :** Graphiques de statistiques.

---

## 7. Services IA & API
*L'intelligence du système.*

### 🤖 Traduction (`/api/translate`)
*   **Rôle :** Traduire les descriptions techniques pour les fournisseurs étrangers.
*   **Technique :** Appel API OpenAI/DeepSeek avec prompt contextuel ("Tu es un expert BTP...").
*   **Tables :** Met à jour les champs traduits dans les objets JSON temporaires.

### 🤖 Analyse de Fichiers (`/api/ai/map-columns`)
*   **Rôle :** Comprendre la structure des fichiers Excel importés.
*   **Technique :** Envoie les en-têtes du fichier à l'IA pour obtenir un mapping vers la base de données.
*   **Feedback Visuel :**
    *   Barres de progression animées.
    *   Messages d'état : "L'IA analyse votre fichier..."
