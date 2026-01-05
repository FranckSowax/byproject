import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Configuration pour Netlify/Vercel
export const maxDuration = 60; // 60 secondes max pour les gros fichiers
export const dynamic = 'force-dynamic';

// Taille max d'un chunk (en caractères) - ~4000 tokens
const MAX_CHUNK_SIZE = 12000;
// Overlap entre chunks pour ne pas couper des éléments
const CHUNK_OVERLAP = 500;

interface ParsedItem {
  name: string;
  description?: string;
  category: string;
  quantity?: number;
  unit?: string;
  specs?: Record<string, any>;
}

interface ParseResult {
  items: ParsedItem[];
  categories: string[];
  rawItemCount: number;
}

/**
 * Client OpenAI
 */
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

/**
 * Client DeepSeek (compatible OpenAI API)
 */
const getDeepSeekClient = () => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com/v1',
  });
};

/**
 * Catégories par secteur d'activité
 */
const SECTOR_CATEGORIES: Record<string, string[]> = {
  'BTP': [
    'Personnel & Main d\'œuvre',
    'Gros œuvre & Matériaux',
    'Électricité',
    'Plomberie & Sanitaire',
    'Menuiserie & Bois',
    'Peinture & Finitions',
    'Carrelage & Revêtements',
    'Quincaillerie & Fixations',
    'Outillage & Équipement',
    'Sécurité & Protection (EPI)',
    'Transport & Levage',
    'Installation de chantier',
    'Bureau & Administration',
    'Essais & Contrôles',
    'Nettoyage & Entretien',
    'Frais généraux',
    'Divers',
  ],
  'Import': [
    'Électronique & High-Tech',
    'Textile & Habillement',
    'Mobilier & Décoration',
    'Équipement industriel',
    'Pièces détachées',
    'Emballage & Conditionnement',
    'Matières premières',
    'Produits finis',
    'Accessoires',
    'Échantillons',
    'Divers',
  ],
  'Commerce': [
    'Produits alimentaires',
    'Boissons',
    'Cosmétiques & Hygiène',
    'Électroménager',
    'Mobilier',
    'Textile',
    'Papeterie & Bureau',
    'Jouets & Loisirs',
    'Sports & Outdoor',
    'Auto & Moto',
    'Divers',
  ],
  'default': [
    'Équipement',
    'Matériaux',
    'Fournitures',
    'Services',
    'Main d\'œuvre',
    'Transport',
    'Frais divers',
    'Divers',
  ],
};

/**
 * Découpe le texte en chunks avec overlap
 */
function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + MAX_CHUNK_SIZE;

    // Essayer de couper à une fin de ligne
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      if (lastNewline > start + MAX_CHUNK_SIZE / 2) {
        end = lastNewline + 1;
      }
    }

    chunks.push(text.slice(start, end));
    start = end - CHUNK_OVERLAP;
    if (start < 0) start = 0;
  }

  return chunks;
}

/**
 * Génère le prompt système selon le secteur
 */
function getSystemPrompt(sector: string): string {
  const categories = SECTOR_CATEGORIES[sector] || SECTOR_CATEGORIES['default'];

  return `Tu es un EXPERT en extraction et catégorisation de données pour le secteur "${sector}".

TON OBJECTIF: Extraire TOUS les éléments, matériaux, articles ou items mentionnés dans le texte fourni.

CATÉGORIES DISPONIBLES (utilise EXACTEMENT ces noms):
${categories.map(c => `• ${c}`).join('\n')}

RÈGLES D'EXTRACTION:
1. Extrais CHAQUE élément individuellement (ne regroupe pas)
2. Un élément par ligne du document source = un item séparé
3. Détecte les quantités et unités si présentes
4. Catégorise intelligemment selon le contexte
5. Ignore les en-têtes, totaux, numéros de page, métadonnées
6. Corrige les fautes d'orthographe évidentes
7. Si un élément est listé entre parenthèses (ex: "gants, bottes, casques"), crée 3 items séparés

FORMAT DE RÉPONSE (JSON STRICT):
{
  "items": [
    {
      "name": "Nom de l'élément (corrigé et formaté)",
      "description": "Détails supplémentaires ou null",
      "category": "Catégorie exacte de la liste",
      "quantity": 10,
      "unit": "unité (u, kg, m, m², L, etc.)"
    }
  ],
  "totalExtracted": 15
}

IMPORTANT:
- Réponds UNIQUEMENT avec du JSON valide
- Pas de texte avant ou après le JSON
- Pas de blocs markdown \`\`\``;
}

/**
 * Appel à l'IA (OpenAI ou DeepSeek)
 */
async function callAI(
  text: string,
  sector: string,
  chunkIndex: number,
  totalChunks: number
): Promise<{ items: ParsedItem[]; model: string }> {
  const userPrompt = `CONTENU À ANALYSER (Partie ${chunkIndex + 1}/${totalChunks}):

${text}

Extrais TOUS les éléments/matériaux de ce texte. Réponds en JSON.`;

  const systemPrompt = getSystemPrompt(sector);

  // Essayer OpenAI d'abord
  const openai = getOpenAIClient();
  if (openai) {
    try {
      console.log(`🤖 OpenAI: Processing chunk ${chunkIndex + 1}/${totalChunks}`);
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content?.trim() || '{}';
      const result = JSON.parse(content);
      return { items: result.items || [], model: 'gpt-4o-mini' };
    } catch (error) {
      console.error('OpenAI error:', error);
      // Continue vers DeepSeek
    }
  }

  // Fallback DeepSeek
  const deepseek = getDeepSeekClient();
  if (deepseek) {
    try {
      console.log(`🔄 DeepSeek fallback: Processing chunk ${chunkIndex + 1}/${totalChunks}`);
      const completion = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 8000,
      });

      const content = completion.choices[0]?.message?.content?.trim() || '{}';
      // DeepSeek peut retourner du markdown, nettoyer
      const cleanContent = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '');
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return { items: result.items || [], model: 'deepseek-chat' };
      }
    } catch (error) {
      console.error('DeepSeek error:', error);
    }
  }

  // Aucun modèle disponible
  throw new Error('Aucun service IA disponible (OpenAI et DeepSeek non configurés ou en erreur)');
}

/**
 * Déduplique les items par nom normalisé
 */
function deduplicateItems(items: ParsedItem[]): ParsedItem[] {
  const seen = new Map<string, ParsedItem>();

  for (const item of items) {
    const normalizedName = item.name
      .toLowerCase()
      .replace(/[^a-zà-ÿ0-9]/g, '')
      .trim();

    if (normalizedName.length < 3) continue;

    // Garder l'item avec le plus de détails
    const existing = seen.get(normalizedName);
    if (!existing) {
      seen.set(normalizedName, item);
    } else if (
      (item.quantity && !existing.quantity) ||
      (item.description && !existing.description)
    ) {
      seen.set(normalizedName, { ...existing, ...item });
    }
  }

  return Array.from(seen.values());
}

/**
 * Endpoint principal
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { text, sector = 'BTP', projectName } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Le texte à analyser est requis' },
        { status: 400 }
      );
    }

    console.log(`📄 Parsing materials for project "${projectName || 'N/A'}" (sector: ${sector})`);
    console.log(`📊 Text length: ${text.length} characters`);

    // Découper en chunks si nécessaire
    const chunks = text.length > MAX_CHUNK_SIZE ? splitIntoChunks(text) : [text];
    console.log(`📦 Split into ${chunks.length} chunk(s)`);

    // Traiter chaque chunk
    const allItems: ParsedItem[] = [];
    let modelUsed = '';

    for (let i = 0; i < chunks.length; i++) {
      try {
        const { items, model } = await callAI(chunks[i], sector, i, chunks.length);
        allItems.push(...items);
        modelUsed = model;
        console.log(`✅ Chunk ${i + 1}/${chunks.length}: ${items.length} items extracted`);
      } catch (error) {
        console.error(`❌ Chunk ${i + 1} error:`, error);
        // Continuer avec les autres chunks
      }
    }

    // Dédupliquer les résultats
    const uniqueItems = deduplicateItems(allItems);
    console.log(`🔄 Deduplication: ${allItems.length} → ${uniqueItems.length} items`);

    // Extraire les catégories utilisées
    const usedCategories = [...new Set(uniqueItems.map(item => item.category))].sort();

    // Trier par catégorie puis par nom
    uniqueItems.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Completed in ${duration}ms: ${uniqueItems.length} unique items`);

    return NextResponse.json({
      success: true,
      items: uniqueItems,
      categories: usedCategories,
      stats: {
        rawItemCount: allItems.length,
        uniqueItemCount: uniqueItems.length,
        chunksProcessed: chunks.length,
        durationMs: duration,
        model: modelUsed,
      },
    });
  } catch (error) {
    console.error('❌ Parse materials error:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'analyse',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
