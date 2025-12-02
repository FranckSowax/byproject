# 📄 Processus d'Extraction Robuste de Fichiers

> Documentation technique du système d'extraction multi-format pour les matériaux BTP

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Formats supportés](#formats-supportés)
3. [Architecture technique](#architecture-technique)
4. [Processus Excel](#processus-excel-xlsx-xls)
5. [Processus PDF](#processus-pdf)
6. [Processus CSV](#processus-csv)
7. [Processus Word](#processus-word-doc-docx)
8. [Processus TXT](#processus-txt)
9. [Extraction des prix et fournisseurs](#extraction-des-prix-et-fournisseurs)
10. [Gestion des devises](#gestion-des-devises)
11. [Déduplication intelligente](#déduplication-intelligente)
12. [Stockage des données](#stockage-des-données)
13. [API Reference](#api-reference)

---

## Vue d'ensemble

Le système d'extraction permet d'importer automatiquement des listes de matériaux depuis différents formats de fichiers. Il combine :

- **Extraction déterministe** : Pour les formats structurés (Excel, CSV)
- **Extraction IA** : Pour les formats non-structurés (PDF, Word, TXT)
- **Mapping intelligent** : Détection automatique des colonnes et données

### Flux général

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Upload    │ ──▶ │  Détection   │ ──▶ │ Extraction  │ ──▶ │  Sauvegarde  │
│   Fichier   │     │    Format    │     │   Données   │     │   Supabase   │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │  Catégorisation IA  │
                                    │  + Prix/Fournisseur │
                                    └─────────────────────┘
```

---

## Formats supportés

| Format | Extensions | Méthode | Librairie | Précision |
|--------|------------|---------|-----------|-----------|
| **Excel** | `.xlsx`, `.xls` | Déterministe + IA | SheetJS (xlsx) | ⭐⭐⭐⭐⭐ |
| **CSV** | `.csv` | Déterministe | Native | ⭐⭐⭐⭐⭐ |
| **PDF** | `.pdf` | IA chirurgicale | pdfjs-dist | ⭐⭐⭐⭐ |
| **Word** | `.doc`, `.docx` | IA chirurgicale | mammoth.js | ⭐⭐⭐⭐ |
| **Texte** | `.txt` | IA chirurgicale | Native | ⭐⭐⭐⭐ |

---

## Architecture technique

### Fichiers impliqués

```
app/
├── (dashboard)/dashboard/projects/[id]/
│   └── page.tsx                          # Interface d'import
├── api/ai/
│   ├── extract-from-file/
│   │   └── route.ts                      # API extraction PDF/CSV/TXT/DOC
│   ├── analyze-file-structure/
│   │   └── route.ts                      # Analyse structure Excel
│   ├── categorize-materials/
│   │   └── route.ts                      # Catégorisation IA
│   └── extract-items/
│       └── route.ts                      # Extraction par chunks
```

### Dépendances

```json
{
  "xlsx": "^0.18.5",           // Lecture Excel
  "pdfjs-dist": "^4.0.0",      // Extraction texte PDF
  "mammoth": "^1.6.0",         // Extraction texte Word
  "openai": "^4.0.0"           // IA GPT-4o-mini
}
```

---

## Processus Excel (XLSX, XLS)

### Étape 1 : Lecture du fichier

```typescript
const XLSX = await import('xlsx');
const arrayBuffer = await importFile.arrayBuffer();
const workbook = XLSX.read(arrayBuffer, { type: 'array' });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
```

### Étape 2 : Analyse de structure par IA

L'IA analyse les 25 premières lignes pour détecter :
- **Ligne d'en-tête** : Index de la ligne contenant les titres de colonnes
- **Mapping des colonnes** : Correspondance nom → index

```typescript
// Envoi à l'API d'analyse
const analyzeResponse = await fetch('/api/ai/analyze-file-structure', {
  method: 'POST',
  body: JSON.stringify({
    fileSample: rawData.slice(0, 25),
    fileName: file.name
  }),
});

// Résultat attendu
{
  "config": {
    "headerRowIndex": 10,
    "columns": {
      "name": 2,
      "description": 3,
      "category": 1,
      "quantity": 4,
      "unit": 5,
      "price": 6
    },
    "currency": "XAF",
    "confidence": 0.95
  }
}
```

### Étape 3 : Extraction déterministe

```typescript
for (let i = headerRow + 1; i < rawData.length; i++) {
  const row = rawData[i];
  
  // Extraction basée sur le mapping
  const name = row[cols.name];
  const quantity = parseFloat(row[cols.quantity]);
  const price = parsePrice(row[cols.price]);
  
  // Filtrage des lignes invalides
  if (!name || name.includes('total')) continue;
  
  items.push({ name, quantity, price, ... });
}
```

### Étape 4 : Catégorisation IA

```typescript
const categorizeResponse = await fetch('/api/ai/categorize-materials', {
  method: 'POST',
  body: JSON.stringify({
    materials: items,
    projectType: 'Construction BTP'
  }),
});
```

### Avantages Excel

- ✅ Structure tabulaire préservée
- ✅ Extraction 100% déterministe après analyse
- ✅ Gestion des formats de nombres locaux
- ✅ Support multi-feuilles

---

## Processus PDF

### Étape 1 : Extraction du texte (côté client)

```typescript
const pdfjsLib = await import('pdfjs-dist');
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const arrayBuffer = await file.arrayBuffer();
const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

const textParts: string[] = [];
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const content = await page.getTextContent();
  const pageText = content.items.map((item: any) => item.str).join(' ');
  textParts.push(pageText);
}

const textContent = textParts.join('\n\n');
```

### Étape 2 : Découpage en chunks

Pour les longs PDF, le texte est découpé en morceaux de 6000 caractères :

```typescript
function splitTextIntoChunks(text: string, maxChunkSize: number = 6000): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
```

### Étape 3 : Extraction IA par chunk

Chaque chunk est analysé par GPT-4o-mini avec un prompt spécialisé BTP :

```typescript
const prompt = `Tu es un expert en extraction de données BTP.

CONTEXTE: Fichier PDF, partie ${i + 1}/${chunks.length}
DEVISE DÉTECTÉE: ${globalCurrency}

CONTENU À ANALYSER:
"""
${chunk}
"""

MISSION CHIRURGICALE - EXTRACTION COMPLÈTE:
1. Identifie CHAQUE matériau, article, équipement
2. Extrais les quantités (même approximatives)
3. Détecte les unités (m, m², m³, kg, L, U, pièce, lot)
4. PRIX: Extrais le prix unitaire si mentionné
5. DEVISE: Identifie la devise (EUR, USD, XAF/FCFA, etc.)
6. FOURNISSEUR: Identifie le fournisseur ou marque

FORMAT JSON:
{
  "items": [
    {
      "name": "Ciment CEM II 42.5",
      "quantity": 50,
      "unit": "sac",
      "price": 4500,
      "currency": "XAF",
      "supplier": "CIMENCAM",
      "category": "Gros œuvre"
    }
  ]
}`;
```

### Étape 4 : Fusion et déduplication

Les résultats de tous les chunks sont fusionnés et dédupliqués.

---

## Processus CSV

### Détection automatique du séparateur

```typescript
function parseCSV(content: string): { headers: string[], rows: string[][] } {
  const lines = content.split('\n').filter(line => line.trim());
  const firstLine = lines[0];
  
  // Détection du séparateur
  let separator = ',';
  if (firstLine.includes(';') && !firstLine.includes(',')) separator = ';';
  if (firstLine.includes('\t')) separator = '\t';
  
  const headers = lines[0].split(separator).map(h => h.trim());
  const rows = lines.slice(1).map(line => 
    line.split(separator).map(cell => cell.trim())
  );
  
  return { headers, rows };
}
```

### Mapping intelligent des colonnes

```typescript
const headerLower = headers.map(h => h.toLowerCase());

// Détection colonne NOM
const nameIdx = headerLower.findIndex(h => 
  h.includes('nom') || h.includes('désignation') || 
  h.includes('article') || h.includes('produit') ||
  h.includes('name') || h.includes('item')
);

// Détection colonne PRIX
const priceIdx = headerLower.findIndex(h => 
  h.includes('prix') || h.includes('price') || 
  h.includes('tarif') || h.includes('cout') ||
  h.includes('pu') || h.includes('montant')
);

// Détection colonne FOURNISSEUR
const supplierIdx = headerLower.findIndex(h => 
  h.includes('fournisseur') || h.includes('supplier') ||
  h.includes('fabricant') || h.includes('marque')
);
```

---

## Processus Word (DOC, DOCX)

### Extraction avec Mammoth.js

```typescript
const mammoth = await import('mammoth');
const arrayBuffer = await file.arrayBuffer();
const result = await mammoth.extractRawText({ arrayBuffer });
const textContent = result.value;
```

### Traitement identique au PDF

Une fois le texte extrait, le processus est identique à celui des PDF :
1. Découpage en chunks
2. Extraction IA par chunk
3. Fusion et déduplication

---

## Processus TXT

### Lecture directe

```typescript
const textContent = await file.text();
```

### Traitement IA

Le texte brut est traité par l'IA avec le même prompt que pour les PDF.

---

## Extraction des prix et fournisseurs

### Colonnes détectées automatiquement

| Type | Mots-clés recherchés |
|------|---------------------|
| **Prix** | `prix`, `price`, `tarif`, `cout`, `coût`, `cost`, `pu`, `p.u`, `montant`, `valeur` |
| **Prix unitaire** | `prix unitaire`, `unit price`, `pu`, `p.u` |
| **Prix total** | `prix total`, `montant`, `total`, `amount` |
| **Fournisseur** | `fournisseur`, `supplier`, `vendor`, `fabricant`, `manufacturer`, `marque`, `brand` |
| **Devise** | `devise`, `currency`, `monnaie` |

### Parsing des prix

```typescript
function parsePrice(value: string): { price: number | null, currency: string | null } {
  const currency = detectCurrency(value);
  
  // Nettoyage: enlever symboles, espaces, convertir virgule
  let cleanPrice = value
    .replace(/[€$£¥]/g, '')
    .replace(/fcfa|xaf|eur|usd/gi, '')
    .replace(/\s/g, '')
    .replace(/,/g, '.')
    .trim();
  
  const match = cleanPrice.match(/[\d.]+/);
  const price = match ? parseFloat(match[0]) : null;
  
  return { price, currency };
}
```

---

## Gestion des devises

### Devises supportées

| Code ISO | Symboles | Région |
|----------|----------|--------|
| `EUR` | €, eur | Europe |
| `USD` | $, usd | USA |
| `XAF` | fcfa, xaf, cfa | Afrique Centrale |
| `XOF` | fcfa, xof | Afrique Ouest |
| `GBP` | £, gbp | Royaume-Uni |
| `CNY` | ¥, cny, rmb | Chine |
| `MAD` | dh, mad | Maroc |
| `DZD` | da, dzd | Algérie |
| `TND` | tnd | Tunisie |

### Détection automatique

```typescript
function detectCurrency(text: string): string | null {
  if (!text) return null;
  const textLower = text.toLowerCase();
  
  if (textLower.includes('€') || textLower.includes('eur')) return 'EUR';
  if (textLower.includes('$') || textLower.includes('usd')) return 'USD';
  if (textLower.includes('fcfa') || textLower.includes('xaf')) return 'XAF';
  if (textLower.includes('£') || textLower.includes('gbp')) return 'GBP';
  if (textLower.includes('¥') || textLower.includes('cny')) return 'CNY';
  // ...
  
  return null;
}
```

### Détection globale du document

La devise est d'abord recherchée dans :
1. Les en-têtes de colonnes
2. Les 5 premières lignes de données
3. Le contenu global (pour PDF/TXT)

---

## Déduplication intelligente

### Algorithme

```typescript
function deduplicateItems(items: any[]): any[] {
  const seen = new Map<string, any>();
  
  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    
    if (seen.has(key)) {
      const existing = seen.get(key);
      
      // Fusionner les quantités
      if (item.quantity && existing.quantity) {
        existing.quantity += item.quantity;
      }
      
      // Garder la description la plus longue
      if (item.description?.length > existing.description?.length) {
        existing.description = item.description;
      }
      
      // Garder le prix s'il n'existe pas
      if (item.price && !existing.price) {
        existing.price = item.price;
        existing.currency = item.currency;
      }
      
      // Garder le fournisseur s'il n'existe pas
      if (item.supplier && !existing.supplier) {
        existing.supplier = item.supplier;
      }
    } else {
      seen.set(key, { ...item });
    }
  }
  
  return Array.from(seen.values());
}
```

### Règles de fusion

| Champ | Règle |
|-------|-------|
| **Quantité** | Cumul des quantités |
| **Description** | Garder la plus longue |
| **Prix** | Garder le premier trouvé |
| **Fournisseur** | Garder le premier trouvé |
| **Catégorie** | Garder la première |

---

## Stockage des données

### Table `materials`

```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity NUMERIC,
  specs JSONB  -- Contient les données extraites
);
```

### Structure `specs`

```json
{
  "unit": "m²",
  "extracted_by": "ai-extraction",
  "file_type": "pdf",
  "extracted_price": 4500,
  "extracted_currency": "XAF",
  "extracted_supplier": "CIMENCAM"
}
```

### Table `material_prices`

```sql
CREATE TABLE material_prices (
  id UUID PRIMARY KEY,
  material_id UUID REFERENCES materials(id),
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XAF',
  country TEXT DEFAULT 'local',
  supplier_name TEXT,
  source TEXT,
  is_reference BOOLEAN DEFAULT false
);
```

---

## API Reference

### POST `/api/ai/extract-from-file`

Extrait les matériaux depuis un fichier PDF, CSV, TXT ou DOC.

**Request (FormData):**

| Champ | Type | Description |
|-------|------|-------------|
| `file` | File | Fichier à analyser (optionnel si textContent) |
| `textContent` | string | Contenu texte extrait (pour PDF/DOC) |
| `fileType` | string | Type de fichier (`pdf`, `csv`, `txt`, `doc`) |
| `sector` | string | Secteur d'activité (défaut: `Construction BTP`) |

**Response:**

```json
{
  "success": true,
  "items": [
    {
      "name": "Ciment CEM II 42.5",
      "description": "Sac de 50kg",
      "category": "Gros œuvre",
      "quantity": 100,
      "unit": "sac",
      "price": 4500,
      "currency": "XAF",
      "supplier": "CIMENCAM"
    }
  ],
  "categories": ["Gros œuvre", "Second œuvre"],
  "suppliers": ["CIMENCAM", "DANGOTE"],
  "detectedCurrency": "XAF",
  "method": "ai-extraction",
  "fileType": "pdf",
  "stats": {
    "chunks": 3,
    "totalChars": 15420,
    "rawItems": 156,
    "uniqueItems": 134,
    "itemsWithPrice": 98,
    "itemsWithSupplier": 45
  }
}
```

### POST `/api/ai/analyze-file-structure`

Analyse la structure d'un fichier Excel pour détecter les colonnes.

**Request:**

```json
{
  "fileSample": [["", "Cat", "Nom", "Qté"], ...],
  "fileName": "devis.xlsx"
}
```

**Response:**

```json
{
  "config": {
    "headerRowIndex": 0,
    "columns": {
      "name": 2,
      "category": 1,
      "quantity": 3
    }
  },
  "model": "gpt-4o-mini"
}
```

---

## Bonnes pratiques

### Pour les fichiers Excel

1. ✅ Utiliser une ligne d'en-tête claire
2. ✅ Éviter les cellules fusionnées
3. ✅ Mettre les données dans la première feuille
4. ✅ Utiliser des noms de colonnes explicites

### Pour les fichiers PDF

1. ✅ Préférer les PDF texte (pas scannés)
2. ✅ Structure tabulaire si possible
3. ✅ Mentionner la devise dans le document
4. ✅ Inclure les noms de fournisseurs

### Pour les fichiers CSV

1. ✅ Utiliser un séparateur cohérent (`;` ou `,`)
2. ✅ Première ligne = en-têtes
3. ✅ Encodage UTF-8
4. ✅ Pas de lignes vides au milieu

---

## Limites connues

| Limite | Impact | Contournement |
|--------|--------|---------------|
| PDF scannés | Pas d'extraction | Utiliser OCR externe |
| Fichiers > 10MB | Timeout possible | Découper le fichier |
| Tableaux complexes | Perte de structure | Simplifier le format |
| Langues non-latines | Extraction partielle | Traduire avant import |

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | 2024-11 | Support Excel + CSV |
| 1.1 | 2024-11 | Ajout PDF, Word, TXT |
| 1.2 | 2024-12 | Extraction prix/devise/fournisseur |
| 1.3 | 2024-12 | Déduplication intelligente |

---

*Documentation générée le 2 décembre 2024*
