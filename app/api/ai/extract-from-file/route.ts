import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Replicate from 'replicate';

// Configuration pour Netlify - timeout étendu pour les gros fichiers
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Fonction pour découper le texte en chunks intelligents
function splitTextIntoChunks(text: string, maxChunkSize: number = 8000): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    // Si ajouter cette ligne dépasse la limite, sauvegarder le chunk actuel
    if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }
  
  // Ajouter le dernier chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Fonction pour parser le CSV
function parseCSV(content: string): { headers: string[], rows: string[][] } {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  // Détecter le séparateur (virgule, point-virgule, tabulation)
  const firstLine = lines[0];
  let separator = ',';
  if (firstLine.includes(';') && !firstLine.includes(',')) separator = ';';
  if (firstLine.includes('\t')) separator = '\t';
  
  const headers = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map(line => 
    line.split(separator).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );
  
  return { headers, rows };
}

// Extraction pour CSV - déterministe et rapide
async function extractFromCSV(content: string, sector: string): Promise<any> {
  const { headers, rows } = parseCSV(content);
  
  if (rows.length === 0) {
    return { items: [], categories: [], method: 'csv-empty' };
  }

  // Mapper les colonnes intelligemment
  const headerLower = headers.map(h => h.toLowerCase());
  
  const nameIdx = headerLower.findIndex(h => 
    h.includes('nom') || h.includes('désignation') || h.includes('designation') || 
    h.includes('article') || h.includes('produit') || h.includes('matériau') || 
    h.includes('materiau') || h.includes('libellé') || h.includes('libelle') ||
    h.includes('name') || h.includes('item') || h.includes('description')
  );
  
  const qtyIdx = headerLower.findIndex(h => 
    h.includes('quantité') || h.includes('quantite') || h.includes('qté') || 
    h.includes('qte') || h.includes('qty') || h.includes('nombre') || h.includes('quantity')
  );
  
  const unitIdx = headerLower.findIndex(h => 
    h.includes('unité') || h.includes('unite') || h.includes('unit') || h.includes('u.')
  );
  
  const catIdx = headerLower.findIndex(h => 
    h.includes('catégorie') || h.includes('categorie') || h.includes('category') || 
    h.includes('type') || h.includes('famille') || h.includes('groupe')
  );
  
  const descIdx = headerLower.findIndex(h => 
    h.includes('description') || h.includes('détail') || h.includes('detail') || 
    h.includes('commentaire') || h.includes('note') || h.includes('spec')
  );

  const items: any[] = [];
  const categories = new Set<string>();

  for (const row of rows) {
    // Trouver le nom - si pas de colonne identifiée, prendre la première non-vide
    let name = nameIdx >= 0 ? row[nameIdx] : row.find(cell => cell && cell.length > 2);
    
    if (!name || name.trim().length < 2) continue;
    if (name.toLowerCase().includes('total')) continue;
    
    name = name.trim();
    
    let quantity = qtyIdx >= 0 ? parseFloat(row[qtyIdx]?.replace(/[^\d.,]/g, '').replace(',', '.')) : null;
    if (isNaN(quantity as number)) quantity = null;
    
    const unit = unitIdx >= 0 ? row[unitIdx]?.trim() : null;
    const category = catIdx >= 0 ? row[catIdx]?.trim() || 'Non catégorisé' : 'Non catégorisé';
    const description = descIdx >= 0 ? row[descIdx]?.trim() : null;
    
    items.push({
      name,
      description,
      category,
      quantity,
      unit
    });
    
    if (category && category !== 'Non catégorisé') {
      categories.add(category);
    }
  }

  return {
    items,
    categories: Array.from(categories),
    method: 'csv-deterministic',
    stats: {
      totalRows: rows.length,
      extractedItems: items.length,
      headers
    }
  };
}

// Extraction pour texte brut (TXT, DOC converti, PDF converti)
async function extractFromText(content: string, sector: string, fileType: string): Promise<any> {
  const chunks = splitTextIntoChunks(content, 6000);
  const allItems: any[] = [];
  const allCategories = new Set<string>();
  
  console.log(`📄 Processing ${fileType}: ${chunks.length} chunks, ${content.length} chars total`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    const prompt = `Tu es un expert en extraction de données BTP pour le secteur "${sector}".

CONTEXTE: Fichier ${fileType.toUpperCase()}, partie ${i + 1}/${chunks.length}

CONTENU À ANALYSER:
"""
${chunk}
"""

MISSION CHIRURGICALE:
1. Identifie CHAQUE matériau, article, équipement ou produit mentionné
2. Extrais les quantités si présentes (même approximatives)
3. Détecte les unités (m, m², m³, kg, L, U, pièce, lot, etc.)
4. Catégorise selon les standards BTP:
   - Gros œuvre (béton, ciment, parpaings, ferraillage...)
   - Second œuvre (plâtre, cloisons, isolation...)
   - Électricité (câbles, prises, disjoncteurs...)
   - Plomberie (tuyaux, raccords, sanitaires...)
   - Menuiserie (portes, fenêtres, bois...)
   - Revêtements (carrelage, peinture, parquet...)
   - Quincaillerie (vis, boulons, fixations...)
   - Outillage
   - Divers

RÈGLES:
- Ignore les en-têtes, titres de sections, numéros de page
- Ignore les totaux et sous-totaux
- Si un article apparaît plusieurs fois, garde chaque occurrence
- Sois exhaustif: mieux vaut extraire trop que pas assez

FORMAT JSON STRICT (sans markdown):
{
  "items": [
    {
      "name": "Nom exact du matériau",
      "description": "Détails additionnels ou null",
      "category": "Catégorie BTP",
      "quantity": 10.5,
      "unit": "m²"
    }
  ],
  "categories": ["Liste des catégories trouvées"]
}`;

    try {
      // Utiliser GPT-4o-mini pour une extraction précise
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un expert extraction BTP ultra-précis. Tu extrais TOUS les matériaux mentionnés. Réponds UNIQUEMENT en JSON valide.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
      
      try {
        const result = JSON.parse(responseText);
        if (result.items && Array.isArray(result.items)) {
          allItems.push(...result.items);
        }
        if (result.categories && Array.isArray(result.categories)) {
          result.categories.forEach((cat: string) => allCategories.add(cat));
        }
      } catch (parseError) {
        console.error(`Parse error for chunk ${i + 1}:`, parseError);
      }
      
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
    }
  }

  // Dédupliquer les items similaires
  const uniqueItems = deduplicateItems(allItems);

  return {
    items: uniqueItems,
    categories: Array.from(allCategories),
    method: 'ai-extraction',
    stats: {
      chunks: chunks.length,
      totalChars: content.length,
      rawItems: allItems.length,
      uniqueItems: uniqueItems.length
    }
  };
}

// Fonction de déduplication intelligente
function deduplicateItems(items: any[]): any[] {
  const seen = new Map<string, any>();
  
  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    
    if (seen.has(key)) {
      // Fusionner les quantités si possible
      const existing = seen.get(key);
      if (item.quantity && existing.quantity) {
        existing.quantity += item.quantity;
      } else if (item.quantity && !existing.quantity) {
        existing.quantity = item.quantity;
      }
      // Garder la description la plus longue
      if (item.description && (!existing.description || item.description.length > existing.description.length)) {
        existing.description = item.description;
      }
    } else {
      seen.set(key, { ...item });
    }
  }
  
  return Array.from(seen.values());
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const textContent = formData.get('textContent') as string | null;
    const fileType = formData.get('fileType') as string || 'unknown';
    const sector = formData.get('sector') as string || 'Construction BTP';

    let content = textContent || '';
    let detectedType = fileType.toLowerCase();

    // Si un fichier est fourni, lire son contenu
    if (file) {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.csv')) {
        detectedType = 'csv';
        content = await file.text();
      } else if (fileName.endsWith('.txt')) {
        detectedType = 'txt';
        content = await file.text();
      } else if (fileName.endsWith('.pdf')) {
        detectedType = 'pdf';
        // Pour PDF, le contenu doit être extrait côté client avec pdf.js
        // ou on utilise le textContent fourni
        if (!textContent) {
          return NextResponse.json({
            error: 'Pour les PDF, veuillez extraire le texte côté client avec pdf.js',
            hint: 'Utilisez pdfjs-dist pour extraire le texte avant d\'appeler cette API'
          }, { status: 400 });
        }
      } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        detectedType = 'doc';
        // Pour DOC/DOCX, le contenu doit être extrait côté client
        if (!textContent) {
          return NextResponse.json({
            error: 'Pour les fichiers Word, veuillez extraire le texte côté client',
            hint: 'Utilisez mammoth.js pour les fichiers .docx'
          }, { status: 400 });
        }
      }
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json({
        error: 'Contenu insuffisant pour extraction',
        received: content?.length || 0
      }, { status: 400 });
    }

    console.log(`📁 Processing ${detectedType} file: ${content.length} chars`);

    let result;

    // Choisir la méthode d'extraction selon le type
    if (detectedType === 'csv') {
      result = await extractFromCSV(content, sector);
    } else {
      // TXT, PDF (texte extrait), DOC (texte extrait)
      result = await extractFromText(content, sector, detectedType);
    }

    console.log(`✅ Extracted ${result.items.length} items via ${result.method}`);

    return NextResponse.json({
      success: true,
      ...result,
      fileType: detectedType
    });

  } catch (error) {
    console.error('❌ Extraction error:', error);
    return NextResponse.json({
      error: 'Erreur lors de l\'extraction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
