# 🚨 FIX - Erreur Foreign Key

## ❌ Problème

Erreur lors de la création de projet:
```
insert or update on table "projects" violates foreign key constraint "projects_user_id_fkey"
Key is not present in table "users".
```

## 🔍 Cause

L'utilisateur existe dans `auth.users` (Supabase Auth) mais **PAS** dans la table `users` (table custom).

Cela arrive si:
- Les policies RLS ont bloqué l'insertion lors de l'inscription
- Il y a eu une erreur silencieuse lors de la création du profil

---

## ✅ Solution Rapide

### Vérifier et Créer l'Utilisateur Manuellement

#### 1. Trouver l'ID de l'utilisateur

**Allez sur**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/auth/users
```

**Trouvez** votre utilisateur et **copiez son ID** (UUID)

---

#### 2. Vérifier s'il existe dans la table `users`

**Allez sur**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql
```

**Exécutez**:
```sql
SELECT * FROM users WHERE id = 'VOTRE-USER-ID-ICI';
```

Si **aucun résultat** → L'utilisateur n'existe pas dans `users`

---

#### 3. Créer l'utilisateur dans la table `users`

**Dans le SQL Editor**, exécutez:

```sql
-- Remplacez les valeurs par les vraies
INSERT INTO users (
  id,
  email,
  full_name,
  preferred_language,
  role_id
) VALUES (
  'VOTRE-USER-ID-ICI',  -- ID de auth.users
  'votre@email.com',     -- Votre email
  'Votre Nom',           -- Votre nom
  'fr',                  -- Langue
  3                      -- Reader (3) ou Administrator (1)
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- Créer aussi la subscription
INSERT INTO subscriptions (
  user_id,
  plan,
  project_limit,
  export_limit
) VALUES (
  'VOTRE-USER-ID-ICI',
  'Free',
  5,
  2
) ON CONFLICT DO NOTHING;
```

---

#### 4. Tester

Maintenant essayez de créer un projet:
```
http://localhost:3000/dashboard/projects/new
```

✅ Ça devrait fonctionner!

---

## 🔧 Solution Permanente

Pour éviter ce problème à l'avenir, les policies RLS doivent être correctement configurées.

### Vérifier les Policies

**Allez sur**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/editor
```

**Table `users`** → Onglet "Policies"

Vous devez avoir:
- ✅ "Users can insert their own profile during signup" (INSERT)
- ✅ "Users can view their own profile" (SELECT)
- ✅ "Users can update their own profile" (UPDATE)

Si elles n'existent pas, exécutez:
```
supabase/fix-signup-policies.sql
```

---

## 🧪 Test Complet

### 1. Créer un Nouveau Compte

```
http://localhost:3000/signup
```

### 2. Vérifier dans Supabase

**Auth Users**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/auth/users
```
✅ Utilisateur créé

**Table `users`**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/editor
```
✅ Utilisateur dans la table `users`

**Table `subscriptions`**:
✅ Subscription créée

### 3. Se Connecter et Créer un Projet

Si tout est OK, vous pourrez créer un projet sans erreur!

---

## 💡 Vérification Rapide

Pour vérifier si un utilisateur est complet:

```sql
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  u.full_name,
  u.role_id,
  s.plan
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN subscriptions s ON au.id = s.user_id
WHERE au.email = 'votre@email.com';
```

Résultat attendu:
- ✅ `id` présent
- ✅ `email` présent
- ✅ `full_name` présent (pas NULL)
- ✅ `role_id` présent (pas NULL)
- ✅ `plan` présent (pas NULL)

Si des valeurs sont NULL → Utilisateur incomplet!

---

## 🎯 Checklist

- [ ] Policies RLS créées (`fix-signup-policies.sql`)
- [ ] Utilisateur existe dans `auth.users`
- [ ] Utilisateur existe dans `users`
- [ ] Subscription existe
- [ ] Test de création de projet réussi

---

**Créez l'utilisateur manuellement maintenant!** 🚀

👉 https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql
