# Storage Bucket Templates - CRÉÉ

## ✅ Bucket Créé avec Succès

Le bucket `templates` a été créé avec succès via Supabase MCP.

### Détails du Bucket

**Bucket Configuration:**
- **ID**: `templates`
- **Name**: `templates`
- **Public**: ✅ Yes (lecture publique)
- **File Size Limit**: 52,428,800 bytes (50 MB)
- **Allowed MIME Types**:
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel .xlsx)
  - `application/pdf` (PDF)
  - `text/csv` (CSV)
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (Word .docx)

### Structure des Fichiers

Les fichiers sont organisés par user_id:
```
templates/
  └── {user_id}/
      ├── 1637234567890.xlsx
      ├── 1637234589012.pdf
      └── 1637234601234.csv
```

### Policies RLS (depuis migration précédente)

Ces policies ont déjà été créées dans `create_templates_table.sql` :

✅ **Lecture publique**
```sql
CREATE POLICY "Templates files are publicly accessible"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'templates');
```

✅ **Upload authentifié (users propres dossiers)**
```sql
CREATE POLICY "Only admins can upload template files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'templates' AND ...);
```

✅ **Update/Delete (admins/propriétaires uniquement)**

### URLs des Fichiers

Les fichiers uploadés seront accessibles via:
```
https://{project_ref}.supabase.co/storage/v1/object/public/templates/{user_id}/{filename}
```

Exemple:
```
https://ebmgtfftimezuuxxzyjm.supabase.co/storage/v1/object/public/templates/abc-123-def/1637234567890.xlsx
```

### Utilisation dans le Code

#### Upload via API Route
```typescript
const { data, error } = await supabase.storage
  .from('templates')
  .upload(`${userId}/${Date.now()}.xlsx`, file, {
    contentType: file.type,
    upsert: false
  });
```

#### Obtenir l'URL publique
```typescript
const { data: { publicUrl } } = supabase.storage
  .from('templates')
  .getPublicUrl(`${userId}/${filename}`);
```

#### Supprimer un fichier
```typescript
const { error } = await supabase.storage
  .from('templates')
  .remove([`${userId}/${filename}`]);
```

### Vérification

Pour vérifier que le bucket existe:

```sql
-- Dans Supabase SQL Editor
SELECT * FROM storage.buckets WHERE id = 'templates';
```

Ou via Dashboard:
1. Storage → Buckets
2. Vérifier présence de "templates"

### Test Upload

Pour tester l'upload:

1. Aller sur `/dashboard/templates/create`
2. Choisir "Import Fichier"
3. Sélectionner un fichier Excel/PDF/CSV/DOCX
4. Cliquer "Analyser le fichier avec IA"
5. Vérifier dans Storage → templates → {votre_user_id}

### Limites et Quotas

- **Taille max par fichier**: 50 MB
- **Types autorisés**: Excel, PDF, CSV, Word uniquement
- **Organisation**: Par user_id (isolation des fichiers)
- **Rétention**: Fichiers conservés tant que template existe

### Sécurité

✅ **Lecture**: Publique (URLs accessibles)
✅ **Écriture**: Authentifiée uniquement
✅ **Isolation**: Chaque user dans son propre dossier
✅ **Validation**: Types MIME contrôlés
✅ **Taille**: Limitée à 50MB par fichier

---

**Date**: 2025-11-19 14:18
**Status**: ✅ CREATED
**Method**: Supabase MCP (mcp5_apply_migration)
**Migration**: create_templates_bucket_only
