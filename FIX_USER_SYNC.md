# Fix: Synchronisation Auth Users → Public Users

## Problème Identifié

Erreur lors de la création de projet en mode manuel:
```
insert or update on table "projects" violates foreign key constraint "projects_user_id_fkey"
```

## Cause Racine

1. **Double système d'utilisateurs**: 
   - `auth.users` : Gestion de l'authentification Supabase
   - `public.users` : Données métier de l'application

2. **Contrainte de clé étrangère**:
   - La table `projects` référence `public.users.id`
   - Le code utilise `auth.users.id` directement

3. **Utilisateurs non synchronisés**:
   - Certains utilisateurs existaient dans `auth.users` mais pas dans `public.users`
   - Exemple: `ompayijunior@gmail.com` (id: `dd781b7f-d475-4f30-b501-0a96862c31b1`)

## Solution Implémentée via MCP Supabase

### 1. Migration de Synchronisation

Création d'une migration `sync_auth_users_to_public_users` qui:

#### A. Fonction de Synchronisation Automatique
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    (SELECT id FROM public.roles WHERE name = 'Reader' LIMIT 1)
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### B. Trigger Automatique
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

#### C. Synchronisation des Utilisateurs Existants
```sql
INSERT INTO public.users (id, email, full_name, role_id)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
  (SELECT id FROM public.roles WHERE name = 'Reader' LIMIT 1) as role_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

## Résultat

### Avant la Migration
```
auth.users: 3 utilisateurs
public.users: 2 utilisateurs
❌ 1 utilisateur manquant (ompayijunior@gmail.com)
```

### Après la Migration
```
auth.users: 3 utilisateurs
public.users: 3 utilisateurs
✅ Tous les utilisateurs synchronisés
```

### Vérification
```sql
SELECT 
    au.id as auth_user_id, 
    au.email as auth_email,
    pu.id as public_user_id,
    pu.email as public_email,
    pu.full_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id;
```

Résultat:
| auth_user_id | auth_email | public_user_id | public_email | full_name |
|--------------|------------|----------------|--------------|-----------|
| 00000000-... | admin@... | 00000000-... | admin@... | Admin Test |
| 6cc5a262-... | sowaxcom@... | 6cc5a262-... | sowaxcom@... | Sowax |
| dd781b7f-... | ompayijunior@... | dd781b7f-... | ompayijunior@... | ompayijunior@... |

## Avantages de la Solution

✅ **Synchronisation automatique**: Tout nouvel utilisateur dans `auth.users` est automatiquement créé dans `public.users`

✅ **Rétrocompatibilité**: Les utilisateurs existants ont été synchronisés

✅ **Sécurité**: La fonction utilise `SECURITY DEFINER` pour garantir les permissions

✅ **Gestion des conflits**: `ON CONFLICT` évite les doublons et met à jour si nécessaire

✅ **Rôle par défaut**: Tous les nouveaux utilisateurs reçoivent le rôle "Reader"

## Comportement Futur

### Lors de l'inscription d'un nouvel utilisateur:
1. Supabase Auth crée l'utilisateur dans `auth.users`
2. Le trigger `on_auth_user_created` se déclenche automatiquement
3. La fonction `handle_new_user()` crée l'entrée dans `public.users`
4. L'utilisateur peut immédiatement créer des projets

### Lors de la mise à jour d'un utilisateur:
1. Si l'email ou les métadonnées changent dans `auth.users`
2. Le trigger met à jour automatiquement `public.users`
3. Les données restent synchronisées

## Test de Validation

Pour tester la création de projet maintenant:
1. Se connecter avec n'importe quel compte
2. Aller sur "Nouveau Projet"
3. Choisir "Ajout manuel"
4. Remplir le nom du projet
5. Cliquer sur "Créer le Projet"
6. ✅ Le projet devrait se créer sans erreur

## Commandes MCP Utilisées

```typescript
// Lister les projets Supabase
mcp5_list_projects()

// Lister les tables
mcp5_list_tables(project_id, schemas)

// Exécuter des requêtes SQL
mcp5_execute_sql(project_id, query)

// Appliquer une migration
mcp5_apply_migration(project_id, name, query)
```

## Fichiers Impactés

- **Base de données**: Migration appliquée directement via MCP
- **Aucun changement de code**: La solution est entièrement côté base de données
