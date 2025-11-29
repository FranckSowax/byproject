import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Replicate from 'replicate';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Check if Gemini 3 Pro is available
const useGemini = !!process.env.REPLICATE_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { headers, sampleData, targetFields, sectorName, customSectorName } = await request.json();

    if (!headers || !sampleData || !targetFields) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine sector context for AI
    const sector = customSectorName || sectorName || 'construction et équipements';

    // Appel à l'IA pour mapper les colonnes
    const prompt = `Tu es un expert en analyse de fichiers pour le secteur "${sector}".

**MISSION**: Mappe les colonnes du fichier aux champs cibles en analysant les en-têtes ET les données.

**COLONNES DISPONIBLES** (index: nom):
${headers.map((h: string, i: number) => `${i}: "${h}"`).join('\n')}

**ÉCHANTILLON DE DONNÉES**:
\`\`\`
${sampleData}
\`\`\`

**CHAMPS CIBLES À MAPPER**:
${targetFields.join(', ')}

**RÈGLES DE MAPPING**:
1. **name** (OBLIGATOIRE): Colonne contenant le nom du matériau/équipement
   - Cherche: "Matériau", "Désignation", "Nom", "Article", "Description", "Produit"
   - Exemple: "Ciment CPI 35", "Fer à béton Ø8", "Ampoule LED"

2. **quantity**: Colonne contenant la quantité
   - Cherche: "Quantité", "Qty", "Qté", "Nombre", "Qt"
   - Exemple: 100, 200, 15

3. **unit**: Colonne contenant l'unité de mesure
   - Cherche: "Unité", "Unit", "U", "Mesure"
   - Exemple: "Sac (50kg)", "Barre (12m)", "Pièce", "m²", "m³"

4. **category**: Colonne contenant la catégorie (optionnel)
   - Cherche: "Catégorie", "Type", "Famille"

5. **weight**: Colonne contenant le poids (optionnel)
   - Cherche: "Poids", "Weight", "Kg"

6. **volume**: Colonne contenant le volume (optionnel)
   - Cherche: "Volume", "m3", "m³"

7. **specs**: Autres colonnes utiles (prix, fournisseur, etc.)
   - Peut être un array d'index si plusieurs colonnes

**IMPORTANT**:
- Analyse les DONNÉES pour confirmer le mapping (pas seulement les en-têtes)
- Si une colonne contient des noms de matériaux → c'est "name"
- Si une colonne contient des nombres → vérifier si c'est "quantity"
- Si aucune correspondance → retourne null

**FORMAT DE RÉPONSE** (JSON strict):
{
  "name": index_de_la_colonne_ou_null,
  "category": index_ou_null,
  "quantity": index_ou_null,
  "unit": index_ou_null,
  "weight": index_ou_null,
  "volume": index_ou_null,
  "specs": index_ou_null
}

**EXEMPLE**:
Si colonne 0 = "Matériau" avec données "Ciment", "Fer"
Et colonne 2 = "Quantité" avec données "100", "200"
Alors: {"name": 0, "quantity": 2, "unit": null, ...}

RÉPONDS UNIQUEMENT EN JSON VALIDE.`;

    let responseText: string;
    let modelUsed: string;

    if (useGemini) {
      // Use Gemini 3 Pro via Replicate
      console.log('🔍 Mapping columns with Gemini 3 Pro...', {
        headersCount: headers.length,
        targetFields,
        sector,
        sampleDataLength: sampleData.length
      });

      const geminiInput = {
        prompt,
        system_instruction: `Tu es un expert en analyse de fichiers pour le secteur "${sector}". Tu DOIS identifier correctement les colonnes en analysant les en-têtes ET les données. Tu réponds UNIQUEMENT en JSON valide, sans markdown ni explication.`,
        thinking_level: "high" as const,
        temperature: 0.2,
        max_output_tokens: 2000,
      };

      const output = await replicate.run("google/gemini-3-pro", { input: geminiInput });
      responseText = Array.isArray(output) ? output.join("") : String(output);
      modelUsed = 'gemini-3-pro';
      
    } else {
      // Fallback to OpenAI GPT-4o
      console.log('🔍 Mapping columns with GPT-4o (fallback)...', {
        headersCount: headers.length,
        targetFields,
        sector,
        sampleDataLength: sampleData.length
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en analyse de fichiers pour le secteur "${sector}". Tu DOIS identifier correctement les colonnes en analysant les en-têtes ET les données. Tu réponds UNIQUEMENT en JSON valide.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      responseText = completion.choices[0]?.message?.content?.trim() || '{}';
      modelUsed = 'gpt-4o';
    }
    
    console.log('📄 Raw AI Response:', responseText.substring(0, 500));
    
    // Extraire le JSON de la réponse (au cas où il y aurait du texte autour)
    let mapping;
    try {
      // Essayer de parser directement
      mapping = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response directly:', parseError);
      // Si ça échoue, chercher un objet JSON dans la réponse
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mapping = JSON.parse(jsonMatch[0]);
        console.log('✅ Extracted JSON from response');
      } else {
        console.error('❌ No valid JSON found in response');
        throw new Error('Invalid JSON response from AI');
      }
    }

    console.log('✅ AI Mapping Result:', mapping);
    console.log('📊 Mapping Summary:', {
      name: mapping.name !== null ? `Column ${mapping.name}` : 'Not found',
      quantity: mapping.quantity !== null ? `Column ${mapping.quantity}` : 'Not found',
      unit: mapping.unit !== null ? `Column ${mapping.unit}` : 'Not found',
      category: mapping.category !== null ? `Column ${mapping.category}` : 'Not found'
    });

    return NextResponse.json({ 
      mapping,
      confidence: 'high',
      message: 'Colonnes mappées avec succès par l\'IA',
      details: {
        model: modelUsed,
        sector,
        mappedFields: Object.keys(mapping).filter(k => mapping[k] !== null).length,
        totalFields: Object.keys(mapping).length
      }
    });

  } catch (error) {
    console.error('Error in map-columns API:', error);
    return NextResponse.json(
      { error: 'Failed to map columns', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
