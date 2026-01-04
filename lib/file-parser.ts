// @ts-nocheck
// Utilitaires pour parser les fichiers (PDF, CSV, Excel)
import * as XLSX from 'xlsx';

export interface ParsedMaterial {
  name: string;
  category?: string;
  quantity?: number;
  weight?: number;
  volume?: number;
  specs?: Record<string, any>;
}

export interface ParseResult {
  materials: ParsedMaterial[];
  totalItems: number;
  chunks: number;
  errors: string[];
}

// Taille maximale par chunk (en nombre de lignes)
const MAX_CHUNK_SIZE = 100;

/**
 * Parse un fichier CSV
 */
export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          return resolve({
            materials: [],
            totalItems: 0,
            chunks: 0,
            errors: ['Fichier vide']
          });
        }

        // Première ligne = headers
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const materials: ParsedMaterial[] = [];
        const errors: string[] = [];

        // Parser les lignes
        for (let i = 1; i < lines.length; i++) {
          try {
            const values = lines[i].split(',').map(v => v.trim());
            const material: ParsedMaterial = {
              name: '',
            };

            headers.forEach((header, index) => {
              const value = values[index];
              
              if (header.includes('nom') || header.includes('name') || header.includes('designation')) {
                material.name = value;
              } else if (header.includes('categorie') || header.includes('category')) {
                material.category = value;
              } else if (header.includes('quantite') || header.includes('quantity') || header.includes('qty')) {
                material.quantity = parseFloat(value) || undefined;
              } else if (header.includes('poids') || header.includes('weight')) {
                material.weight = parseFloat(value) || undefined;
              } else if (header.includes('volume')) {
                material.volume = parseFloat(value) || undefined;
              } else {
                // Autres colonnes dans specs
                if (!material.specs) material.specs = {};
                material.specs[header] = value;
              }
            });

            if (material.name) {
              materials.push(material);
            }
          } catch (err) {
            errors.push(`Ligne ${i + 1}: ${err}`);
          }
        }

        const chunks = Math.ceil(materials.length / MAX_CHUNK_SIZE);

        resolve({
          materials,
          totalItems: materials.length,
          chunks,
          errors
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsText(file);
  });
}

/**
 * Parse un fichier Excel
 */
export async function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Prendre la première feuille
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        if (jsonData.length === 0) {
          return resolve({
            materials: [],
            totalItems: 0,
            chunks: 0,
            errors: ['Fichier vide']
          });
        }

        const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
        const materials: ParsedMaterial[] = [];
        const errors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          try {
            const row = jsonData[i];
            const material: ParsedMaterial = {
              name: '',
            };

            headers.forEach((header, index) => {
              const value = row[index];
              
              if (header.includes('nom') || header.includes('name') || header.includes('designation')) {
                material.name = String(value || '');
              } else if (header.includes('categorie') || header.includes('category')) {
                material.category = String(value || '');
              } else if (header.includes('quantite') || header.includes('quantity') || header.includes('qty')) {
                material.quantity = parseFloat(value) || undefined;
              } else if (header.includes('poids') || header.includes('weight')) {
                material.weight = parseFloat(value) || undefined;
              } else if (header.includes('volume')) {
                material.volume = parseFloat(value) || undefined;
              } else if (value) {
                if (!material.specs) material.specs = {};
                material.specs[header] = String(value);
              }
            });

            if (material.name) {
              materials.push(material);
            }
          } catch (err) {
            errors.push(`Ligne ${i + 1}: ${err}`);
          }
        }

        const chunks = Math.ceil(materials.length / MAX_CHUNK_SIZE);

        resolve({
          materials,
          totalItems: materials.length,
          chunks,
          errors
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Parse un fichier PDF (extraction de texte avec pdf.js)
 */
export async function parsePDF(file: File): Promise<ParseResult> {
  try {
    // Import dynamique de pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');

    // Configurer le worker - utiliser unpkg qui a toutes les versions
    // ou désactiver le worker pour un fonctionnement en mode fallback
    if (typeof window !== 'undefined') {
      // Utiliser unpkg.com qui héberge toutes les versions npm
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    // Lire le fichier comme ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Charger le document PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    const errors: string[] = [];

    // Extraire le texte de chaque page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      } catch (pageError) {
        errors.push(`Erreur page ${pageNum}: ${pageError}`);
      }
    }

    console.log('📄 Texte PDF extrait:', fullText.substring(0, 500) + '...');

    // Parser le texte pour extraire les matériaux/éléments
    const materials = extractMaterialsFromText(fullText);

    const chunks = Math.ceil(materials.length / MAX_CHUNK_SIZE);

    return {
      materials,
      totalItems: materials.length,
      chunks,
      errors,
      rawText: fullText // Ajouter le texte brut pour analyse IA si besoin
    } as ParseResult & { rawText: string };
  } catch (err) {
    console.error('Erreur parsing PDF:', err);
    return {
      materials: [],
      totalItems: 0,
      chunks: 0,
      errors: [`Erreur lors de la lecture du PDF: ${err}`]
    };
  }
}

/**
 * Extrait les matériaux/éléments d'un texte brut
 * Adapté pour les listes de frais de chantier, devis, etc.
 */
function extractMaterialsFromText(text: string): ParsedMaterial[] {
  const materials: ParsedMaterial[] = [];
  const seen = new Set<string>();

  // Nettoyer le texte
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/−/g, '-')
    .replace(/…/g, '...');

  // Patterns pour détecter les éléments de liste
  const patterns = [
    // Pattern 1: Tirets avec texte (- Element)
    /[-−–]\s*([A-ZÀ-Ýa-zà-ÿ][^-−–\n]{3,80})/g,

    // Pattern 2: Numérotation (1.1., 2.3., etc.)
    /(\d+\.\d+\.?\s*[A-ZÀ-Ý][^0-9\n]{5,100})/g,

    // Pattern 3: Éléments entre parenthèses descriptifs
    /([A-ZÀ-Ý][a-zà-ÿ\s]{3,50})\s*\([^)]+\)/g,

    // Pattern 4: Mots-clés BTP avec contexte
    /((?:installation|matériel|équipement|frais|personnel|outillage|transport|levage|chantier|bureau|essai|protection|sécurité|entretien|gardiennage)[s]?\s+[a-zà-ÿA-ZÀ-Ý\s]{3,50})/gi,
  ];

  // Catégories BTP pour classification
  const categories: Record<string, string[]> = {
    'Personnel': ['personnel', 'main d\'œuvre', 'chef', 'équipe', 'maîtrise', 'ouvrier', 'technicien', 'géomètre'],
    'Matériel': ['matériel', 'équipement', 'outillage', 'machine', 'engin', 'outil'],
    'Installation': ['installation', 'montage', 'implantation', 'mise en place'],
    'Transport': ['transport', 'levage', 'manutention', 'grue', 'chariot'],
    'Sécurité': ['sécurité', 'protection', 'casque', 'gant', 'hygiène', 'EPI'],
    'Bureau': ['bureau', 'administratif', 'comptabilité', 'papeterie', 'téléphone'],
    'Essais': ['essai', 'contrôle', 'test', 'analyse', 'laboratoire', 'sondage'],
    'Frais généraux': ['frais', 'assurance', 'autorisation', 'publicité', 'éclairage', 'chauffage'],
  };

  // Fonction pour catégoriser un élément
  const categorize = (name: string): string => {
    const lower = name.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => lower.includes(kw))) {
        return category;
      }
    }
    return 'Autre';
  };

  // Extraire avec chaque pattern
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(cleanText)) !== null) {
      const rawName = match[1] || match[0];
      const name = rawName
        .trim()
        .replace(/^\d+\.\d+\.?\s*/, '') // Retirer numérotation
        .replace(/^[-−–]\s*/, '') // Retirer tirets
        .replace(/\s+/g, ' ')
        .trim();

      // Filtrer les éléments trop courts ou non pertinents
      if (name.length < 5 || name.length > 100) continue;
      if (/^(le|la|les|de|du|des|et|ou|en|à|pour|avec|sans|sur|sous|dans|par|www|http|pdf|doc)/i.test(name)) continue;

      // Éviter les doublons (normalisation)
      const normalizedKey = name.toLowerCase().replace(/[^a-zà-ÿ]/g, '');
      if (seen.has(normalizedKey)) continue;
      seen.add(normalizedKey);

      materials.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        category: categorize(name),
      });
    }
  }

  // Extraction supplémentaire: lignes qui commencent par des majuscules
  const lines = text.split(/[\n\r]+/);
  for (const line of lines) {
    const trimmed = line.trim();

    // Lignes qui ressemblent à des titres de section (ex: "1. Frais d'encadrement...")
    const sectionMatch = trimmed.match(/^(\d+\.)\s*([A-ZÀ-Ý][^0-9]{10,80})/);
    if (sectionMatch) {
      const name = sectionMatch[2].trim();
      const normalizedKey = name.toLowerCase().replace(/[^a-zà-ÿ]/g, '');
      if (!seen.has(normalizedKey) && name.length >= 10) {
        seen.add(normalizedKey);
        materials.push({
          name,
          category: categorize(name),
        });
      }
    }
  }

  console.log(`📋 ${materials.length} éléments extraits du PDF`);

  return materials;
}

/**
 * Découpe les matériaux en chunks pour traitement progressif
 */
export function chunkMaterials(materials: ParsedMaterial[], chunkSize: number = MAX_CHUNK_SIZE): ParsedMaterial[][] {
  const chunks: ParsedMaterial[][] = [];
  
  for (let i = 0; i < materials.length; i += chunkSize) {
    chunks.push(materials.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Fonction principale pour parser un fichier
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'csv':
      return parseCSV(file);
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    case 'pdf':
      return parsePDF(file);
    default:
      throw new Error(`Format de fichier non supporté: ${extension}`);
  }
}
