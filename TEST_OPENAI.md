# 🧪 Test OpenAI - Guide Rapide

## ✅ Configuration Terminée!

Votre clé OpenAI est configurée et le serveur a rechargé les variables d'environnement.

---

## 🚀 Test en 5 Étapes

### Étape 1: Créer le Bucket Storage (Si pas encore fait)

1. **Allez sur**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/storage/buckets
```

2. **Créez un nouveau bucket**:
   - Nom: `project-files`
   - Public: ❌ Non (privé)
   - Cliquez "Create bucket"

3. **Ajoutez les Policies RLS**:

Dans le bucket `project-files`, allez dans "Policies" et ajoutez:

**Policy 1: Upload**
```sql
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: Download**
```sql
CREATE POLICY "Users can download their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### Étape 2: Se Connecter

**Option A: Avec Supabase (Recommandé)**
```
http://localhost:3000/login
```
Utilisez votre compte créé précédemment.

**Option B: Avec le Mock User (Test rapide)**
```
http://localhost:3000/admin-login
Email: admin@compachantier.com
Password: Admin123!
```

---

### Étape 3: Créer un Projet avec Fichier

1. **Allez sur**:
```
http://localhost:3000/dashboard/projects/new
```

2. **Remplissez le formulaire**:
   - **Nom**: "Test Analyse IA GPT-4o"
   - **Description**: "Test du workflow d'analyse automatique"

3. **Uploadez le fichier de test**:
   - Cliquez sur "Choisir un fichier"
   - Sélectionnez: `test-materiel.csv` (dans le dossier du projet)
   - Vous verrez: "Fichier sélectionné: test-materiel.csv"

4. **Créez le projet**:
   - Cliquez sur "Créer le projet"

---

### Étape 4: Observer l'Analyse IA

Vous serez automatiquement redirigé vers la page d'analyse:
```
/dashboard/projects/[id]/mapping
```

**Ce que vous verrez**:

1. **Barre de progression** (0% → 100%)

2. **Étapes de l'analyse**:
   - ✅ Extraction du contenu
   - ✅ Analyse par IA (GPT-4o)
   - ✅ Création du mapping

3. **Résultat**:
   - "10 matériaux détectés!"
   - "Mapping des colonnes créé"
   - "Données structurées"

4. **Redirection automatique** vers le projet après 2 secondes

---

### Étape 5: Vérifier les Résultats

#### A. Dans l'Application
Vous serez sur la page du projet:
```
/dashboard/projects/[id]
```

Vous devriez voir:
- ✅ Nom du projet
- ✅ Statut: "completed"
- ✅ Section "Matériaux" (bientôt avec la liste)

#### B. Dans Supabase

1. **Vérifier les matériaux créés**:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/editor
```
   - Allez dans la table `materials`
   - Vous devriez voir 10 lignes créées

2. **Vérifier le mapping**:
   - Allez dans la table `column_mappings`
   - Vous devriez voir le mapping JSON créé par GPT-4o

3. **Vérifier le projet**:
   - Allez dans la table `projects`
   - Le champ `mapping_status` devrait être "completed"

---

## 🎯 Ce que GPT-4o a Détecté

Pour le fichier `test-materiel.csv`, GPT-4o devrait détecter:

### Colonnes Mappées:
- `Nom` → `name`
- `Quantité` → `quantity`
- `Unité` → `unit`
- `Catégorie` → `category`
- `Spécifications` → `specs`

### Matériaux Créés (10):
1. Ciment Portland CEM II
2. Fer à béton HA 12mm
3. Briques creuses 15x20x30
4. Sable de rivière lavé
5. Gravier concassé 5/15
6. Ciment blanc
7. Carrelage 60x60
8. Peinture acrylique
9. Tuyau PVC Ø110
10. Câble électrique 2.5mm²

---

## 🐛 Dépannage

### "Erreur lors de l'upload du fichier"
❌ Le bucket `project-files` n'existe pas
👉 Créez-le dans Supabase Storage (Étape 1)

### "Failed to download file"
❌ Les policies RLS ne sont pas configurées
👉 Ajoutez les policies (Étape 1)

### "Failed to analyze file with AI"
❌ Problème avec la clé OpenAI
👉 Vérifiez que la clé est valide et a du crédit

### "Aucun matériau détecté"
⚠️ Le fichier est peut-être mal formaté
👉 Vérifiez que le CSV a des en-têtes

---

## 📊 Vérifier les Logs

### Dans le Terminal (Serveur Next.js)
Vous verrez:
```
POST /api/ai/analyze-file 200 in 5234ms
```

### Dans la Console du Navigateur (F12)
Vous verrez:
```
Analysis result: {success: true, materialsCount: 10, ...}
```

---

## 💡 Conseils

### Pour de meilleurs résultats:
- ✅ Utilisez des en-têtes de colonnes clairs
- ✅ Formatez bien vos données (pas de lignes vides)
- ✅ Utilisez des noms de colonnes standards (Nom, Quantité, Prix, etc.)

### Formats supportés actuellement:
- ✅ CSV (parfaitement supporté)
- ✅ TXT (supporté)
- ⏳ PDF (à implémenter avec pdf-parse)
- ⏳ Excel (à implémenter avec xlsx)

---

## 🎉 Résultat Attendu

Si tout fonctionne correctement:

1. ✅ Fichier uploadé vers Supabase Storage
2. ✅ Projet créé dans la base de données
3. ✅ Page d'analyse affichée avec progression
4. ✅ GPT-4o analyse le fichier (~5-10 secondes)
5. ✅ 10 matériaux créés dans la table `materials`
6. ✅ Mapping sauvegardé dans `column_mappings`
7. ✅ Statut du projet mis à jour
8. ✅ Redirection vers le projet
9. ✅ Toast de succès: "10 matériaux détectés!"

---

## 📞 URLs Rapides

| Action | URL |
|--------|-----|
| Login | http://localhost:3000/login |
| Admin Login | http://localhost:3000/admin-login |
| New Project | http://localhost:3000/dashboard/projects/new |
| Supabase Storage | https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/storage/buckets |
| Supabase Tables | https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/editor |

---

## 🚀 Commencez le Test!

1. **Créez le bucket** (si pas encore fait)
2. **Connectez-vous** (admin ou Supabase)
3. **Allez sur**: http://localhost:3000/dashboard/projects/new
4. **Uploadez**: `test-materiel.csv`
5. **Cliquez**: "Créer le projet"
6. **Observez** la magie de GPT-4o! ✨

---

**Bon test! 🎉**

Si ça fonctionne, vous verrez "10 matériaux détectés!" et tous les matériaux seront créés automatiquement dans votre base de données!
