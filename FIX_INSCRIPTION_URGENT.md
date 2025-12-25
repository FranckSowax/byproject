# 🚨 FIX URGENT - Erreur d'Inscription

## ❌ Problème

Erreur lors de l'inscription:
```
new row violates row-level security policy for table "users"
new row violates row-level security policy for table "subscriptions"
```

## ✅ Solution (2 minutes)

Les policies RLS bloquent l'insertion. Il faut ajouter des policies pour permettre aux utilisateurs de créer leur profil.

---

## 🚀 Étapes Rapides

### 1. Ouvrir le SQL Editor

**Cliquez sur ce lien**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql
```

---

### 2. Créer une Nouvelle Requête

Cliquez sur **"+ New query"**

---

### 3. Copier le SQL

Ouvrez le fichier:
```
supabase/fix-signup-policies.sql
```

**Copiez TOUT le contenu** (Cmd+A puis Cmd+C)

---

### 4. Coller et Exécuter

1. **Collez** dans l'éditeur Supabase (Cmd+V)
2. **Cliquez** sur "Run" (ou Cmd+Enter)
3. **Attendez** "Success"

---

### 5. Vérifier

Vous devriez voir dans les résultats:
- ✅ 6 policies créées (3 pour users, 3 pour subscriptions)

---

## 🧪 Tester Immédiatement

### 1. Retournez sur la page d'inscription
```
http://localhost:3000/signup
```

### 2. Créez un nouveau compte
- Nom: Test User
- Email: test@example.com
- Langue: Français
- Password: Test1234!

### 3. Ça devrait fonctionner!
✅ "Compte créé avec succès!"

---

## 📋 Policies Ajoutées

### Table `users`
1. ✅ **INSERT**: Users can insert their own profile during signup
2. ✅ **SELECT**: Users can view their own profile
3. ✅ **UPDATE**: Users can update their own profile

### Table `subscriptions`
1. ✅ **INSERT**: Users can insert their own subscription during signup
2. ✅ **SELECT**: Users can view their own subscription
3. ✅ **UPDATE**: Users can update their own subscription

---

## 🔐 Sécurité

Ces policies garantissent que:
- ✅ Un utilisateur ne peut créer QUE son propre profil
- ✅ Un utilisateur ne peut voir QUE ses propres données
- ✅ Un utilisateur ne peut modifier QUE ses propres données
- ✅ Pas d'accès aux données des autres utilisateurs

---

## 💡 Pourquoi cette erreur?

La migration initiale (`001_initial_schema.sql`) a activé RLS sur les tables mais n'a pas ajouté les policies pour l'inscription. Les policies existantes permettent seulement la lecture, pas l'insertion.

---

## ✅ Checklist

- [ ] SQL Editor ouvert
- [ ] Fichier `fix-signup-policies.sql` copié
- [ ] SQL exécuté avec succès
- [ ] 6 policies créées
- [ ] Test d'inscription réussi

---

**Exécutez le SQL maintenant!** 🚀

👉 https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql

📄 Fichier: `supabase/fix-signup-policies.sql`
