# 🚨 FIX URGENT - Colonne hashed_password

## ❌ Erreur

```
null value in column "hashed_password" violates not-null constraint
```

## 🔍 Cause

La table `users` a une colonne `hashed_password` marquée comme NOT NULL, mais Supabase Auth gère déjà les mots de passe dans `auth.users`. Cette colonne n'est pas nécessaire.

---

## ✅ Solution (30 secondes)

### Étape 1: Ouvrir le SQL Editor

```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql
```

### Étape 2: Exécuter ce SQL

```sql
ALTER TABLE users 
ALTER COLUMN hashed_password DROP NOT NULL;
```

**Cliquez sur "Run"**

---

## ✅ Puis Créer l'Utilisateur

Maintenant vous pouvez créer l'utilisateur:

```sql
INSERT INTO users (id, email, full_name, preferred_language, role_id)
VALUES ('VOTRE-ID', 'votre@email.com', 'Votre Nom', 'fr', 3);

INSERT INTO subscriptions (user_id, plan, project_limit, export_limit)
VALUES ('VOTRE-ID', 'Free', 5, 2);
```

---

## 🎯 Résumé

1. ✅ Exécutez `ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;`
2. ✅ Puis créez l'utilisateur avec le SQL ci-dessus
3. ✅ Testez la création de projet

---

**Exécutez maintenant!** 🚀

👉 https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql
