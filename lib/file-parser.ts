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
 * Adapté pour les listes de frais de chantier, devis, BOM (Bill of Materials)
 */
function extractMaterialsFromText(text: string): ParsedMaterial[] {
  const materials: ParsedMaterial[] = [];
  const seen = new Set<string>();

  // Catégories BTP pour classification automatique
  const categoryKeywords: Record<string, string[]> = {
    'Personnel & Main d\'œuvre': ['personnel', 'main d\'œuvre', 'chef', 'équipe', 'maîtrise', 'ouvrier', 'technicien', 'géomètre', 'conducteur', 'pointage', 'paie', 'salaire'],
    'Matériel & Équipement': ['matériel', 'équipement', 'outillage', 'machine', 'engin', 'outil', 'appareil'],
    'Installation de chantier': ['installation', 'montage', 'implantation', 'mise en place', 'atelier', 'baraque', 'clôture'],
    'Transport & Levage': ['transport', 'levage', 'manutention', 'grue', 'chariot', 'camion', 'véhicule'],
    'Sécurité & Protection': ['sécurité', 'protection', 'casque', 'gant', 'hygiène', 'EPI', 'cirés', 'bottes', 'gilet'],
    'Bureau & Administration': ['bureau', 'administratif', 'comptabilité', 'papeterie', 'téléphone', 'fax', 'internet', 'courrier', 'timbres', 'dessin'],
    'Essais & Contrôles': ['essai', 'contrôle', 'test', 'analyse', 'laboratoire', 'sondage', 'éprouvette', 'mortier', 'béton'],
    'Frais généraux': ['frais', 'assurance', 'autorisation', 'publicité', 'éclairage', 'chauffage', 'énergie', 'eau'],
    'Documents & Plans': ['document', 'plan', 'graphique', 'tirage', 'duplication', 'relevé', 'attachement', 'situation', 'mémoire', 'facture'],
    'Nettoyage & Entretien': ['nettoyage', 'balayage', 'entretien', 'gravois', 'déchet', 'évacuation'],
    'Divers': ['divers', 'pourboire', 'médecin', 'pharmacie', 'photo', 'film'],
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

    // === Pattern 2: Sous-sections (1.1. Sous-titre, 2.3. Sous-titre, etc.) ===
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
      'grue', 'chariot', 'atelier', 'comptabilité', 'paie', 'photographie'
    ];

    const lowerLine = trimmed.toLowerCase();
    for (const keyword of btpKeywords) {
      if (lowerLine.includes(keyword)) {
        // Extraire la phrase/segment contenant le mot-clé
        addMaterial(trimmed, currentCategory);
        break;
      }
    }

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
