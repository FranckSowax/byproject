import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize clients
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Check if Gemini 3 Pro is available
const useGemini = !!process.env.REPLICATE_API_TOKEN;

// Configuration pour le chunking
const MAX_LINES_PER_CHUNK = 100; // Nombre max de lignes par chunk
const MAX_CHARS_PER_CHUNK = 12000; // Nombre max de caractères par chunk

interface ExtractedItem {
  name: string;
  description: string | null;
  category: string;
  quantity: number | null;
  unit: string | null;
  specs: Record<string, any>;
}

interface CategorySuggestion {
  category: string;
  missingItems: Array<{
    name: string;
    reason: string;
  }>;
}

interface ExtractionResult {
  items: ExtractedItem[];
  categories: string[];
  suggestions: CategorySuggestion[];
  statistics: {
    totalItems: number;
    itemsWithQuantity: number;
    categoriesCount: number;
  };
}

interface ChunkResult {
  items: ExtractedItem[];
  categories: string[];
}

/**
 * Divise le contenu du fichier en chunks pour traitement
 */
function splitIntoChunks(fileContent: string): string[] {
  const lines = fileContent.split('\n');
  const headerLine = lines[0]; // Garder l'en-tête pour chaque chunk
  const dataLines = lines.slice(1).filter(line => line.trim());
  
  const chunks: string[] = [];
  let currentChunk: string[] = [headerLine];
  let currentChunkSize = headerLine.length;
  
  for (const line of dataLines) {
    // Vérifier si on dépasse les limites
    const wouldExceedLines = currentChunk.length >= MAX_LINES_PER_CHUNK;
    const wouldExceedChars = currentChunkSize + line.length > MAX_CHARS_PER_CHUNK;
    
    if (wouldExceedLines || wouldExceedChars) {
      // Sauvegarder le chunk actuel et en commencer un nouveau
      if (currentChunk.length > 1) { // Plus que juste l'en-tête
        chunks.push(currentChunk.join('\n'));
      }
      currentChunk = [headerLine, line];
      currentChunkSize = headerLine.length + line.length;
    } else {
      currentChunk.push(line);
      currentChunkSize += line.length;
    }
  }
  
  // Ajouter le dernier chunk
  if (currentChunk.length > 1) {
    chunks.push(currentChunk.join('\n'));
  }
  
  return chunks;
}

/**
 * Fusionne les résultats de plusieurs chunks
 */
function mergeChunkResults(results: ChunkResult[]): { items: ExtractedItem[]; categories: string[] } {
  const allItems: ExtractedItem[] = [];
  const allCategories = new Set<string>();
  
  for (const result of results) {
    allItems.push(...result.items);
    result.categories.forEach(cat => allCategories.add(cat));
  }
  
  // Dédupliquer les items par nom (garder le premier)
  const uniqueItems = allItems.reduce((acc, item) => {
    const exists = acc.find(i => i.name.toLowerCase() === item.name.toLowerCase());
    if (!exists) {
      acc.push(item);
    }
    return acc;
  }, [] as ExtractedItem[]);
  
  return {
    items: uniqueItems,
    categories: Array.from(allCategories).sort(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const { 
      projectId, 
      fileContent, 
      fileName, 
      sectorName, 
      customSectorName 
    } = await request.json();

    if (!projectId || !fileContent) {
      return NextResponse.json(
        { error: 'Project ID and file content are required' },
        { status: 400 }
      );
    }

    // Determine sector context
    const sector = customSectorName || sectorName || 'général';

    // Diviser le fichier en chunks si nécessaire
    const chunks = splitIntoChunks(fileContent);
    const totalChunks = chunks.length;
    
    console.log('🚀 Starting intelligent extraction...', {
      projectId,
      fileName,
      sector,
      contentLength: fileContent.length,
      totalChunks,
      linesCount: fileContent.split('\n').length
    });

    const modelUsed = useGemini ? 'gemini-3-pro' : 'gpt-4o';
    const chunkResults: ChunkResult[] = [];

    // Traiter chaque chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkNumber = i + 1;
      
      console.log(`📦 Processing chunk ${chunkNumber}/${totalChunks}...`, {
        chunkSize: chunk.length,
        linesInChunk: chunk.split('\n').length
      });

      // Build the extraction prompt for this chunk
      const isFirstChunk = i === 0;
      const extractionPrompt = buildChunkExtractionPrompt(chunk, fileName, sector, chunkNumber, totalChunks, isFirstChunk);
      
      let responseText: string;

      try {
        if (useGemini) {
          // Use Gemini 3 Pro via Replicate
          const geminiInput = {
            prompt: extractionPrompt,
            system_instruction: `Tu es un expert en analyse de fichiers et extraction de données pour le secteur "${sector}". 
Tu dois extraire TOUS les éléments (matériaux, équipements, accessoires, articles) de ce chunk de fichier.
Tu crées des catégories intelligentes adaptées au secteur.
Tu réponds UNIQUEMENT en JSON valide, sans markdown ni explication.`,
            thinking_level: "high" as const,
            temperature: 0.3,
            max_output_tokens: 16000,
          };

          const output = await replicate.run("google/gemini-3-pro", { input: geminiInput });
          responseText = Array.isArray(output) ? output.join("") : String(output);
          
        } else {
          // Fallback to OpenAI GPT-4o
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `Tu es un expert en analyse de fichiers et extraction de données pour le secteur "${sector}". 
Tu dois extraire TOUS les éléments de ce chunk de fichier.
Tu crées des catégories intelligentes adaptées au secteur.
Tu réponds UNIQUEMENT en JSON valide.`
              },
              {
                role: 'user',
                content: extractionPrompt
              }
            ],
            temperature: 0.3,
            max_tokens: 8000,
            response_format: { type: "json_object" }
          });

          responseText = completion.choices[0]?.message?.content?.trim() || '{}';
        }

        // Parse the chunk response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const chunkResult = JSON.parse(jsonMatch[0]);
          chunkResults.push({
            items: chunkResult.items || [],
            categories: chunkResult.categories || [],
          });
          
          console.log(`✅ Chunk ${chunkNumber}/${totalChunks} completed:`, {
            itemsFound: chunkResult.items?.length || 0,
            categoriesFound: chunkResult.categories?.length || 0
          });
        }
      } catch (chunkError) {
        console.error(`❌ Error processing chunk ${chunkNumber}:`, chunkError);
        // Continue with other chunks even if one fails
      }
    }

    // Fusionner tous les résultats
    const mergedResults = mergeChunkResults(chunkResults);
    const items = mergedResults.items;
    const categories = mergedResults.categories;

    console.log('📊 All chunks processed, merged results:', {
      totalItems: items.length,
      totalCategories: categories.length,
      chunksProcessed: chunkResults.length,
      totalChunks
    });

    // Générer les suggestions d'oublis (seulement une fois, après fusion)
    let suggestions: CategorySuggestion[] = [];
    if (items.length > 0) {
      suggestions = await generateSuggestions(sector, categories, items, modelUsed);
    }

    console.log('✅ Extraction completed:', {
      itemsCount: items.length,
      categoriesCount: categories.length,
      suggestionsCount: suggestions.length
    });

    // Save items to database
    if (items.length > 0) {
      const materialsToInsert = items.map(item => ({
        project_id: projectId,
        name: item.name,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        specs: {
          ...item.specs,
          unit: item.unit,
          extracted_by: modelUsed,
          sector: sector,
        },
      }));

      const { error: insertError } = await supabase
        .from('materials')
        .insert(materialsToInsert);

      if (insertError) {
        console.error('❌ Error inserting materials:', insertError);
        // Continue anyway to return the extraction result
      } else {
        console.log(`✅ Inserted ${items.length} materials into database`);
      }
    }

    // Update project status
    await supabase
      .from('projects')
      .update({ mapping_status: 'completed' })
      .eq('id', projectId);

    return NextResponse.json({
      success: true,
      model: modelUsed,
      sector,
      items,
      categories,
      suggestions,
      statistics: {
        totalItems: items.length,
        itemsWithQuantity: items.filter(i => i.quantity !== null).length,
        categoriesCount: categories.length,
        suggestionsCount: suggestions.reduce((acc, s) => acc + s.missingItems.length, 0),
        chunksProcessed: chunkResults.length,
        totalChunks,
      },
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function buildExtractionPrompt(fileContent: string, fileName: string, sector: string): string {
  return `Tu es un expert en extraction de données pour le secteur "${sector}".

**FICHIER À ANALYSER**: ${fileName}

**CONTENU DU FICHIER**:
\`\`\`
${fileContent.substring(0, 15000)}
\`\`\`

**TA MISSION**:

1. **EXTRAIRE TOUS LES ÉLÉMENTS** (matériaux, équipements, accessoires, articles, achats)
   - Chaque ligne avec un nom d'article = un élément à extraire
   - Même si la quantité est manquante, extraire l'élément
   - Séparer le nom court de la description détaillée

2. **CRÉER DES CATÉGORIES INTELLIGENTES** adaptées au secteur "${sector}"
   - Catégories claires et logiques
   - Regrouper les éléments similaires
   - Maximum 10-15 catégories

3. **SUGGÉRER DES OUBLIS POTENTIELS** par catégorie
   - Basé sur ton expertise du secteur "${sector}"
   - Éléments souvent oubliés dans ce type de projet
   - Phrase explicative courte pour chaque suggestion

**FORMAT DE RÉPONSE JSON**:
{
  "items": [
    {
      "name": "Nom court de l'élément",
      "description": "Description détaillée, spécifications, dimensions, modèle...",
      "category": "Catégorie assignée",
      "quantity": 10 ou null si non spécifié,
      "unit": "Unité (pièce, m², kg, lot, etc.)" ou null,
      "specs": {
        "reference": "REF-123",
        "marque": "Marque si mentionnée",
        "autres_infos": "..."
      }
    }
  ],
  "categories": [
    "Catégorie 1",
    "Catégorie 2",
    "..."
  ],
  "suggestions": [
    {
      "category": "Catégorie concernée",
      "missingItems": [
        {
          "name": "Élément potentiellement oublié",
          "reason": "Phrase courte expliquant pourquoi c'est souvent nécessaire"
        }
      ]
    }
  ],
  "statistics": {
    "totalItems": 25,
    "itemsWithQuantity": 20,
    "categoriesCount": 5
  }
}

**EXEMPLES DE CATÉGORIES PAR SECTEUR**:

Pour "Hôtellerie": Literie, Salle de bain, Éclairage, Mobilier chambre, Équipement cuisine, Décoration, Linge de maison, Électroménager, Signalétique

Pour "Restaurant": Cuisine professionnelle, Vaisselle, Mobilier salle, Bar, Réfrigération, Cuisson, Préparation, Hygiène, Décoration

Pour "Construction": Gros œuvre, Second œuvre, Électricité, Plomberie, Menuiserie, Peinture, Revêtements, Quincaillerie

Pour "Commerce": Mobilier commercial, Éclairage, Signalétique, Caisse, Stockage, Décoration, Sécurité

**EXEMPLES DE SUGGESTIONS D'OUBLIS**:

Pour un hôtel:
- "Peignoirs" → "Souvent oublié mais essentiel pour le confort client"
- "Porte-bagages" → "Accessoire pratique attendu dans les chambres"
- "Coffre-fort" → "Sécurité des effets personnels des clients"

Pour un restaurant:
- "Extincteur" → "Obligatoire pour la sécurité incendie"
- "Thermomètre alimentaire" → "Nécessaire pour le contrôle HACCP"
- "Bac à graisse" → "Requis par la réglementation"

RÉPONDS UNIQUEMENT EN JSON VALIDE.`;
}

/**
 * Prompt optimisé pour l'extraction par chunk
 */
function buildChunkExtractionPrompt(
  chunkContent: string, 
  fileName: string, 
  sector: string, 
  chunkNumber: number, 
  totalChunks: number,
  isFirstChunk: boolean
): string {
  const chunkInfo = totalChunks > 1 
    ? `\n\n**NOTE**: Ceci est le chunk ${chunkNumber}/${totalChunks} du fichier. Extrais TOUS les éléments de ce chunk.`
    : '';

  return `Tu es un expert en extraction de données pour le secteur "${sector}".

**FICHIER**: ${fileName}${chunkInfo}

**CONTENU À ANALYSER**:
\`\`\`
${chunkContent}
\`\`\`

**TA MISSION**:
Extraire TOUS les éléments (matériaux, équipements, accessoires, articles) de ce ${totalChunks > 1 ? 'chunk' : 'fichier'}.

**RÈGLES**:
- Chaque ligne avec un nom = un élément à extraire
- Même si la quantité est manquante, extraire l'élément
- Séparer le nom court de la description détaillée
- Créer des catégories intelligentes adaptées au secteur "${sector}"

**FORMAT JSON**:
{
  "items": [
    {
      "name": "Nom court",
      "description": "Description détaillée ou null",
      "category": "Catégorie",
      "quantity": 10 ou null,
      "unit": "Unité ou null",
      "specs": {}
    }
  ],
  "categories": ["Catégorie 1", "Catégorie 2"]
}

RÉPONDS UNIQUEMENT EN JSON VALIDE.`;
}

/**
 * Génère les suggestions d'oublis après l'extraction complète
 */
async function generateSuggestions(
  sector: string,
  categories: string[],
  items: ExtractedItem[],
  modelUsed: string
): Promise<CategorySuggestion[]> {
  try {
    const itemNames = items.map(i => i.name).join(', ');
    
    const prompt = `Tu es un expert du secteur "${sector}".

**CATÉGORIES EXISTANTES**: ${categories.join(', ')}

**ÉLÉMENTS DÉJÀ LISTÉS** (résumé): ${itemNames.substring(0, 2000)}

**TA MISSION**:
Suggère des éléments souvent oubliés dans ce type de projet, par catégorie.
Base-toi sur ton expertise du secteur "${sector}".

**FORMAT JSON**:
{
  "suggestions": [
    {
      "category": "Catégorie existante ou nouvelle",
      "missingItems": [
        {
          "name": "Élément oublié",
          "reason": "Phrase courte expliquant pourquoi c'est important"
        }
      ]
    }
  ]
}

**RÈGLES**:
- Maximum 3-5 suggestions par catégorie
- Ne suggère PAS d'éléments déjà présents dans la liste
- Phrases explicatives courtes et percutantes
- Focus sur les oublis fréquents et importants

RÉPONDS UNIQUEMENT EN JSON VALIDE.`;

    let responseText: string;

    if (modelUsed === 'gemini-3-pro') {
      const geminiInput = {
        prompt,
        system_instruction: `Tu es un expert du secteur "${sector}". Tu suggères des oublis potentiels basés sur ton expertise. Réponds UNIQUEMENT en JSON valide.`,
        thinking_level: "low" as const,
        temperature: 0.5,
        max_output_tokens: 4000,
      };

      const output = await replicate.run("google/gemini-3-pro", { input: geminiInput });
      responseText = Array.isArray(output) ? output.join("") : String(output);
    } else {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert du secteur "${sector}". Tu suggères des oublis potentiels. Réponds UNIQUEMENT en JSON valide.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result.suggestions || [];
    }

    return [];
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [];
  }
}
