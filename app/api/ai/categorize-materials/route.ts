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

// Catégories BTP standard
const BTP_CATEGORIES = [
  'Gros œuvre',
  'Second œuvre',
  'Électricité',
  'Plomberie',
  'Menuiserie',
  'Peinture & Finitions',
  'Carrelage & Revêtements',
  'Isolation',
  'Toiture & Étanchéité',
  'Quincaillerie',
  'Outillage',
  'Sécurité & EPI',
  'Plâtrerie',
  'Serrurerie',
  'Climatisation & Ventilation',
  'Sanitaire',
  'Éclairage',
  'Aménagement extérieur',
  'Divers'
];

export async function POST(request: NextRequest) {
  try {
    const { materials, projectType } = await request.json();

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json(
        { error: 'Liste de matériaux requise' },
        { status: 400 }
      );
    }

    // Préparer la liste des matériaux pour l'IA
    const materialsList = materials.map((m: any, i: number) => 
      `${i + 1}. ${m.name}${m.description ? ` - ${m.description}` : ''}`
    ).join('\n');

    const prompt = `Tu es un expert en matériaux de construction BTP.

MISSION: Catégorise chaque matériau dans la catégorie la plus appropriée.

CATÉGORIES DISPONIBLES:
${BTP_CATEGORIES.map(c => `- ${c}`).join('\n')}

TYPE DE PROJET: ${projectType || 'Construction générale'}

MATÉRIAUX À CATÉGORISER:
${materialsList}

RÈGLES:
1. Chaque matériau DOIT avoir exactement une catégorie de la liste ci-dessus
2. Utilise "Divers" uniquement si aucune autre catégorie ne convient
3. Sois cohérent: tous les câbles électriques → Électricité, tous les tuyaux → Plomberie, etc.
4. Pour les matériaux ambigus, choisis la catégorie la plus probable selon le contexte BTP

RÉPONDS UNIQUEMENT EN JSON VALIDE avec ce format exact:
{
  "categorizations": [
    { "index": 1, "category": "Catégorie choisie" },
    { "index": 2, "category": "Catégorie choisie" }
  ]
}`;

    let responseText = '';
    let modelUsed = '';

    if (useGemini) {
      try {
        console.log('🧠 Categorizing with Gemini 3 Pro...');
        const output = await replicate.run("google/gemini-3-pro", {
          input: {
            prompt: prompt,
            system_instruction: "Tu es un expert BTP. Tu catégorises les matériaux de construction. Tu réponds UNIQUEMENT en JSON valide.",
            temperature: 0.2,
            max_output_tokens: 4000,
            thinking_level: "low"
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
      console.log('🔄 Categorizing with OpenAI...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un expert BTP. Tu catégorises les matériaux de construction. Tu réponds UNIQUEMENT en JSON valide.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
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

    // Construire le mapping index -> catégorie
    const categoryMap: Record<number, string> = {};
    if (result.categorizations && Array.isArray(result.categorizations)) {
      for (const cat of result.categorizations) {
        // Valider que la catégorie existe dans notre liste
        const validCategory = BTP_CATEGORIES.includes(cat.category) 
          ? cat.category 
          : 'Divers';
        categoryMap[cat.index - 1] = validCategory; // index 1-based -> 0-based
      }
    }

    console.log(`✅ Categorized ${Object.keys(categoryMap).length} materials with ${modelUsed}`);

    return NextResponse.json({
      success: true,
      categoryMap,
      categories: BTP_CATEGORIES,
      model: modelUsed
    });

  } catch (error) {
    console.error('Categorization error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la catégorisation' },
      { status: 500 }
    );
  }
}
