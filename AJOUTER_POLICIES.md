# 🔐 Ajouter les Policies RLS - 2 Minutes

## ✅ Bucket Créé!

Maintenant il faut ajouter les policies de sécurité pour que les utilisateurs puissent uploader des fichiers.

---

## 🚀 Méthode Rapide

### Étape 1: Ouvrir le SQL Editor

**Cliquez sur ce lien**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql
```

---

### Étape 2: Créer une Nouvelle Requête

1. Cliquez sur **"+ New query"**

---

### Étape 3: Copier le SQL

Ouvrez le fichier:
```
supabase/storage-policies.sql
```

**Copiez TOUT le contenu** (Cmd+A puis Cmd+C)

---

### Étape 4: Coller et Exécuter

1. **Collez** le SQL dans l'éditeur Supabase (Cmd+V)

2. **Cliquez sur "Run"** (ou appuyez sur Cmd+Enter)

3. **Attendez** le message: "Success. No rows returned"

---

## ✅ Vérification

Pour vérifier que les policies sont créées:

1. Allez sur: https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/storage/buckets

2. Cliquez sur le bucket **`project-files`**

3. Allez dans l'onglet **"Policies"**

4. Vous devriez voir **4 policies**:
   - ✅ Users can upload their own files (INSERT)
   - ✅ Users can download their own files (SELECT)
   - ✅ Users can delete their own files (DELETE)
   - ✅ Users can update their own files (UPDATE)

---

## 🧪 Tester Maintenant!

Une fois les policies ajoutées:

### 1. Connectez-vous avec Supabase (Important!)

⚠️ **N'utilisez PAS le login admin** pour tester l'upload de fichiers!

```
http://localhost:3000/login
```

Utilisez votre compte Supabase créé précédemment.

**Pourquoi?** Le mock user n'a pas d'ID Supabase réel, donc l'upload échouera.

---

### 2. Créez un Projet avec Fichier

```
http://localhost:3000/dashboard/projects/new
```

1. **Nom**: "Test Upload GPT-4o"
2. **Uploadez**: `test-materiel.csv`
3. **Cliquez**: "Créer le projet"

---

### 3. Observez l'Analyse!

Vous devriez être redirigé vers:
```
/dashboard/projects/[id]/mapping
```

Et voir:
- 📊 Barre de progression
- ✅ Analyse par GPT-4o
- 🎉 "10 matériaux détectés!"

---

## 🐛 Si ça ne marche toujours pas

### Vérifiez dans la Console (F12)

Cherchez les erreurs:
- `Upload error:` 
- `Permission denied`
- `Policy violation`

### Solutions Possibles

1. **"new row violates row-level security policy"**
   - Les policies ne sont pas encore actives
   - Attendez 10 secondes et réessayez

2. **"User not authenticated"**
   - Vous utilisez le mock user
   - Connectez-vous avec `/login` (Supabase)

3. **"Bucket not found"**
   - Le bucket n'est pas nommé exactement `project-files`
   - Vérifiez le nom (sensible à la casse)

---

## 💡 Alternative: Test Sans Fichier

Si vous voulez juste tester la création de projet:

1. **Ne uploadez PAS de fichier**
2. Remplissez juste le nom
3. Créez le projet

Le projet sera créé sans analyse IA.

---

## 📋 Checklist Complète

- [x] Bucket `project-files` créé
- [ ] Policies RLS ajoutées (4 policies)
- [ ] Connecté avec compte Supabase (pas mock user)
- [ ] Test de création de projet avec fichier

---

**Ajoutez les policies maintenant!** 🚀

👉 https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql

📄 Fichier SQL: `supabase/storage-policies.sql`
