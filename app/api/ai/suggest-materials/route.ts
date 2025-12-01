import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Replicate from 'replicate';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const useGemini = !!process.env.REPLICATE_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { materials, projectType, projectName } = await request.json();

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json(
        { error: 'Liste de matériaux requise' },
        { status: 400 }
      );
    }

    // Grouper les matériaux par catégorie pour le contexte
    const materialsByCategory: Record<string, string[]> = {};
    materials.forEach((m: any) => {
      const cat = m.category || 'Non catégorisé';
      if (!materialsByCategory[cat]) materialsByCategory[cat] = [];
      materialsByCategory[cat].push(m.name);
    });

    const materialsSummary = Object.entries(materialsByCategory)
      .map(([cat, items]) => `**${cat}**: ${items.slice(0, 10).join(', ')}${items.length > 10 ? ` (+${items.length - 10} autres)` : ''}`)
      .join('\n');

    const prompt = `Tu es un expert en matériaux de construction BTP avec 20 ans d'expérience.

CONTEXTE DU PROJET:
- Type: ${projectType || 'Construction générale'}
- Nom: ${projectName || 'Projet BTP'}
- Nombre de matériaux listés: ${materials.length}

MATÉRIAUX DÉJÀ LISTÉS PAR CATÉGORIE:
${materialsSummary}

MISSION: Analyse cette liste et identifie les matériaux ESSENTIELS qui pourraient manquer pour réaliser ce projet correctement.

RÈGLES STRICTES:
1. Ne suggère QUE des matériaux vraiment NÉCESSAIRES et COMPLÉMENTAIRES
2. Ne suggère PAS de matériaux déjà présents (même sous un nom différent)
3. Limite-toi à 5-8 suggestions MAXIMUM
4. Chaque suggestion doit avoir une RAISON LOGIQUE et CONCRÈTE
5. Priorise les matériaux de sécurité, fixation, finition souvent oubliés
6. Adapte les suggestions au TYPE de projet

EXEMPLES DE BONNES SUGGESTIONS:
- Si électricité présente mais pas de gaines → suggérer gaines ICTA
- Si carrelage présent mais pas de colle → suggérer colle carrelage
- Si peinture présente mais pas d'apprêt → suggérer sous-couche
- Si menuiserie présente mais pas de vis → suggérer visserie adaptée

RÉPONDS UNIQUEMENT EN JSON VALIDE avec ce format:
{
  "suggestions": [
    {
      "name": "Nom du matériau suggéré",
      "category": "Catégorie appropriée",
      "reason": "Explication courte et logique (1 phrase)",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;

    let responseText = '';
    let modelUsed = '';

    if (useGemini) {
      try {
        console.log('🧠 Generating suggestions with Gemini 3 Pro...');
        const output = await replicate.run("google/gemini-3-pro", {
          input: {
            prompt: prompt,
            system_instruction: "Tu es un expert BTP. Tu analyses les listes de matériaux et suggères les éléments manquants essentiels. Tu réponds UNIQUEMENT en JSON valide.",
            temperature: 0.7,
            max_output_tokens: 2000,
            thinking_level: "medium"
          }
        });
        responseText = Array.isArray(output) ? output.join("") : String(output);
        modelUsed = 'gemini-3-pro';
      } catch (geminiError) {
        console.error('Gemini error, falling back to OpenAI:', geminiError);
      }
    }

    // Fallback OpenAI
    if (!responseText) {
      console.log('🔄 Generating suggestions with OpenAI...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un expert BTP. Tu analyses les listes de matériaux et suggères les éléments manquants essentiels. Tu réponds UNIQUEMENT en JSON valide.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });
      responseText = completion.choices[0]?.message?.content?.trim() || '{}';
      modelUsed = 'gpt-4o-mini';
    }

    // Nettoyage JSON
    let cleanJson = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleanJson = jsonMatch[1];
    } else {
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        cleanJson = responseText.substring(startIdx, endIdx + 1);
      }
    }

    const result = JSON.parse(cleanJson);
    const suggestions = result.suggestions || [];

    // Filtrer les suggestions qui ressemblent trop aux matériaux existants
    const existingNames = materials.map((m: any) => m.name.toLowerCase());
    const filteredSuggestions = suggestions.filter((s: any) => {
      const suggestedName = s.name.toLowerCase();
      // Vérifier qu'aucun matériau existant ne contient le nom suggéré ou vice versa
      return !existingNames.some((existing: string) => 
        existing.includes(suggestedName) || suggestedName.includes(existing)
      );
    });

    console.log(`✅ Generated ${filteredSuggestions.length} suggestions with ${modelUsed}`);

    return NextResponse.json({
      success: true,
      suggestions: filteredSuggestions,
      model: modelUsed
    });

  } catch (error) {
    console.error('Suggestion generation error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des suggestions' },
      { status: 500 }
    );
  }
}
