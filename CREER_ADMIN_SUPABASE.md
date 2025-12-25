# 🔐 Créer l'Utilisateur Admin dans Supabase

## 🎯 Objectif

Créer un utilisateur admin permanent dans Supabase pour que le mode démo fonctionne complètement avec:
- ✅ Upload de fichiers vers Storage
- ✅ Vraie analyse GPT-4o
- ✅ Matériaux créés en base de données
- ✅ Tout le workflow complet!

---

## 🚀 Méthode Rapide (Recommandée)

### Étape 1: Créer l'utilisateur via l'interface Supabase

1. **Allez sur**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/auth/users
```

2. **Cliquez sur** "Add user" (bouton vert en haut à droite)

3. **Remplissez le formulaire**:
   - **Email**: `admin@compachantier.com`
   - **Password**: `Admin123!`
   - **Auto Confirm User**: ✅ **Cochez cette case** (important!)

4. **Cliquez sur** "Create user"

5. **Notez l'ID** de l'utilisateur créé (vous en aurez besoin)

---

### Étape 2: Ajouter l'utilisateur dans la table `users`

1. **Allez sur le SQL Editor**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql
```

2. **Créez une nouvelle requête**

3. **Copiez et modifiez ce SQL**:

```sql
-- Remplacez USER_ID_ICI par l'ID de l'utilisateur créé à l'étape 1
INSERT INTO users (
  id,
  email,
  full_name,
  preferred_language,
  role_id
) VALUES (
  'USER_ID_ICI',  -- Remplacez par le vrai ID
  'admin@compachantier.com',
  'Admin Test',
  'fr',
  1  -- Administrator role
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- Créer la subscription Premium
INSERT INTO subscriptions (
  user_id,
  plan,
  project_limit,
  export_limit,
  expires_at
) VALUES (
  'USER_ID_ICI',  -- Remplacez par le vrai ID
  'Premium',
  999,
  999,
  '2099-12-31'
);
```

4. **Remplacez** `USER_ID_ICI` par l'ID réel de l'utilisateur

5. **Exécutez** le SQL (Run ou Cmd+Enter)

---

### Étape 3: Vérifier

1. **Allez dans la table `users`**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/editor
```

2. **Vérifiez** que l'utilisateur `admin@compachantier.com` existe avec:
   - ✅ role_id = 1 (Administrator)
   - ✅ Une subscription Premium

---

## 🧪 Tester

### 1. Se connecter avec l'admin

```
http://localhost:3000/login
```

**Credentials**:
- Email: `admin@compachantier.com`
- Password: `Admin123!`

### 2. Créer un projet avec fichier

```
http://localhost:3000/dashboard/projects/new
```

- Uploadez `test-materiel.csv`
- Créez le projet

### 3. Observer l'analyse GPT-4o!

Vous devriez voir:
- ✅ Upload vers Supabase Storage
- ✅ Vraie analyse GPT-4o (~10 secondes)
- ✅ "10 matériaux détectés!"
- ✅ Matériaux créés dans la table `materials`

---

## 📊 Vérifier les Résultats

### Dans Supabase

1. **Table `materials`**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/editor
```
Vous devriez voir 10 matériaux créés

2. **Table `column_mappings`**:
Le mapping JSON créé par GPT-4o

3. **Storage `project-files`**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/storage/buckets/project-files
```
Le fichier CSV uploadé

---

## 🎯 Avantages

Avec l'admin dans Supabase:
- ✅ Mode démo **100% fonctionnel**
- ✅ Vraie analyse GPT-4o
- ✅ Données persistantes
- ✅ Pas besoin de créer un compte à chaque fois
- ✅ Parfait pour les démos et tests

---

## 🔄 Alternative: Méthode SQL Complète

Si vous préférez tout faire en SQL:

1. **Ouvrez le SQL Editor**

2. **Copiez le fichier**:
```
supabase/create-admin-user.sql
```

3. **Modifiez** si nécessaire (notamment le hash du mot de passe)

4. **Exécutez** le SQL

⚠️ **Note**: Cette méthode nécessite de hasher le mot de passe correctement avec bcrypt.

---

## 💡 Conseils

### Pour le développement
- Utilisez cet admin pour tous vos tests
- Pas besoin de créer de nouveaux comptes
- Toutes les features fonctionnent

### Pour la production
- Créez un vrai compte admin
- Désactivez l'auto-confirm
- Utilisez des mots de passe forts
- Supprimez l'admin de test

---

## 🐛 Dépannage

### "User already exists"
✅ Parfait! L'utilisateur existe déjà dans auth.users
👉 Passez directement à l'Étape 2

### "Email not confirmed"
❌ Vous avez oublié de cocher "Auto Confirm User"
👉 Supprimez l'utilisateur et recréez-le

### "Role not found"
❌ La table `roles` n'a pas les données
👉 Vérifiez que la migration SQL a bien été exécutée

---

## ✅ Checklist

- [ ] Utilisateur créé dans auth.users
- [ ] Auto Confirm User activé
- [ ] ID de l'utilisateur noté
- [ ] Utilisateur ajouté dans table `users`
- [ ] role_id = 1 (Administrator)
- [ ] Subscription Premium créée
- [ ] Test de connexion réussi
- [ ] Test de création de projet réussi
- [ ] Matériaux visibles dans Supabase

---

**Créez l'admin maintenant et profitez du mode démo complet!** 🚀

👉 https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/auth/users
