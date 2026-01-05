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
  rawText?: string; // Texte brut pour analyse IA
}

export interface AIParseResult {
  items: Array<{
    name: string;
    description?: string;
    category: string;
    quantity?: number;
    unit?: string;
  }>;
  categories: string[];
  stats: {
    rawItemCount: number;
    uniqueItemCount: number;
    chunksProcessed: number;
    durationMs: number;
    model: string;
  };
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

        // Collecter tous les items avec leur position Y
        const items = (textContent.items as any[])
          .filter(item => item.str && item.str.trim())
          .map(item => ({
            text: item.str,
            y: item.transform[5],
            x: item.transform[4],
          }));

        // Trier par Y décroissant (haut en bas) puis X croissant (gauche à droite)
        items.sort((a, b) => {
          if (Math.abs(a.y - b.y) > 3) {
            return b.y - a.y; // Y décroissant
          }
          return a.x - b.x; // X croissant
        });

        // Reconstruire le texte avec des retours à la ligne basés sur la position Y
        let lastY: number | null = null;
        let pageText = '';

        for (const item of items) {
          // Si la position Y change significativement, c'est une nouvelle ligne
          if (lastY !== null && Math.abs(item.y - lastY) > 3) {
            pageText += '\n';
          } else if (lastY !== null) {
            pageText += ' ';
          }
          pageText += item.text;
          lastY = item.y;
        }

        fullText += pageText + '\n\n';
        console.log(`📄 Page ${pageNum}: ${items.length} éléments texte extraits`);
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
 * Adapté pour les listes de frais de chantier, devis, BOM (Bill of Materials)
 * VERSION AMÉLIORÉE - Extraction exhaustive de tous les éléments
 */
function extractMaterialsFromText(text: string): ParsedMaterial[] {
  const materials: ParsedMaterial[] = [];
  const seen = new Set<string>();

  // Catégories BTP pour classification automatique
  const categoryKeywords: Record<string, string[]> = {
    'Personnel & Main d\'œuvre': ['personnel', 'main d\'œuvre', 'chef', 'équipe', 'maîtrise', 'ouvrier', 'technicien', 'géomètre', 'conducteur', 'pointage', 'paie', 'salaire', 'pointeur'],
    'Matériel & Équipement': ['matériel', 'équipement', 'outillage', 'machine', 'engin', 'outil', 'appareil', 'petit outillage', 'gros matériel'],
    'Installation de chantier': ['installation', 'montage', 'implantation', 'mise en place', 'atelier', 'baraque', 'clôture', 'branchement', 'panneau', 'signalisation'],
    'Transport & Levage': ['transport', 'levage', 'manutention', 'grue', 'chariot', 'camion', 'véhicule', 'déchargement'],
    'Sécurité & Protection': ['sécurité', 'protection', 'casque', 'gant', 'hygiène', 'EPI', 'cirés', 'bottes', 'gilet', 'gardiennage'],
    'Bureau & Administration': ['bureau', 'administratif', 'comptabilité', 'papeterie', 'téléphone', 'fax', 'internet', 'courrier', 'timbres', 'dessin', 'secrétariat'],
    'Essais & Contrôles': ['essai', 'contrôle', 'test', 'analyse', 'laboratoire', 'sondage', 'éprouvette', 'mortier', 'béton', 'granulat', 'agrégat'],
    'Frais généraux': ['frais', 'assurance', 'autorisation', 'publicité', 'éclairage', 'chauffage', 'énergie', 'eau', 'électricité'],
    'Documents & Plans': ['document', 'plan', 'graphique', 'tirage', 'duplication', 'relevé', 'attachement', 'situation', 'mémoire', 'facture', 'dossier'],
    'Nettoyage & Entretien': ['nettoyage', 'balayage', 'entretien', 'gravois', 'déchet', 'évacuation', 'repliement', 'remise en état'],
    'Alimentation & Restauration': ['cantine', 'restauration', 'café', 'boisson', 'réception', 'cocktail'],
    'Divers': ['divers', 'pourboire', 'médecin', 'pharmacie', 'photo', 'film', 'photographie'],
  };

  // Fonction pour catégoriser un élément
  const categorize = (name: string): string => {
    const lower = name.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => lower.includes(kw))) {
        return category;
      }
    }
    return 'Autre';
  };

  // Fonction pour ajouter un matériau (avec déduplication)
  const addMaterial = (name: string, category?: string) => {
    // Nettoyer le nom
    let cleanName = name
      .trim()
      .replace(/^\d+\.\d*\.?\s*/, '') // Retirer numérotation (1.1., 2.3., etc.)
      .replace(/^[-−–•]\s*/, '') // Retirer tirets et puces
      .replace(/\s+/g, ' ')
      .replace(/[,;:]$/, '') // Retirer ponctuation finale
      .trim();

    // Ignorer si trop court ou trop long
    if (cleanName.length < 3 || cleanName.length > 150) return;

    // Ignorer les mots de liaison seuls
    if (/^(le|la|les|de|du|des|et|ou|en|à|pour|avec|sans|sur|sous|dans|par|un|une|ce|cette|son|sa|ses|leur|www|http|pdf|doc|©|annexe)$/i.test(cleanName)) return;

    // Ignorer si commence par un mot de liaison
    if (/^(le |la |les |de |du |des |et |ou |en |à |pour |avec )$/i.test(cleanName.substring(0, 4))) return;

    // Normaliser pour déduplication
    const normalizedKey = cleanName.toLowerCase().replace(/[^a-zà-ÿéèêëàâäùûüîïôö]/g, '');
    if (normalizedKey.length < 3) return;
    if (seen.has(normalizedKey)) return;
    seen.add(normalizedKey);

    // Capitaliser la première lettre
    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    materials.push({
      name: cleanName,
      category: category || categorize(cleanName),
    });
  };

  // === EXTRACTION PRINCIPALE ===

  // Normaliser le texte
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/−/g, '-')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/'/g, "'")
    .replace(/«|»/g, '"');

  // Garder trace de la catégorie courante (pour les listes hiérarchiques)
  let currentCategory = 'Autre';

  // Traiter ligne par ligne
  const lines = normalizedText.split('\n');

  console.log(`📄 Traitement de ${lines.length} lignes extraites du PDF`);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) continue;

    // === Pattern 1: Titres de section principaux (1. Titre, 2. Titre, etc.) ===
    const mainSectionMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
    if (mainSectionMatch) {
      const sectionTitle = mainSectionMatch[2].trim();
      // Mettre à jour la catégorie courante basée sur le titre
      currentCategory = categorize(sectionTitle);
      // Ajouter le titre comme élément
      if (sectionTitle.length >= 5) {
        addMaterial(sectionTitle, currentCategory);
      }
      continue;
    }

    // === Pattern 2: Sous-sections (1.1. Sous-titre, 1.1 Sous-titre, 2.3. Sous-titre, etc.) ===
    const subSectionMatch = trimmed.match(/^(\d+\.\d+\.?)\s*(.+)$/);
    if (subSectionMatch) {
      const subTitle = subSectionMatch[2].trim();
      if (subTitle.length >= 3) {
        addMaterial(subTitle, currentCategory);
      }
      continue;
    }

    // === Pattern 3: Éléments avec tiret ou puce (- Element, • Element) ===
    const bulletMatch = trimmed.match(/^[-−–•]\s*(.+)$/);
    if (bulletMatch) {
      const item = bulletMatch[1].trim();
      if (item.length >= 3) {
        addMaterial(item, currentCategory);
      }
      continue;
    }

    // === Pattern 4: Éléments entre parenthèses - extraire séparément ===
    const parenthesesMatches = trimmed.matchAll(/\(([^)]{3,50})\)/g);
    for (const match of parenthesesMatches) {
      const content = match[1].trim();
      // Si contient des éléments séparés par virgule
      if (content.includes(',')) {
        content.split(',').forEach(part => {
          const partTrimmed = part.trim();
          if (partTrimmed.length >= 3) {
            addMaterial(partTrimmed, currentCategory);
          }
        });
      }
    }

    // === Pattern 5: Lignes avec mots-clés BTP importants ===
    const btpKeywords = [
      'outillage', 'matériel', 'équipement', 'installation', 'transport',
      'levage', 'protection', 'sécurité', 'essai', 'contrôle', 'bureau',
      'éclairage', 'chauffage', 'nettoyage', 'gardiennage', 'cantine',
      'téléphone', 'assurance', 'panneaux', 'signalisation', 'véhicule',
      'grue', 'chariot', 'atelier', 'comptabilité', 'paie', 'photographie',
      'clôture', 'barrière', 'panneau', 'branchement', 'électricité',
      'eau', 'téléphone', 'internet', 'sondage', 'repliement', 'évacuation'
    ];

    const lowerLine = trimmed.toLowerCase();
    let matched = false;
    for (const keyword of btpKeywords) {
      if (lowerLine.includes(keyword)) {
        // Extraire la phrase/segment contenant le mot-clé
        addMaterial(trimmed, currentCategory);
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // === Pattern 6: Éléments séparés par des virgules sur une ligne ===
    if (trimmed.includes(',') && !trimmed.match(/^\d/) && trimmed.length < 200) {
      const parts = trimmed.split(',');
      if (parts.length >= 2 && parts.length <= 10) {
        let allValid = true;
        for (const part of parts) {
          const p = part.trim();
          if (p.length < 3 || p.length > 60) {
            allValid = false;
            break;
          }
        }
        if (allValid) {
          parts.forEach(part => {
            addMaterial(part.trim(), currentCategory);
          });
          continue;
        }
      }
    }

    // === Pattern 7: NOUVEAU - Capturer TOUTE ligne qui semble être un élément de liste ===
    // Ceci est une approche plus agressive pour ne rien manquer
    // On capture les lignes qui ne sont pas des titres évidents et ont une longueur raisonnable
    if (trimmed.length >= 5 && trimmed.length <= 120) {
      // Exclure les lignes qui sont clairement des métadonnées
      const excludePatterns = [
        /^page\s*\d+/i,
        /^\d+\/\d+$/,  // pagination
        /^www\./i,
        /^http/i,
        /^©/,
        /^annexe/i,
        /^table\s+des\s+matières/i,
        /^sommaire/i,
        /^\d+\s*$/,  // juste un numéro
      ];

      let shouldExclude = false;
      for (const pattern of excludePatterns) {
        if (pattern.test(trimmed)) {
          shouldExclude = true;
          break;
        }
      }

      if (!shouldExclude) {
        // Si la ligne contient au moins un mot de plus de 3 caractères alphabétiques
        const hasSubstantialWord = /[a-zA-ZÀ-ÿ]{4,}/.test(trimmed);
        if (hasSubstantialWord) {
          addMaterial(trimmed, currentCategory);
        }
      }
    }
  }

  // === POST-TRAITEMENT ===

  // Trier par catégorie puis par nom
  materials.sort((a, b) => {
    if (a.category !== b.category) {
      return (a.category || '').localeCompare(b.category || '');
    }
    return a.name.localeCompare(b.name);
  });

  console.log(`📋 ${materials.length} éléments extraits du PDF`);
  console.log('Catégories trouvées:', [...new Set(materials.map(m => m.category))]);

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

/**
 * Extrait le texte brut d'un fichier pour analyse IA
 * Retourne uniquement le texte, sans parsing regex
 */
export async function extractRawText(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'csv': {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => reject(new Error('Erreur de lecture CSV'));
        reader.readAsText(file);
      });
    }

    case 'xlsx':
    case 'xls': {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            let fullText = '';

            // Extraire le texte de toutes les feuilles
            for (const sheetName of workbook.SheetNames) {
              const sheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

              for (const row of jsonData) {
                if (row && row.length > 0) {
                  fullText += row.filter(Boolean).join(' | ') + '\n';
                }
              }
              fullText += '\n';
            }

            resolve(fullText);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Erreur de lecture Excel'));
        reader.readAsBinaryString(file);
      });
    }

    case 'pdf': {
      try {
        const pdfjsLib = await import('pdfjs-dist');

        if (typeof window !== 'undefined') {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          // Collecter tous les items avec leur position Y
          const items = (textContent.items as any[])
            .filter(item => item.str && item.str.trim())
            .map(item => ({
              text: item.str,
              y: item.transform[5],
              x: item.transform[4],
            }));

          // Trier par Y décroissant puis X croissant
          items.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
            return a.x - b.x;
          });

          // Reconstruire le texte
          let lastY: number | null = null;
          let pageText = '';

          for (const item of items) {
            if (lastY !== null && Math.abs(item.y - lastY) > 3) {
              pageText += '\n';
            } else if (lastY !== null) {
              pageText += ' ';
            }
            pageText += item.text;
            lastY = item.y;
          }

          fullText += pageText + '\n\n';
        }

        return fullText;
      } catch (err) {
        console.error('Erreur extraction texte PDF:', err);
        throw new Error(`Erreur lors de l'extraction du texte PDF: ${err}`);
      }
    }

    default:
      throw new Error(`Format de fichier non supporté: ${extension}`);
  }
}

/**
 * Parse un fichier avec l'IA (extraction intelligente)
 * Utilise l'API /api/ai/parse-materials
 */
export async function parseFileWithAI(
  file: File,
  sector: string = 'BTP',
  projectName?: string
): Promise<AIParseResult> {
  console.log(`🤖 Parsing file with AI: ${file.name} (sector: ${sector})`);

  // Étape 1: Extraire le texte brut
  const rawText = await extractRawText(file);
  console.log(`📄 Extracted ${rawText.length} characters of raw text`);

  if (!rawText.trim()) {
    return {
      items: [],
      categories: [],
      stats: {
        rawItemCount: 0,
        uniqueItemCount: 0,
        chunksProcessed: 0,
        durationMs: 0,
        model: 'none',
      },
    };
  }

  // Étape 2: Envoyer à l'API IA
  const response = await fetch('/api/ai/parse-materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: rawText,
      sector,
      projectName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur API: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Erreur lors de l\'analyse IA');
  }

  console.log(`✅ AI extracted ${result.items.length} items in ${result.stats.durationMs}ms`);

  return {
    items: result.items,
    categories: result.categories,
    stats: result.stats,
  };
}

/**
 * Convertit le résultat IA en ParseResult standard
 */
export function aiResultToParseResult(aiResult: AIParseResult): ParseResult {
  const materials: ParsedMaterial[] = aiResult.items.map(item => ({
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    specs: item.description ? { description: item.description, unit: item.unit } : undefined,
  }));

  return {
    materials,
    totalItems: materials.length,
    chunks: Math.ceil(materials.length / MAX_CHUNK_SIZE),
    errors: [],
    rawText: undefined,
  };
}
