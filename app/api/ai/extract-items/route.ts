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

    console.log('🚀 Starting intelligent extraction with Gemini 3 Pro...', {
      projectId,
      fileName,
      sector,
      contentLength: fileContent.length
    });

    // Build the extraction prompt
    const extractionPrompt = buildExtractionPrompt(fileContent, fileName, sector);
    
    let responseText: string;
    let modelUsed: string;

    if (useGemini) {
      // Use Gemini 3 Pro via Replicate
      console.log('🤖 Using Gemini 3 Pro for extraction...');
      
      const geminiInput = {
        prompt: extractionPrompt,
        system_instruction: `Tu es un expert en analyse de fichiers et extraction de données pour le secteur "${sector}". 
Tu dois extraire TOUS les éléments (matériaux, équipements, accessoires, articles) du fichier.
Tu crées des catégories intelligentes adaptées au secteur.
Tu suggères des oublis potentiels basés sur ton expertise du secteur.
Tu réponds UNIQUEMENT en JSON valide, sans markdown ni explication.`,
        thinking_level: "high" as const,
        temperature: 0.3,
        max_output_tokens: 16000,
      };

      const output = await replicate.run("google/gemini-3-pro", { input: geminiInput });
      responseText = Array.isArray(output) ? output.join("") : String(output);
      modelUsed = 'gemini-3-pro';
      
    } else {
      // Fallback to OpenAI GPT-4o
      console.log('🤖 Using GPT-4o for extraction (fallback)...');
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en analyse de fichiers et extraction de données pour le secteur "${sector}". 
Tu dois extraire TOUS les éléments du fichier.
Tu crées des catégories intelligentes adaptées au secteur.
Tu suggères des oublis potentiels basés sur ton expertise du secteur.
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
      modelUsed = 'gpt-4o';
    }

    console.log('📄 AI Response received, parsing...', {
      model: modelUsed,
      responseLength: responseText.length
    });

    // Parse the response
    let extractionResult: ExtractionResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractionResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: String(parseError) },
        { status: 500 }
      );
    }

    // Validate and normalize the result
    const items = extractionResult.items || [];
    const categories = extractionResult.categories || [];
    const suggestions = extractionResult.suggestions || [];

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
