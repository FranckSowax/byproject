# 🗄️ Créer le Bucket Storage - URGENT

## ⚠️ Problème Actuel

Le projet n'est pas créé car le bucket `project-files` n'existe pas dans Supabase Storage.

---

## ✅ Solution en 3 Minutes

### Étape 1: Ouvrir Supabase Storage

**Cliquez sur ce lien**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/storage/buckets
```

---

### Étape 2: Créer le Bucket

1. **Cliquez sur** le bouton vert **"New bucket"** (en haut à droite)

2. **Remplissez le formulaire**:
   - **Name**: `project-files`
   - **Public bucket**: ❌ **Décochez** (doit rester privé)
   - **File size limit**: Laissez par défaut (ou mettez 10MB)
   - **Allowed MIME types**: Laissez vide (tous les types)

3. **Cliquez sur** "Create bucket"

---

### Étape 3: Configurer les Policies RLS

1. **Dans la liste des buckets**, cliquez sur `project-files`

2. **Allez dans l'onglet** "Policies"

3. **Cliquez sur** "New Policy"

4. **Créez 3 policies**:

#### Policy 1: Upload (INSERT)
```sql
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 2: Download (SELECT)
```sql
CREATE POLICY "Users can download their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 3: Delete (DELETE)
```sql
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🧪 Tester Après Configuration

Une fois le bucket créé:

1. **Rechargez la page** du dashboard:
   ```
   http://localhost:3000/dashboard
   ```

2. **Créez un nouveau projet**:
   ```
   http://localhost:3000/dashboard/projects/new
   ```

3. **Uploadez** `test-materiel.csv`

4. **Cliquez** "Créer le projet"

5. **Ça devrait fonctionner!** ✅

---

## 🐛 Si ça ne marche toujours pas

### Vérifier dans la Console du Navigateur (F12)

Vous devriez voir l'erreur exacte. Cherchez:
- `Upload error:` dans la console
- `Failed to upload` dans les toasts

### Erreurs Possibles

1. **"Bucket not found"**
   - Le bucket n'existe pas
   - Retournez à l'Étape 2

2. **"Permission denied"**
   - Les policies ne sont pas configurées
   - Retournez à l'Étape 3

3. **"User not authenticated"**
   - Vous n'êtes pas connecté avec Supabase
   - Utilisez `/login` au lieu de `/admin-login`

---

## 💡 Alternative: Tester Sans Fichier

En attendant de configurer le bucket, vous pouvez tester sans uploader de fichier:

1. **Allez sur**: http://localhost:3000/dashboard/projects/new
2. **Remplissez** juste le nom: "Test Sans Fichier"
3. **Ne uploadez PAS de fichier**
4. **Cliquez** "Créer le projet"

Le projet devrait être créé sans problème!

---

## 📊 Vérification Rapide

Pour vérifier que le bucket existe:

1. Allez sur: https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/storage/buckets
2. Vous devriez voir `project-files` dans la liste
3. Cliquez dessus
4. Vérifiez que 3 policies sont présentes

---

**Créez le bucket maintenant et réessayez!** 🚀

👉 https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/storage/buckets
