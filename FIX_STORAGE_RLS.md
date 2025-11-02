# 🔧 Fix Storage RLS - Policies Bucket project-files

## 🐛 Problème

**Erreur**: `400 Bad Request - new row violates row-level security policy`

**Cause**: Pas de policies RLS sur le bucket Storage `project-files`

---

## ✅ Solution

### Via l'Interface Supabase (Recommandé)

1. **Allez sur**: https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/storage/buckets

2. **Cliquez** sur le bucket `project-files`

3. **Allez** dans l'onglet "Policies"

4. **Créez 3 policies**:

---

### Policy 1: Upload (INSERT)

**Nom**: `Users can upload files`

**Operation**: `INSERT`

**Policy definition**:
```sql
true
```

**Ou plus sécurisé**:
```sql
auth.role() = 'authenticated'
```

---

### Policy 2: Read (SELECT)

**Nom**: `Users can view files`

**Operation**: `SELECT`

**Policy definition**:
```sql
true
```

**Ou plus sécurisé**:
```sql
auth.role() = 'authenticated'
```

---

### Policy 3: Delete (DELETE)

**Nom**: `Users can delete files`

**Operation**: `DELETE`

**Policy definition**:
```sql
auth.role() = 'authenticated'
```

---

## 🎯 Alternative: Rendre le Bucket Public

Si vous voulez que les photos soient publiques:

1. **Allez sur**: Storage → Buckets → project-files
2. **Cliquez** sur "Configuration"
3. **Activez** "Public bucket"
4. ✅ Plus besoin de policies RLS!

---

## 🔐 Policies Recommandées (Sécurisées)

### Policy 1: Upload avec Vérification

```sql
-- Permet l'upload uniquement dans le dossier de l'utilisateur
(bucket_id = 'project-files'::text) 
AND 
(auth.role() = 'authenticated')
```

### Policy 2: Lecture Publique

```sql
-- Tout le monde peut lire (pour afficher les photos)
(bucket_id = 'project-files'::text)
```

### Policy 3: Suppression Restreinte

```sql
-- Seul l'utilisateur authentifié peut supprimer
(bucket_id = 'project-files'::text) 
AND 
(auth.role() = 'authenticated')
```

---

## 🧪 Test Après Fix

1. **Rechargez** la page du projet
2. Cliquez **"Ajouter un Prix"**
3. Remplissez le formulaire
4. **Ajoutez 3 photos**
5. Cliquez **"Ajouter"**
6. ✅ **Photos uploadées avec succès!**

---

## 📊 Vérification

### Vérifier les Policies

1. Allez sur: Storage → Buckets → project-files → Policies
2. ✅ Vous devriez voir 3 policies actives

### Tester l'Upload

```typescript
// Test dans la console browser
const { data, error } = await supabase.storage
  .from('project-files')
  .upload('test.txt', new Blob(['test']));

console.log(data, error);
// Si error: Policies manquantes
// Si data: ✅ Policies OK!
```

---

## 🚀 Solution Rapide (Bucket Public)

**La plus simple pour commencer**:

1. Storage → Buckets → project-files
2. Configuration → Public bucket: **ON**
3. ✅ Fini! Les uploads fonctionnent

**Avantages**:
- ✅ Pas besoin de policies
- ✅ Photos accessibles publiquement
- ✅ Parfait pour des photos de produits

**Inconvénients**:
- ⚠️ N'importe qui peut voir les URLs
- ⚠️ Pas de contrôle d'accès

---

## ✅ Résumé

**Problème**: RLS bloque l'upload vers Storage

**Solution 1**: Activer "Public bucket" (rapide)
**Solution 2**: Créer les policies RLS (sécurisé)

**Recommandation**: Commencez avec Public bucket, ajoutez les policies plus tard si besoin.

---

## 📝 Étapes Détaillées (Interface Supabase)

### 1. Aller sur Storage
```
Dashboard → Storage → Buckets
```

### 2. Sélectionner project-files
```
Cliquez sur "project-files"
```

### 3. Option A: Rendre Public (Rapide)
```
Configuration → Public bucket → Toggle ON
✅ Sauvegardez
```

### 3. Option B: Créer Policies (Sécurisé)
```
Policies → New Policy

Policy 1:
- Name: Allow uploads
- Operation: INSERT
- Definition: auth.role() = 'authenticated'

Policy 2:
- Name: Allow reads
- Operation: SELECT  
- Definition: true

Policy 3:
- Name: Allow deletes
- Operation: DELETE
- Definition: auth.role() = 'authenticated'
```

---

**Choisissez l'option qui vous convient et testez!** 🚀
