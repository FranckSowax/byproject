import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as XLSX from 'xlsx';

// Configuration pour Netlify/Vercel
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Timeout plus court pour éviter les 504
const API_TIMEOUT_MS = 25000;
const GEMINI_TIMEOUT_MS = 20000;

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

// Client Gemini
const getGeminiClient = () => {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

// ============================================================================
// TYPES
// ============================================================================

interface SheetPreview {
  index: number;
  name: string;
  sheet_type: 'detailed' | 'summary' | 'recap' | 'unknown';
  rows_count: number;
  cols_count: number;
  estimated_items: number;
  date?: string;
  building_ref?: string;
  devis_ref?: string;
  sample_categories: string[];
  sample_items: string[];
  is_selected: boolean;
}

interface DQEItem {
  numero?: string;
  designation: string;
  unite: string;
  quantite: number;
  prix_unitaire?: number;
  prix_total?: number;
  category?: string;
  subcategory?: string;
  lot_numero?: string;
  lot_nom?: string;
  niveau?: string;
  dosage?: string;
  dimensions?: string;
  epaisseur?: string;
  materiaux?: string[];
}

interface DQECategory {
  name: string;
  items: DQEItem[];
  subtotal?: number;
}

interface DQESheet {
  sheet_name: string;
  sheet_type: string;
  building_ref?: string;
  date?: string;
  categories: DQECategory[];
  total_items: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// CATÉGORIES BTP
// ============================================================================

const CATEGORIES_BTP = [
  "Terrassement & VRD",
  "Béton & Gros œuvre",
  "Maçonnerie",
  "Charpente & Structure métallique",
  "Couverture & Étanchéité",
  "Menuiserie bois",
  "Menuiserie aluminium",
  "Menuiserie métallique",
  "Carrelage & Revêtements sols",
  "Revêtements muraux",
  "Plomberie & Sanitaire",
  "Électricité & Câblage",
  "Climatisation & Ventilation",
  "Peinture & Finitions",
  "Faux plafonds",
  "Serrurerie & Ferronnerie",
  "Vitrerie & Miroiterie",
  "Divers & Imprévus"
];

const CATEGORY_KEYWORDS = [
  'NETTOYAGE', 'RESEAUX', 'TRAITEMENT', 'ELEVATION', 'MACONNERIES',
  'PLANCHER', 'ESCALIERS', 'ENDUITS', 'REVETEMENT', 'EQUIPEMENTS',
  'PEINTURE', 'MENUISERIE', 'ELECTRICITE', 'PLOMBERIE', 'ETANCHEITE',
  'CARRELAGE', 'FAIENCE', 'SANITAIRE', 'CHAUFFAGE', 'CLIMATISATION',
  'AERATION', 'FONDATION', 'TERRASSEMENT', 'COUVERTURE', 'CHARPENTE'
];

const VALID_UNITS = new Set([
  'M2', 'M²', 'ML', 'M3', 'M³', 'U', 'KG', 'L', 'ENS', 'FF', 'PM',
  'M', 'T', 'HL', 'LITRE', 'UNITE', 'FORFAIT', 'ENSEMBLE'
]);

const HEADER_PATTERNS = [
  /DESIGANTION|DESIGNATION/i,
  /QUANTITE|QTE|QTÉ/i,
  /UNITE|U\b/i,
  /MONTANT|TOTAL/i
];

const SUBTOTAL_PATTERNS = [
  /sous\s*total/i,
  /total\s*\d/i,
  /s\/total/i,
  /sous-total/i
];

// ============================================================================
// UTILITAIRES
// ============================================================================

function detectSheetType(sheetName: string, content: string): SheetPreview['sheet_type'] {
  const nameLower = sheetName.toLowerCase();

  if (nameLower.includes('recap')) return 'recap';
  if (nameLower.startsWith('n°') || nameLower.startsWith('n ')) return 'detailed';
  if (['type', 'achat', 'pog', 'ages'].some(x => nameLower.includes(x))) return 'summary';

  const contentLower = content.toLowerCase();
  if (contentLower.includes('prix unitaire') || contentLower.includes(' pu ')) return 'detailed';
  if (contentLower.includes('quantite')) return 'summary';

  return 'unknown';
}

function extractMetadata(rows: any[][], maxRow: number): Record<string, string | undefined> {
  const metadata: Record<string, string | undefined> = {};

  for (let i = 0; i < Math.min(maxRow, rows.length); i++) {
    const rowStr = rows[i].filter(Boolean).join(' ');

    // Date
    const dateMatch = rowStr.match(/(\d{1,2}[/\s]?\w+[/\s]?\d{4})/);
    if (dateMatch && !metadata.date) {
      metadata.date = dateMatch[1];
    }

    // Référence bâtiment
    const batMatch = rowStr.match(/BAT\s*:\s*(\d+[A-Z]?)/i);
    if (batMatch) {
      metadata.building_ref = batMatch[1];
    }

    // Référence devis
    const devisMatch = rowStr.match(/Devis\s*N°?\s*([\d\-/]+)/i);
    if (devisMatch) {
      metadata.devis_ref = devisMatch[1];
    }
  }

  return metadata;
}

function estimateItemsCount(rows: any[][]): number {
  let count = 0;
  for (const row of rows) {
    for (const cell of row.slice(0, 5)) {
      const cellStr = String(cell || '').toUpperCase().trim();
      if (VALID_UNITS.has(cellStr)) {
        count++;
        break;
      }
    }
  }
  return count;
}

function getSamples(rows: any[][]): { categories: string[]; items: string[] } {
  const categories: string[] = [];
  const items: string[] = [];

  for (let i = 0; i < Math.min(100, rows.length); i++) {
    const row = rows[i].filter(Boolean).map(String);
    if (!row.length) continue;

    const firstVal = row[0] || '';

    // Détecter catégories
    if (CATEGORY_KEYWORDS.some(kw => firstVal.toUpperCase().includes(kw))) {
      if (!categories.includes(firstVal) && categories.length < 5) {
        categories.push(firstVal.substring(0, 50));
      }
    }

    // Détecter items (ont une unité)
    for (const val of row) {
      if (VALID_UNITS.has(String(val).toUpperCase().trim())) {
        if (firstVal.length > 10 && !items.includes(firstVal) && items.length < 5) {
          items.push(firstVal.length > 60 ? firstVal.substring(0, 60) + '...' : firstVal);
        }
        break;
      }
    }
  }

  return { categories, items };
}

function findHeaderRow(rows: any[][]): number {
  for (let i = 0; i < Math.min(50, rows.length); i++) {
    const rowStr = rows[i].filter(Boolean).join(' ').toUpperCase();
    const matches = HEADER_PATTERNS.filter(p => p.test(rowStr)).length;
    if (matches >= 2) return i;
  }
  return -1;
}

function classifyLine(row: any[], colMapping: Record<string, number>): 'item' | 'category' | 'subtotal' | 'total' | 'empty' {
  const designation = String(row[colMapping.designation] || '').trim();
  const unite = String(row[colMapping.unite] || '').toUpperCase().trim();
  const quantite = row[colMapping.quantite];

  if (!designation || designation === 'nan') return 'empty';

  // Sous-total
  if (SUBTOTAL_PATTERNS.some(p => p.test(designation.toLowerCase()))) return 'subtotal';

  // Total général
  if (/^total\s*general/i.test(designation.toLowerCase())) return 'total';

  // Item (a une unité valide et une quantité)
  const hasValidUnit = VALID_UNITS.has(unite) || (unite.length <= 3 && /^[A-Z]+$/.test(unite));
  const hasQuantity = quantite !== null && quantite !== undefined && !isNaN(Number(quantite));

  if (hasValidUnit && hasQuantity && unite !== '' && unite !== 'NAN') return 'item';

  // Catégorie
  if (designation === designation.toUpperCase() || CATEGORY_KEYWORDS.some(kw => designation.toUpperCase().includes(kw))) {
    return 'category';
  }

  return 'empty';
}

function normalizeUnit(unit: string): string {
  const unitUpper = unit.toUpperCase().trim();
  const normalization: Record<string, string> = {
    'M²': 'M2', 'M³': 'M3', 'METRE': 'M',
    'KILOGRAMME': 'KG', 'LITRE': 'L', 'ENSEMBLE': 'ENS',
    'FORFAIT': 'FF', 'UNITE': 'U'
  };
  return normalization[unitUpper] || (unitUpper !== 'NAN' ? unitUpper : '');
}

function safeFloat(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

function categorizeItem(designation: string): { category: string; subcategory?: string } {
  const lower = designation.toLowerCase();

  const keywordsMap: Record<string, string[]> = {
    "Terrassement & VRD": ['terrassement', 'fouille', 'remblai', 'déblai', 'excavation', 'vrd', 'voirie'],
    "Béton & Gros œuvre": ['béton', 'beton', 'armé', 'coffrage', 'ferraillage', 'poteau', 'poutre', 'dalle', 'fondation', 'semelle'],
    "Maçonnerie": ['maçonnerie', 'parpaing', 'agglo', 'brique', 'mur', 'cloison', 'élévation'],
    "Charpente & Structure métallique": ['charpente', 'structure métallique', 'acier', 'ipn', 'ipe'],
    "Couverture & Étanchéité": ['couverture', 'toiture', 'étanchéité', 'tôle', 'bac', 'tuile', 'gouttière'],
    "Menuiserie bois": ['menuiserie bois', 'porte bois', 'fenêtre bois', 'placard', 'parquet'],
    "Menuiserie aluminium": ['aluminium', 'alu', 'baie vitrée', 'coulissant'],
    "Menuiserie métallique": ['menuiserie métallique', 'porte métallique', 'grille', 'portail'],
    "Carrelage & Revêtements sols": ['carrelage', 'faïence', 'grès', 'céramique', 'sol', 'plinthe'],
    "Revêtements muraux": ['revêtement mural', 'enduit', 'crépi', 'stuc'],
    "Plomberie & Sanitaire": ['plomberie', 'sanitaire', 'tuyau', 'canalisation', 'wc', 'lavabo', 'douche'],
    "Électricité & Câblage": ['électricité', 'câble', 'fil', 'gaine', 'tableau', 'disjoncteur', 'prise'],
    "Climatisation & Ventilation": ['climatisation', 'clim', 'ventilation', 'vmc', 'split'],
    "Peinture & Finitions": ['peinture', 'impression', 'finition', 'laque', 'vernis'],
    "Faux plafonds": ['faux plafond', 'plafond suspendu', 'ba13', 'placo', 'staff'],
    "Serrurerie & Ferronnerie": ['serrurerie', 'ferronnerie', 'serrure', 'poignée'],
    "Vitrerie & Miroiterie": ['vitrerie', 'verre', 'vitrage', 'miroir'],
  };

  let bestMatch = "Divers & Imprévus";
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(keywordsMap)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = cat;
    }
  }

  // Sous-catégorie pour béton
  let subcategory: string | undefined;
  if (bestMatch === "Béton & Gros œuvre") {
    if (lower.includes('fondation') || lower.includes('semelle')) subcategory = "Fondations";
    else if (lower.includes('dalle')) subcategory = "Dalles";
    else if (lower.includes('poteau')) subcategory = "Poteaux";
    else if (lower.includes('poutre')) subcategory = "Poutres";
  }

  return { category: bestMatch, subcategory };
}

// ============================================================================
// ANALYSE D'UN FICHIER EXCEL
// ============================================================================

async function analyzeExcelFile(fileBuffer: ArrayBuffer): Promise<{ sheets: SheetPreview[]; summary: any }> {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheets: SheetPreview[] = [];

  for (let i = 0; i < workbook.SheetNames.length; i++) {
    const sheetName = workbook.SheetNames[i];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const contentStr = rows.slice(0, 50).flat().filter(Boolean).join(' ');
    const metadata = extractMetadata(rows, 30);
    const samples = getSamples(rows);

    sheets.push({
      index: i,
      name: sheetName,
      sheet_type: detectSheetType(sheetName, contentStr),
      rows_count: rows.length,
      cols_count: rows[0]?.length || 0,
      estimated_items: estimateItemsCount(rows),
      date: metadata.date,
      building_ref: metadata.building_ref,
      devis_ref: metadata.devis_ref,
      sample_categories: samples.categories,
      sample_items: samples.items,
      is_selected: true
    });
  }

  return {
    sheets,
    summary: {
      detailed_sheets: sheets.filter(s => s.sheet_type === 'detailed').length,
      summary_sheets: sheets.filter(s => s.sheet_type === 'summary').length,
      recap_sheets: sheets.filter(s => s.sheet_type === 'recap').length,
      total_estimated_items: sheets.reduce((sum, s) => sum + s.estimated_items, 0)
    }
  };
}

// ============================================================================
// EXTRACTION LOCALE (sans IA)
// ============================================================================

function extractSheetLocal(worksheet: XLSX.WorkSheet, sheetName: string, sheetType: string): DQESheet {
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const headerRow = findHeaderRow(rows);

  const colMapping = {
    code: 0,
    designation: 1,
    unite: 2,
    quantite: 3,
    pu: 4,
    montant: 5
  };

  const metadata = extractMetadata(rows, headerRow > 0 ? headerRow : 30);
  const categories: DQECategory[] = [];
  let currentCategory: string | null = null;
  let currentItems: DQEItem[] = [];

  const startRow = headerRow >= 0 ? headerRow + 1 : 25;

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.length) continue;

    const lineType = classifyLine(row, colMapping);

    if (lineType === 'category') {
      if (currentCategory && currentItems.length) {
        categories.push({
          name: currentCategory,
          items: [...currentItems]
        });
      }
      currentCategory = String(row[colMapping.designation] || '').trim();
      currentItems = [];
    } else if (lineType === 'item') {
      const designation = String(row[colMapping.designation] || '').trim();
      if (!designation) continue;

      const { category, subcategory } = categorizeItem(designation);

      currentItems.push({
        numero: row[colMapping.code] ? String(row[colMapping.code]) : undefined,
        designation,
        unite: normalizeUnit(String(row[colMapping.unite] || '')),
        quantite: safeFloat(row[colMapping.quantite]) || 0,
        prix_unitaire: safeFloat(row[colMapping.pu]),
        prix_total: safeFloat(row[colMapping.montant]),
        category: category,
        subcategory: subcategory
      });
    } else if (lineType === 'subtotal') {
      if (currentCategory && currentItems.length) {
        categories.push({
          name: currentCategory,
          items: [...currentItems],
          subtotal: safeFloat(row[colMapping.montant])
        });
        currentCategory = null;
        currentItems = [];
      }
    }
  }

  // Ajouter la dernière catégorie
  if (currentCategory && currentItems.length) {
    categories.push({
      name: currentCategory,
      items: [...currentItems]
    });
  }

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return {
    sheet_name: sheetName,
    sheet_type: sheetType,
    building_ref: metadata.building_ref,
    date: metadata.date,
    categories,
    total_items: totalItems,
    metadata
  };
}

// ============================================================================
// EXTRACTION AVEC GEMINI (IA)
// ============================================================================

// ============================================================================
// AMÉLIORATION DES CATÉGORIES AVEC GEMINI (post-extraction locale)
// ============================================================================

async function improveCategoriesWithGemini(
  items: { designation: string; category?: string }[]
): Promise<Record<number, string>> {
  const gemini = getGeminiClient();
  if (!gemini || items.length === 0) {
    return {};
  }

  // Limiter à 50 items pour éviter timeout
  const itemsToProcess = items.slice(0, 50);

  // Créer une liste simple des désignations
  const itemsList = itemsToProcess.map((item, idx) =>
    `${idx}: ${item.designation.substring(0, 80)}`
  ).join('\n');

  const prompt = `Expert BTP. Catégorise ces ${itemsToProcess.length} matériaux de construction.

MATÉRIAUX:
${itemsList}

CATÉGORIES VALIDES:
${CATEGORIES_BTP.join(', ')}

Retourne un JSON avec l'index et la catégorie:
{"0":"Béton & Gros œuvre","1":"Maçonnerie","2":"Peinture & Finitions"}

UNIQUEMENT le JSON, pas de commentaire.`;

  try {
    console.log(`🏷️ Gemini catégorisation de ${itemsToProcess.length} items...`);

    const model = gemini.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
      },
    });

    const result = await withTimeout(
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
      GEMINI_TIMEOUT_MS,
      `Gemini catégorisation timeout`
    );

    const responseText = result.response.text()?.trim() || '';

    let cleanJson = responseText;
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const categoryMap = JSON.parse(cleanJson);
    console.log(`✅ Gemini a catégorisé ${Object.keys(categoryMap).length} items`);

    // Convertir les clés string en number
    const result_map: Record<number, string> = {};
    for (const [key, value] of Object.entries(categoryMap)) {
      const idx = parseInt(key, 10);
      if (!isNaN(idx) && typeof value === 'string' && CATEGORIES_BTP.includes(value)) {
        result_map[idx] = value;
      }
    }

    return result_map;

  } catch (error: any) {
    console.error(`❌ Erreur Gemini catégorisation:`, error?.message || error);
    return {};
  }
}

// ============================================================================
// ENDPOINTS
// ============================================================================

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'analyze';

  console.log(`📂 === EXTRACT-DQE API: ${action} ===`);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'Fichier Excel requis'
      }, { status: 400 });
    }

    // Vérifier le type
    if (!file.name.match(/\.xlsx?$/i)) {
      return NextResponse.json({
        success: false,
        error: 'Format non supporté. Utilisez .xlsx ou .xls'
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // ==================== ACTION: ANALYZE ====================
    if (action === 'analyze') {
      const analysis = await analyzeExcelFile(arrayBuffer);

      return NextResponse.json({
        success: true,
        status: 'analyzed',
        file_info: {
          name: file.name,
          size: file.size,
          total_sheets: analysis.sheets.length
        },
        sheets: analysis.sheets,
        summary: analysis.summary
      });
    }

    // ==================== ACTION: EXTRACT ====================
    if (action === 'extract') {
      const selectedSheetsParam = formData.get('selected_sheets') as string | null;
      const useAI = formData.get('use_ai') !== 'false'; // Par défaut: true

      let selectedSheets: string[] = [];
      if (selectedSheetsParam) {
        try {
          selectedSheets = JSON.parse(selectedSheetsParam);
        } catch {
          selectedSheets = selectedSheetsParam.split(',').map(s => s.trim());
        }
      }

      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Si aucun onglet sélectionné, prendre tous
      if (!selectedSheets.length) {
        selectedSheets = workbook.SheetNames;
      }

      console.log(`📋 Extraction LOCALE de ${selectedSheets.length} onglets`);

      const results: DQESheet[] = [];
      const errors: { sheet: string; error: string }[] = [];

      // ÉTAPE 1: Extraction locale (rapide et fiable)
      for (const sheetName of selectedSheets) {
        if (!workbook.SheetNames.includes(sheetName)) {
          errors.push({ sheet: sheetName, error: 'Onglet non trouvé' });
          continue;
        }

        try {
          const worksheet = workbook.Sheets[sheetName];
          const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const contentStr = rows.slice(0, 50).flat().filter(Boolean).join(' ');
          const sheetType = detectSheetType(sheetName, contentStr);

          // Toujours extraction locale d'abord
          const sheetData = extractSheetLocal(worksheet, sheetName, sheetType);
          results.push(sheetData);
          console.log(`✅ ${sheetName}: ${sheetData.total_items} items (local)`);

        } catch (error: any) {
          console.error(`❌ Erreur ${sheetName}:`, error);
          errors.push({ sheet: sheetName, error: error.message });
        }
      }

      // ÉTAPE 2: Amélioration des catégories avec Gemini (si activé)
      if (useAI && results.length > 0) {
        console.log(`🏷️ Amélioration des catégories avec Gemini...`);

        // Collecter tous les items avec catégorie "Divers" ou mal catégorisés
        const allItems: { sheetIdx: number; catIdx: number; itemIdx: number; designation: string; category?: string }[] = [];

        results.forEach((sheet, sheetIdx) => {
          sheet.categories.forEach((cat, catIdx) => {
            cat.items.forEach((item, itemIdx) => {
              // Prioriser les items mal catégorisés
              if (!item.category || item.category === 'Divers & Imprévus') {
                allItems.push({
                  sheetIdx,
                  catIdx,
                  itemIdx,
                  designation: item.designation,
                  category: item.category
                });
              }
            });
          });
        });

        if (allItems.length > 0) {
          console.log(`📝 ${allItems.length} items à améliorer`);

          // Appeler Gemini pour améliorer les catégories
          const improvedCategories = await improveCategoriesWithGemini(
            allItems.map(i => ({ designation: i.designation, category: i.category }))
          );

          // Appliquer les améliorations
          let improved = 0;
          for (const [idxStr, newCategory] of Object.entries(improvedCategories)) {
            const idx = parseInt(idxStr, 10);
            if (idx < allItems.length) {
              const { sheetIdx, catIdx, itemIdx } = allItems[idx];
              results[sheetIdx].categories[catIdx].items[itemIdx].category = newCategory;
              improved++;
            }
          }

          console.log(`✅ ${improved} catégories améliorées par Gemini`);
        }
      }

      // Calculer les statistiques
      const totalItems = results.reduce((sum, s) => sum + s.total_items, 0);
      const extractedItems = results.flatMap(s => s.categories.flatMap(c => c.items));

      // Résumé par catégorie BTP
      const resumeCategories: Record<string, { nombre: number; total: number }> = {};
      for (const item of extractedItems) {
        const cat = item.category || 'Divers & Imprévus';
        if (!resumeCategories[cat]) {
          resumeCategories[cat] = { nombre: 0, total: 0 };
        }
        resumeCategories[cat].nombre++;
        resumeCategories[cat].total += item.prix_total || 0;
      }

      // Matériaux agrégés
      const aggregatedMaterials: Record<string, {
        designation: string;
        unite: string;
        total_quantite: number;
        occurrences: number;
        sheets: string[];
      }> = {};

      for (const sheet of results) {
        for (const cat of sheet.categories) {
          for (const item of cat.items) {
            const key = item.designation.toLowerCase().substring(0, 100).replace(/\s+/g, ' ').trim();
            if (!aggregatedMaterials[key]) {
              aggregatedMaterials[key] = {
                designation: item.designation,
                unite: item.unite,
                total_quantite: 0,
                occurrences: 0,
                sheets: []
              };
            }
            aggregatedMaterials[key].total_quantite += item.quantite;
            aggregatedMaterials[key].occurrences++;
            if (!aggregatedMaterials[key].sheets.includes(sheet.sheet_name)) {
              aggregatedMaterials[key].sheets.push(sheet.sheet_name);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        status: 'extracted',
        extraction_info: {
          timestamp: new Date().toISOString(),
          sheets_extracted: results.length,
          total_items: totalItems,
          errors
        },
        data: {
          source_file: file.name,
          sheets: results
        },
        resume_categories: resumeCategories,
        aggregated_materials: Object.values(aggregatedMaterials)
          .sort((a, b) => b.total_quantite - a.total_quantite)
      });
    }

    return NextResponse.json({
      success: false,
      error: `Action inconnue: ${action}. Utilisez 'analyze' ou 'extract'`
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Erreur DQE:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du traitement',
      details: error?.message || 'Erreur inconnue'
    }, { status: 500 });
  }
}
