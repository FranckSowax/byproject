# 🔧 Créer l'Utilisateur Manquant - 3 Étapes

## 🎯 Problème

Votre utilisateur existe dans Supabase Auth mais pas dans la table `users`.

---

## ✅ Solution en 3 Étapes

### Étape 1: Trouver votre ID

**Allez sur**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/auth/users
```

1. Trouvez votre utilisateur dans la liste
2. **Copiez l'ID** (c'est un UUID comme `abc123...`)

---

### Étape 2: Ouvrir le SQL Editor

**Allez sur**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql
```

Cliquez sur **"+ New query"**

---

### Étape 3: Exécuter ce SQL

**Copiez et modifiez** (remplacez les 3 valeurs marquées):

```sql
-- Créer l'utilisateur
INSERT INTO users (
  id,
  email,
  full_name,
  preferred_language,
  role_id
) VALUES (
  'COLLEZ-VOTRE-ID-ICI',  -- ⚠️ Remplacez par votre ID
  'votre@email.com',       -- ⚠️ Remplacez par votre email
  'Votre Nom',             -- ⚠️ Remplacez par votre nom
  'fr',
  3
);

-- Créer la subscription
INSERT INTO subscriptions (
  user_id,
  plan,
  project_limit,
  export_limit
) VALUES (
  'COLLEZ-VOTRE-ID-ICI',  -- ⚠️ Même ID que ci-dessus
  'Free',
  5,
  2
);
```

**Cliquez sur "Run"**

---

## ✅ Vérification

Vous devriez voir:
```
Success. 1 row(s) affected
Success. 1 row(s) affected
```

---

## 🧪 Tester

Maintenant créez un projet:
```
http://localhost:3000/dashboard/projects/new
```

✅ **Ça devrait fonctionner!**

---

## 📝 Exemple Complet

Si votre ID est `abc-123-def` et votre email `test@example.com`:

```sql
INSERT INTO users (id, email, full_name, preferred_language, role_id)
VALUES ('abc-123-def', 'test@example.com', 'Test User', 'fr', 3);

INSERT INTO subscriptions (user_id, plan, project_limit, export_limit)
VALUES ('abc-123-def', 'Free', 5, 2);
```

---

**Faites-le maintenant!** 🚀

👉 **Auth Users**: https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/auth/users

👉 **SQL Editor**: https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql
