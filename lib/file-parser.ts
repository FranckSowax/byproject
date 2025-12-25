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
 * Parse un fichier PDF (extraction de texte simple)
 */
export async function parsePDF(file: File): Promise<ParseResult> {
  // Pour le PDF, on va extraire le texte et chercher des patterns
  // Note: Nécessite une bibliothèque comme pdf.js
  return {
    materials: [],
    totalItems: 0,
    chunks: 0,
    errors: ['Import PDF en cours de développement. Utilisez CSV ou Excel pour le moment.']
  };
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
