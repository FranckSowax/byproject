import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Replicate from 'replicate';


const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

const getReplicateClient = () => {
  const auth = process.env.REPLICATE_API_TOKEN;
  if (!auth) return null;
  return new Replicate({ auth });
};

const BTP_CATEGORIES = [
  'Gros œuvre',
  'Électricité',
  'Plomberie',
  'Menuiserie',
  'Peinture et Décoration',
  'Carrelage et Revêtements',
  'Quincaillerie',
  'Sanitaire',
  'Éclairage',
  'Serrurerie',
  'Plâtrerie et Isolation',
  'Chauffage et Climatisation',
  'Outillage',
  'Sécurité et Protection',
  'Toiture et Couverture',
  'Jardin et Extérieurs',
  'Divers'
];

// Fonction simple de catégorisation par mots-clés
function preCategorizeByKeywords(itemName: string): string | null {
  const name = itemName.toLowerCase();
  
  if (name.includes('ciment') || name.includes('béton') || name.includes('brique') || name.includes('parpaing') || name.includes('sable') || name.includes('fer à béton')) return 'Gros œuvre';
  if (name.includes('câble') || name.includes('fil') || name.includes('disjoncteur') || name.includes('interrupteur') || name.includes('prise') || name.includes('tableau électrique')) return 'Électricité';
  if (name.includes('tuyau') || name.includes('raccord') || name.includes('vanne') || name.includes('robinet') || name.includes('siphon')) return 'Plomberie';
  if (name.includes('porte') || name.includes('fenêtre') || name.includes('bois') || name.includes('planche') || name.includes('tasseau')) return 'Menuiserie';
  if (name.includes('peinture') || name.includes('vernis') || name.includes('enduit') || name.includes('pinceau') || name.includes('rouleau')) return 'Peinture et Décoration';
  if (name.includes('carrelage') || name.includes('faience') || name.includes('sol') || name.includes('colle carrelage')) return 'Carrelage et Revêtements';
  if (name.includes('vis') || name.includes('clou') || name.includes('boulon') || name.includes('cheville') || name.includes('écrou')) return 'Quincaillerie';
  if (name.includes('wc') || name.includes('lavabo') || name.includes('douche') || name.includes('baignoire') || name.includes('évier')) return 'Sanitaire';
  if (name.includes('lampe') || name.includes('spot') || name.includes('ampoule') || name.includes('led') || name.includes('projecteur')) return 'Éclairage';
  if (name.includes('serrure') || name.includes('poignée') || name.includes('cylindre') || name.includes('verrou')) return 'Serrurerie';
  if (name.includes('placo') || name.includes('plâtre') || name.includes('ba13') || name.includes('rail') || name.includes('montant') || name.includes('isolation') || name.includes('laine')) return 'Plâtrerie et Isolation';
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { materials, projectType } = await request.json();

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json(
        { error: 'Liste de matériaux requise' },
        { status: 400 }
      );
    }

    console.log(`🏷️ Categorizing ${materials.length} materials...`);

    // Étape 1: Pré-catégorisation par mots-clés (rapide)
    const categoryMap: Record<number, string> = {};
    const uncategorizedIndices: number[] = [];
    
    materials.forEach((m: any, index: number) => {
      const preCategory = preCategorizeByKeywords(m.name);
      if (preCategory) {
        categoryMap[index] = preCategory;
      } else {
        uncategorizedIndices.push(index);
      }
    });

    console.log(`📊 Pre-categorized ${Object.keys(categoryMap).length} by keywords, ${uncategorizedIndices.length} need AI`);

    let modelUsed = 'keywords';

    // Étape 2: Catégorisation IA pour les éléments non catégorisés
    if (uncategorizedIndices.length > 0) {
      const uncategorizedMaterials = uncategorizedIndices.map((idx, i) => 
        `${i + 1}. [IDX:${idx}] ${materials[idx].name}${materials[idx].description ? ` - ${materials[idx].description}` : ''}`
      ).join('\n');

      const prompt = `Tu es un EXPERT en matériaux de construction BTP avec 30 ans d'expérience.

MISSION CRITIQUE: Catégorise CHAQUE matériau ci-dessous dans la catégorie la plus appropriée.

CATÉGORIES DISPONIBLES (utilise EXACTEMENT ces noms):
${BTP_CATEGORIES.map(c => `• ${c}`).join('\n')}

GUIDE DE CATÉGORISATION:
- Gros œuvre: ciment, béton, parpaings, ferraille, fondations
- Électricité: tout ce qui est câbles, fils, prises, interrupteurs, tableaux
- Plomberie: tuyaux, raccords, vannes, évacuations
- Menuiserie: bois, portes, fenêtres, parquet
- Peinture & Finitions: peintures, enduits, vernis
- Carrelage & Revêtements: carreaux, faïence, sols
- Quincaillerie: vis, clous, boulons, fixations
- Sanitaire: WC, lavabos, douches, baignoires
- Éclairage: lampes, spots, LED, luminaires
- Serrurerie: serrures, poignées, métal, acier
- Plâtrerie: placo, BA13, enduits plâtre

TYPE DE PROJET: ${projectType || 'Construction générale'}

MATÉRIAUX À CATÉGORISER:
${uncategorizedMaterials}

RÈGLES STRICTES:
1. CHAQUE matériau DOIT avoir une catégorie
2. Utilise "Divers" UNIQUEMENT si vraiment inclassable
3. Le champ originalIndex correspond au numéro entre [IDX:X]

RÉPONDS EN JSON VALIDE:
{
  "categorizations": [
    { "originalIndex": 0, "category": "Catégorie" },
    { "originalIndex": 5, "category": "Catégorie" }
  ]
}`;

      let responseText = '';
      const replicate = getReplicateClient();
      const useGemini = !!replicate;

      if (useGemini && replicate) {
        try {
          console.log('🧠 AI Categorizing with Gemini 3 Pro...');
          const output = await replicate.run("google/gemini-3-pro", {
            input: {
              prompt: prompt,
              system_instruction: "Tu es un expert BTP. Tu catégorises les matériaux de construction. Tu réponds UNIQUEMENT en JSON valide.",
              temperature: 0.2,
              max_output_tokens: 4000,
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
      const openai = getOpenAIClient();
      if (!responseText && openai) {
        console.log('🔄 AI Categorizing with OpenAI...');
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

      try {
        const result = JSON.parse(cleanJson);

        // Ajouter les catégories IA au mapping
        if (result.categorizations && Array.isArray(result.categorizations)) {
          for (const cat of result.categorizations) {
            const idx = cat.originalIndex ?? (cat.index ? cat.index - 1 : null);
            if (idx !== null && idx !== undefined) {
              // Valider que la catégorie existe dans notre liste
              const validCategory = BTP_CATEGORIES.includes(cat.category) 
                ? cat.category 
                : 'Divers';
              categoryMap[idx] = validCategory;
            }
          }
        }
        console.log(`🤖 AI categorized ${result.categorizations?.length || 0} additional items`);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // En cas d'erreur, mettre les non-catégorisés en "Divers"
        uncategorizedIndices.forEach(idx => {
          if (!categoryMap[idx]) {
            categoryMap[idx] = 'Divers';
          }
        });
      }
    }

    // S'assurer que tous les matériaux ont une catégorie
    materials.forEach((_: any, index: number) => {
      if (!categoryMap[index]) {
        categoryMap[index] = 'Divers';
      }
    });

    console.log(`✅ Total categorized: ${Object.keys(categoryMap).length} materials with ${modelUsed}`);

    return NextResponse.json({
      success: true,
      categoryMap,
      categories: BTP_CATEGORIES,
      model: modelUsed,
      stats: {
        total: materials.length,
        byKeywords: materials.length - uncategorizedIndices.length,
        byAI: uncategorizedIndices.length
      }
    });

  } catch (error) {
    console.error('Categorization error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la catégorisation' },
      { status: 500 }
    );
  }
}
