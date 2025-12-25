# Guide de Création de Templates

## Vue d'ensemble

Le système de création de templates permet aux professionnels de créer et partager des templates de projets de construction réutilisables.

## Fonctionnalités

### 1. Création Manuelle
- Ajouter des matériaux un par un
- Spécifier nom, description, quantité et unité
- Parfait pour des templates simples ou personnalisés

### 2. Import par Fichier
- Supporte Excel (.xlsx), PDF, CSV, Word (.docx)
- Fichiers jusqu'à 50MB
- **Traitement par chunks** pour éviter perte de données sur gros fichiers

## Traitement par Chunks

### Pourquoi par chunks?
- Fichiers volumineux peuvent saturer l'IA
- Risque de perte de données si timeout
- Permet un traitement progressif et fiable

### Comment ça marche?
1. Fichier divisé en chunks de 5MB max
2. Chaque chunk traité séquentiellement (pas en parallèle)
3. Progression affichée en temps réel
4. Matériaux extraits ajoutés progressivement

### Algorithme
```
fichier (50MB)
  ↓
chunk 1 (5MB) → IA → matériaux 1-50
  ↓
chunk 2 (5MB) → IA → matériaux 51-100
  ↓
...
  ↓
chunk 10 (5MB) → IA → matériaux 451-500
  ↓
Total: 500 matériaux extraits
```

## Architecture

### Tables Database

#### `templates`
```sql
- id: UUID
- name: TEXT
- description: TEXT
- category: TEXT (residential|commercial|renovation)
- user_id: UUID (créateur)
- materials_count: INTEGER
- file_url: TEXT (optionnel)
- file_type: TEXT
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `template_materials`
```sql
- id: UUID
- template_id: UUID → templates(id)
- name: TEXT
- description: TEXT
- quantity: NUMERIC
- unit: TEXT
- category: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### APIs

#### POST `/api/upload-template-file`
Upload fichier vers Supabase Storage

**Request:**
```typescript
FormData {
  file: File
}
```

**Response:**
```typescript
{
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
}
```

#### POST `/api/parse-template-chunk`
Parse un chunk du fichier avec IA

**Request:**
```typescript
{
  fileUrl: string
  chunkIndex: number
  totalChunks: number
  fileType: string
}
```

**Response:**
```typescript
{
  materials: Array<{
    name: string
    description: string
    quantity: number
    unit: string
  }>
  chunkIndex: number
  totalChunks: number
}
```

## Utilisation de l'IA

### OpenAI GPT-4o-mini
- Extraction de texte depuis PDF/DOCX
- Structuration des matériaux
- Format JSON structuré

### Prompt System
```
Rôle: Expert extraction matériaux construction
Input: Texte brut du document
Output: Array JSON de matériaux structurés
```

### Fallback
Si IA échoue, extraction basique par mots-clés:
- ciment, sable, gravier, fer, brique, carrelage, peinture, béton, etc.

## Sécurité

### RLS Policies
- Lecture: Tous les utilisateurs authentifiés
- Création: Utilisateur doit être propriétaire
- Modification: Uniquement créateur
- Suppression: Uniquement créateur

### Storage
- Bucket `templates` public en lecture
- Upload: Uniquement authentifiés
- Fichiers organisés par `user_id/`

## Workflow Complet

1. **Utilisateur** clique "Créer un Template"
2. Renseigne infos (nom, description, catégorie)
3. **Choix:**
   - **Manuel:** Ajoute matériaux un par un
   - **Fichier:** Upload fichier → Parsing IA par chunks
4. Révision de la liste de matériaux
5. Sauvegarde → Création template + template_materials
6. Redirection vers liste templates

## Migration

Pour appliquer la migration:

```bash
# Via Supabase MCP
npx supabase db push

# Ou directement dans l'éditeur SQL Supabase
# Copier contenu de:
# supabase/migrations/20251119_create_template_materials.sql
```

Régénérer les types TypeScript:
```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > lib/supabase/database.types.ts
```

## Limitations Actuelles

- Taille max fichier: 50MB
- Chunk size: 5MB
- Format supportés: Excel, PDF, CSV, DOCX
- Traitement séquentiel (pas parallèle)

## Améliorations Futures

- [ ] Support DeepSeek API en alternative
- [ ] Parsing OCR pour images/scans
- [ ] Validation matériaux par catégorie
- [ ] Suggestions auto-complétion
- [ ] Export templates vers Excel
- [ ] Marketplace templates
- [ ] Reviews & ratings
- [ ] Templates premium

## Troubleshooting

### Erreur "Type de fichier non supporté"
→ Vérifier extension: .xlsx, .pdf, .csv, .docx

### Parsing lent
→ Normal pour gros fichiers, patience!

### Matériaux manquants
→ Vérifier qualité du fichier source
→ Utiliser mode manuel pour compléter

### Erreur TypeScript "templates not found"
→ Appliquer migration + régénérer types
