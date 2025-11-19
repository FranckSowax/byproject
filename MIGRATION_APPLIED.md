# Migration Template Materials - APPLIQUÉE

## ✅ Migration Appliquée avec Succès

La migration `create_template_materials` a été appliquée avec succès via Supabase MCP.

### Projet Supabase
- **Project ID**: ebmgtfftimezuuxxzyjm
- **Name**: Compa Chantier
- **Status**: ACTIVE_HEALTHY
- **Region**: eu-north-1

### Tables Créées

#### `template_materials`
✅ Créée avec succès
- id (UUID, PK)
- template_id (UUID, FK → templates.id)
- name (TEXT, NOT NULL)
- description (TEXT)
- quantity (NUMERIC)
- unit (TEXT)
- category (TEXT)
- created_at, updated_at

#### `templates` (modifiée)
✅ Colonne ajoutée
- user_id (UUID, FK → auth.users.id)

### Policies RLS

✅ **template_materials**
- SELECT: Tous les utilisateurs authentifiés
- INSERT/UPDATE/DELETE: Propriétaire uniquement

✅ **templates** (policies mises à jour)
- Supprimé: "Only admins can insert templates"  
- Ajouté: "Users can insert their own templates"
- Ajouté: "Users can update their own templates"
- Ajouté: "Users can delete their own templates"

### Indexes Créés

✅ idx_template_materials_template_id
✅ idx_templates_user_id

### Triggers

✅ template_materials_updated_at_trigger
- Auto-update de updated_at sur UPDATE

## Types TypeScript

Les types ont été régénérés et incluent maintenant :

- ✅ `templates` avec `user_id`
- ✅ `template_materials` (nouvelle table)

### Pour mettre à jour database.types.ts manuellement

Si le fichier n'est pas à jour automatiquement, les types complets sont disponibles via:

```typescript
// Tables templates et template_materials sont maintenant disponibles
const { data } = await supabase.from('templates').select('*')
const { data } = await supabase.from('template_materials').select('*')
```

## Prochaines Étapes

1. ✅ Migration appliquée
2. ✅ Types générés  
3. ⏳ Supprimer `@ts-nocheck` de `/app/(dashboard)/dashboard/templates/create/page.tsx`
4. ⏳ Tester la création de template
5. ⏳ Créer le bucket Storage `templates` dans Supabase Dashboard

## Bucket Storage

⚠️ À faire manuellement dans Supabase Dashboard:
1. Storage → Create Bucket
2. Name: `templates`
3. Public: Yes
4. Allowed MIME types: .xlsx, .pdf, .csv, .docx

## Vérification

Pour vérifier que tout fonctionne:

```sql
-- Dans Supabase SQL Editor
SELECT * FROM public.templates;
SELECT * FROM public.template_materials;

-- Vérifier les policies
SELECT * FROM pg_policies WHERE tablename IN ('templates', 'template_materials');
```

---

**Date**: 2025-11-19 14:14
**Status**: ✅ SUCCESS
**Applied via**: Supabase MCP (mcp5_apply_migration)
