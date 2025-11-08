# 📁 Configuration de la Page Templates

## 🚀 Étapes d'Installation

La page de gestion des templates a été créée mais nécessite la configuration de la base de données Supabase.

### 1️⃣ Créer le Bucket Storage

Connectez-vous à votre [projet Supabase](https://supabase.com/dashboard) et créez le bucket storage :

1. Allez dans **Storage** dans le menu de gauche
2. Cliquez sur **New bucket**
3. Nom : `templates`
4. **Public bucket** : ✅ Oui (cochez)
5. Cliquez sur **Create bucket**

### 2️⃣ Exécuter la Migration SQL

Deux options pour exécuter la migration :

#### Option A : Via Supabase Dashboard (Recommandé)

1. Allez dans **SQL Editor** dans le menu Supabase
2. Créez une nouvelle query
3. Copiez tout le contenu du fichier `supabase/migrations/create_templates_table.sql`
4. Collez-le dans l'éditeur
5. Cliquez sur **Run** (ou Ctrl+Enter)

#### Option B : Via Supabase CLI

```bash
# Si vous utilisez le CLI Supabase
supabase db push
```

### 3️⃣ Vérifier l'Installation

Une fois la migration exécutée, vérifiez que tout est en place :

#### Vérifier la table

Dans SQL Editor, exécutez :

```sql
SELECT * FROM public.templates;
```

Vous devriez voir une table vide (aucune erreur).

#### Vérifier le bucket storage

Dans **Storage** → **templates**, le bucket doit apparaître.

#### Vérifier les policies

Dans SQL Editor :

```sql
SELECT * FROM pg_policies WHERE tablename = 'templates';
```

Vous devriez voir 4 policies (SELECT, INSERT, UPDATE, DELETE).

---

## 🎯 Utilisation de la Page

Une fois la configuration terminée :

1. Allez sur `/admin/templates`
2. Cliquez sur **"Nouveau Template"**
3. Remplissez le formulaire :
   - **Nom** : Ex. "Villa Moderne 3 Chambres"
   - **Description** : Description détaillée
   - **Catégorie** : Résidentiel / Commercial / Rénovation
   - **Fichier** : Upload d'un Excel, CSV ou PDF (optionnel)

---

## 📋 Fonctionnalités Disponibles

### ✅ CRUD Complet
- ➕ Créer un template
- ✏️ Modifier un template
- 👁️ Voir les détails
- 🗑️ Supprimer un template
- 📋 Dupliquer un template

### 📤 Import de Fichiers
- **Excel** (.xlsx, .xls) - Pour listes de matériaux
- **CSV** (.csv) - Pour données tabulaires
- **PDF** (.pdf) - Pour plans ou documents
- **Taille max** : 10MB

### 🔍 Recherche & Filtres
- Recherche par nom, description
- Filtre par catégorie
- Compteur de résultats en temps réel

### 📊 Statistiques
- Total templates
- Templates actifs
- Templates avec fichiers
- Templates résidentiels

### 🎭 Statuts
- ✅ **Actif** : Disponible pour utilisation
- ❌ **Inactif** : Masqué des utilisateurs

---

## 🛠️ Structure de la Table

```sql
templates {
  id                UUID            PRIMARY KEY
  name              TEXT            NOT NULL
  description       TEXT            NULLABLE
  category          TEXT            NULLABLE (residential|commercial|renovation)
  file_url          TEXT            NULLABLE
  file_type         TEXT            NULLABLE
  materials_count   INTEGER         DEFAULT 0
  is_active         BOOLEAN         DEFAULT true
  created_at        TIMESTAMPTZ     DEFAULT NOW()
  updated_at        TIMESTAMPTZ     NULLABLE
}
```

---

## 🔐 Permissions (RLS)

Les politiques de sécurité sont configurées pour :

- **Lecture** : Tous les utilisateurs authentifiés
- **Création** : Admins uniquement
- **Modification** : Admins uniquement
- **Suppression** : Admins uniquement

Les admins sont identifiés par `raw_user_meta_data->>'role' = 'admin'`.

---

## 🐛 Résolution des Problèmes

### ❌ Erreur "table templates does not exist"

➡️ **Solution** : Exécutez la migration SQL (Étape 2)

### ❌ Erreur "bucket templates does not exist"

➡️ **Solution** : Créez le bucket storage (Étape 1)

### ❌ Erreur 403 lors de l'upload

➡️ **Solution** : Vérifiez que votre utilisateur a le role 'admin' dans `user_metadata`

```sql
-- Vérifier le role de votre user
SELECT raw_user_meta_data->>'role' 
FROM auth.users 
WHERE email = 'votre@email.com';

-- Si besoin, définir comme admin
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'votre@email.com';
```

### ❌ TypeScript errors sur "templates"

➡️ **Solution** : Les erreurs TypeScript disparaîtront une fois la table créée. Pour forcer la regénération des types :

```bash
# Si vous utilisez Supabase CLI
supabase gen types typescript --local > lib/supabase/database.types.ts
```

---

## 📝 TODO Future

- [ ] Parser automatiquement les fichiers Excel/CSV pour extraire les matériaux
- [ ] Prévisualisation des fichiers PDF dans l'interface
- [ ] Versionning des templates
- [ ] Tags personnalisés pour templates
- [ ] Export de templates en différents formats
- [ ] Templates partagés entre projets

---

## 💡 Exemples d'Utilisation

### Créer un template "Villa Standard"

1. Nom : `Villa Standard 150m²`
2. Description : `Villa résidentielle 3 chambres avec jardin`
3. Catégorie : `Résidentiel`
4. Fichier : Upload `liste_materiaux_villa.xlsx`

### Créer un template "Immeuble Commercial"

1. Nom : `Immeuble 5 étages - R+4`
2. Description : `Immeuble commercial avec parkings`
3. Catégorie : `Commercial`
4. Fichier : Upload `specifications_immeuble.pdf`

---

## 🎉 C'est Prêt !

Une fois ces étapes complétées, la page `/admin/templates` sera entièrement fonctionnelle !

Pour toute question ou problème, vérifiez les logs de la console navigateur et les logs Supabase.
