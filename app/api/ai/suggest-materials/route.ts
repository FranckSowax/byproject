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

// Règles de complémentarité BTP (si X présent, suggérer Y)
const COMPLEMENTARY_RULES: Record<string, { requires: string[], suggestions: Array<{ name: string, reason: string, priority: 'high' | 'medium' | 'low' }> }> = {
  'carrelage': {
    requires: ['carrelage', 'faïence', 'grès', 'cérame'],
    suggestions: [
      { name: 'Colle carrelage C2', reason: 'Indispensable pour la pose du carrelage', priority: 'high' },
      { name: 'Joint carrelage', reason: 'Nécessaire pour finir les joints entre carreaux', priority: 'high' },
      { name: 'Croisillons 2mm', reason: 'Pour un espacement régulier des carreaux', priority: 'medium' },
      { name: 'Profilé de finition alu', reason: 'Pour les angles et nez de marche', priority: 'low' }
    ]
  },
  'peinture': {
    requires: ['peinture', 'acrylique', 'glycéro'],
    suggestions: [
      { name: 'Sous-couche universelle', reason: 'Améliore l\'adhérence et le rendu final', priority: 'high' },
      { name: 'Bâche de protection', reason: 'Protège les sols pendant les travaux', priority: 'medium' },
      { name: 'Ruban de masquage', reason: 'Pour des lignes nettes aux jonctions', priority: 'medium' },
      { name: 'White spirit', reason: 'Nettoyage des outils peinture glycéro', priority: 'low' }
    ]
  },
  'placo': {
    requires: ['placo', 'ba13', 'placoplatre', 'plâtre'],
    suggestions: [
      { name: 'Bande à joint papier', reason: 'Pour le traitement des joints entre plaques', priority: 'high' },
      { name: 'Enduit à joint', reason: 'Indispensable pour lisser les joints', priority: 'high' },
      { name: 'Vis placo 25mm', reason: 'Fixation des plaques sur ossature', priority: 'high' },
      { name: 'Rails et montants', reason: 'Structure métallique pour cloisons', priority: 'medium' }
    ]
  },
  'electricite': {
    requires: ['câble', 'fil', 'électrique', 'disjoncteur', 'tableau'],
    suggestions: [
      { name: 'Gaines ICTA 20mm', reason: 'Protection obligatoire des câbles électriques', priority: 'high' },
      { name: 'Boîtes d\'encastrement', reason: 'Pour l\'installation des prises et interrupteurs', priority: 'high' },
      { name: 'Dominos/Wago', reason: 'Connexions sécurisées entre fils', priority: 'medium' },
      { name: 'Attaches câbles', reason: 'Fixation propre des câbles', priority: 'low' }
    ]
  },
  'plomberie': {
    requires: ['tuyau', 'pvc', 'cuivre', 'per', 'raccord'],
    suggestions: [
      { name: 'Téflon/Filasse', reason: 'Étanchéité des raccords filetés', priority: 'high' },
      { name: 'Colliers de fixation', reason: 'Maintien des canalisations', priority: 'medium' },
      { name: 'Colle PVC', reason: 'Assemblage des tuyaux PVC', priority: 'medium' }
    ]
  },
  'menuiserie': {
    requires: ['bois', 'porte', 'fenêtre', 'parquet', 'lambris'],
    suggestions: [
      { name: 'Vis à bois assortiment', reason: 'Fixation des éléments en bois', priority: 'high' },
      { name: 'Colle à bois', reason: 'Assemblages et collages bois', priority: 'medium' },
      { name: 'Papier de verre multi-grains', reason: 'Ponçage et finition du bois', priority: 'medium' }
    ]
  }
};

function getCategoryForSuggestion(ruleKey: string): string {
  switch (ruleKey) {
    case 'carrelage':
      return 'Carrelage et Faïence';
    case 'peinture':
      return 'Peinture et Décoration';
    case 'placo':
      return 'Plâtrerie et Isolation';
    case 'electricite':
      return 'Électricité';
    case 'plomberie':
      return 'Plomberie';
    case 'menuiserie':
      return 'Menuiserie';
    default:
      return 'Non catégorisé';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { materials, projectType, projectName } = await request.json();

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json(
        { error: 'Liste de matériaux requise' },
        { status: 400 }
      );
    }

    console.log(`💡 Generating suggestions for ${materials.length} materials...`);

    // Étape 1: Suggestions basées sur les règles de complémentarité
    const ruleSuggestions: Array<{ name: string; category: string; reason: string; priority: 'high' | 'medium' | 'low' }> = [];
    const existingNames = materials.map((m: any) => m.name.toLowerCase());

    for (const [ruleKey, rule] of Object.entries(COMPLEMENTARY_RULES)) {
      // Vérifier si un matériau de la règle est présent
      const hasRelatedMaterial = materials.some((m: any) => 
        rule.requires.some(keyword => m.name.toLowerCase().includes(keyword))
      );

      if (hasRelatedMaterial) {
        // Ajouter les suggestions qui ne sont pas déjà présentes
        for (const suggestion of rule.suggestions) {
          const alreadyExists = existingNames.some(name => 
            name.includes(suggestion.name.toLowerCase()) || 
            suggestion.name.toLowerCase().includes(name)
          );
          const alreadySuggested = ruleSuggestions.some(s => s.name === suggestion.name);
          
          if (!alreadyExists && !alreadySuggested) {
            ruleSuggestions.push({
              ...suggestion,
              category: getCategoryForSuggestion(ruleKey)
            });
          }
        }
      }
    }

    console.log(`📋 Rule-based suggestions: ${ruleSuggestions.length}`);

    // Étape 2: Suggestions IA complémentaires
    // Grouper les matériaux par catégorie pour le contexte
    const materialsByCategory: Record<string, string[]> = {};
    materials.forEach((m: any) => {
      const cat = m.category || 'Non catégorisé';
      if (!materialsByCategory[cat]) materialsByCategory[cat] = [];
      materialsByCategory[cat].push(m.name);
    });

    const materialsSummary = Object.entries(materialsByCategory)
      .map(([cat, items]) => `**${cat}** (${items.length}): ${items.slice(0, 8).join(', ')}${items.length > 8 ? ` (+${items.length - 8})` : ''}`)
      .join('\n');

    const alreadySuggestedNames = ruleSuggestions.map(s => s.name).join(', ');

    const prompt = `Tu es un MAÎTRE D'ŒUVRE BTP avec 30 ans d'expérience sur les chantiers.

CONTEXTE DU PROJET:
- Type: ${projectType || 'Construction/Rénovation'}
- Nom: ${projectName || 'Projet BTP'}
- Nombre de matériaux: ${materials.length}

MATÉRIAUX DÉJÀ LISTÉS:
${materialsSummary}

DÉJÀ SUGGÉRÉS (ne pas répéter): ${alreadySuggestedNames || 'aucun'}

MISSION: En tant qu'expert, identifie 10-15 matériaux ESSENTIELS qui manquent probablement pour mener ce chantier à bien.

ANALYSE PAR CORPS DE MÉTIER:
1. GROS ŒUVRE: Manque-t-il du ciment, sable, ferraille, coffrage?
2. ÉLECTRICITÉ: Gaines, boîtiers, câbles de section adaptée?
3. PLOMBERIE: Raccords, joints, évacuations?
4. FINITIONS: Enduits, joints, profilés de finition?
5. FIXATIONS: Vis, chevilles, boulons adaptés aux supports?
6. SÉCURITÉ: EPI, balisage, protections?
7. CONSOMMABLES: Disques, forets, lames?

CRITÈRES DE SUGGESTION:
- HIGH: Matériau INDISPENSABLE, le chantier ne peut pas avancer sans
- MEDIUM: Matériau RECOMMANDÉ pour un travail de qualité
- LOW: Matériau UTILE pour optimiser ou faciliter le travail

RÉPONDS EN JSON avec 10-15 suggestions:
{
  "suggestions": [
    {
      "name": "Nom précis du matériau",
      "category": "Catégorie BTP exacte",
      "reason": "Explication concrète en 1 phrase courte",
      "priority": "high|medium|low"
    }
  ],
  "analysis": "Résumé en 1 phrase de ce qui manque principalement"
}`;

    let responseText = '';
    let modelUsed = '';

    const replicate = getReplicateClient();
    const useGemini = !!replicate;

    if (useGemini && replicate) {
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
    const openai = getOpenAIClient();
    if (!responseText && openai) {
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

    let aiSuggestions: any[] = [];
    let analysis = '';
    
    try {
      const result = JSON.parse(cleanJson);
      aiSuggestions = result.suggestions || [];
      analysis = result.analysis || '';
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
    }

    // Filtrer les suggestions IA qui ressemblent trop aux matériaux existants
    const filteredAiSuggestions = aiSuggestions.filter((s: any) => {
      const suggestedName = s.name.toLowerCase();
      // Vérifier qu'aucun matériau existant ne contient le nom suggéré ou vice versa
      const existsInMaterials = existingNames.some((existing: string) => 
        existing.includes(suggestedName) || suggestedName.includes(existing)
      );
      // Vérifier que ce n'est pas déjà dans les suggestions par règles
      const existsInRules = ruleSuggestions.some(rs => 
        rs.name.toLowerCase().includes(suggestedName) || suggestedName.includes(rs.name.toLowerCase())
      );
      return !existsInMaterials && !existsInRules;
    });

    console.log(`🤖 AI suggestions: ${filteredAiSuggestions.length}`);

    // Combiner les suggestions (règles d'abord, puis IA)
    const allSuggestions = [
      ...ruleSuggestions,
      ...filteredAiSuggestions
    ];

    // Trier par priorité (high > medium > low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    allSuggestions.sort((a, b) => 
      (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
    );

    console.log(`✅ Total suggestions: ${allSuggestions.length} (${ruleSuggestions.length} rules + ${filteredAiSuggestions.length} AI) with ${modelUsed}`);

    return NextResponse.json({
      success: true,
      suggestions: allSuggestions,
      analysis,
      model: modelUsed,
      stats: {
        fromRules: ruleSuggestions.length,
        fromAI: filteredAiSuggestions.length,
        total: allSuggestions.length
      }
    });

  } catch (error) {
    console.error('Suggestion generation error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des suggestions' },
      { status: 500 }
    );
  }
}
