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

// Catégories BTP détaillées avec mots-clés pour aide à la classification
const BTP_CATEGORIES_WITH_KEYWORDS: Record<string, string[]> = {
  'Gros œuvre': ['ciment', 'béton', 'parpaing', 'brique', 'ferraille', 'fer à béton', 'armature', 'coffrage', 'agglo', 'hourdis', 'poutrelle', 'chaînage', 'fondation', 'sable', 'gravier', 'granulat', 'mortier'],
  'Second œuvre': ['cloison', 'doublage', 'faux plafond', 'rail', 'montant', 'ossature'],
  'Électricité': ['câble', 'fil électrique', 'gaine', 'icta', 'tableau', 'disjoncteur', 'interrupteur', 'prise', 'douille', 'domino', 'wago', 'boîte', 'encastrement', 'moulure', 'chemin de câble', 'électrique', 'ampère', 'volt', 'fusible', 'différentiel'],
  'Plomberie': ['tuyau', 'pvc', 'cuivre', 'per', 'multicouche', 'raccord', 'coude', 'té', 'manchon', 'vanne', 'robinet', 'siphon', 'évacuation', 'alimentation', 'plomberie', 'collecteur'],
  'Menuiserie': ['bois', 'porte', 'fenêtre', 'châssis', 'huisserie', 'plinthe', 'moulure bois', 'lambris', 'parquet', 'contreplaqué', 'mdf', 'osb', 'tasseaux', 'chevron', 'madrier', 'menuiserie', 'chêne', 'sapin', 'hêtre'],
  'Peinture & Finitions': ['peinture', 'enduit', 'sous-couche', 'primaire', 'vernis', 'lasure', 'mastic', 'joint', 'silicone', 'acrylique', 'glycéro', 'rouleau', 'pinceau', 'white spirit'],
  'Carrelage & Revêtements': ['carrelage', 'faïence', 'mosaïque', 'colle carrelage', 'joint carrelage', 'croisillon', 'profilé', 'nez de marche', 'sol', 'revêtement', 'lino', 'vinyle', 'moquette', 'grès', 'cérame'],
  'Isolation': ['isolant', 'laine', 'polystyrène', 'polyuréthane', 'mousse', 'pare-vapeur', 'thermique', 'acoustique', 'rockwool', 'isover', 'styrodur'],
  'Toiture & Étanchéité': ['tuile', 'ardoise', 'gouttière', 'chéneau', 'descente', 'zinc', 'bac acier', 'étanchéité', 'bitume', 'membrane', 'faîtière', 'closoir', 'couverture'],
  'Quincaillerie': ['vis', 'clou', 'boulon', 'écrou', 'rondelle', 'cheville', 'équerre', 'platine', 'fixation', 'ancrage', 'tige filetée', 'goujon', 'piton', 'crochet'],
  'Outillage': ['outil', 'perceuse', 'visseuse', 'meuleuse', 'scie', 'marteau', 'tournevis', 'pince', 'niveau', 'mètre', 'truelle', 'taloche', 'spatule', 'cutter'],
  'Sécurité & EPI': ['casque', 'gant', 'lunette', 'chaussure', 'gilet', 'harnais', 'protection', 'sécurité', 'epi', 'masque', 'bouchon oreille'],
  'Plâtrerie': ['plâtre', 'placo', 'ba13', 'ba10', 'placoplatre', 'enduit plâtre', 'bande', 'calicot', 'staff', 'map'],
  'Serrurerie': ['serrure', 'verrou', 'poignée', 'cylindre', 'gâche', 'paumelle', 'charnière', 'ferme-porte', 'crémone', 'métal', 'acier', 'aluminium', 'inox', 'cornière', 'tube acier', 'profilé alu'],
  'Climatisation & Ventilation': ['climatisation', 'clim', 'split', 'vmc', 'ventilation', 'gaine ventilation', 'bouche', 'extracteur', 'aération', 'grille'],
  'Sanitaire': ['wc', 'toilette', 'lavabo', 'vasque', 'baignoire', 'douche', 'receveur', 'mitigeur', 'bonde', 'abattant', 'réservoir', 'chasse', 'sanitaire', 'salle de bain', 'bidet'],
  'Éclairage': ['lampe', 'ampoule', 'led', 'spot', 'plafonnier', 'applique', 'lustre', 'réglette', 'tube', 'néon', 'projecteur', 'éclairage', 'luminaire', 'downlight'],
  'Aménagement extérieur': ['terrasse', 'clôture', 'portail', 'grillage', 'pavé', 'dalle extérieure', 'bordure', 'jardin', 'extérieur', 'pergola'],
  'Divers': []
};

const BTP_CATEGORIES = Object.keys(BTP_CATEGORIES_WITH_KEYWORDS);

// Fonction de pré-catégorisation par mots-clés (fallback rapide)
function preCategorizeByKeywords(materialName: string): string | null {
  const nameLower = materialName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(BTP_CATEGORIES_WITH_KEYWORDS)) {
    if (category === 'Divers') continue;
    for (const keyword of keywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
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

      if (useGemini) {
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
      if (!responseText) {
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
