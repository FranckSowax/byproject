import { NextRequest, NextResponse } from 'next/server';
import { completeJSON } from '@/lib/ai/clients';

// Configuration pour Netlify - timeout court pour un seul lot
export const maxDuration = 15; // 15 secondes max pour un lot de 5 matériaux
export const dynamic = 'force-dynamic';

// Human-readable field names in French
const FIELD_NAMES_FR: Record<string, string> = {
  'dimensions': 'Dimensions (L x l x H)',
  'diameter': 'Diametre',
  'section': 'Section',
  'length': 'Longueur',
  'thickness': 'Epaisseur',
  'material': 'Matiere',
  'type': 'Type',
  'color': 'Couleur',
  'finish': 'Finition',
  'volume': 'Volume/Quantite',
  'amperage': 'Amperage',
  'poles': 'Nombre de poles',
  'size': 'Taille',
  'glass_type': 'Type de verre',
  'flush_type': 'Type de chasse'
};

interface Material {
  id: string;
  name: string;
  description?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  images?: string[];
}

interface AnalysisResult {
  material_id: string;
  material_name: string;
  is_complete: boolean;
  missing_fields: string[];
  missing_fields_fr: string[];
  needs_images: boolean;
  needs_description: boolean;
  confidence_score: number;
  ai_suggestions: string[];
  current_info_summary: string;
}

/**
 * Endpoint pour analyser un lot de matériaux (max 5)
 * Appelé plusieurs fois par le client pour traiter tous les matériaux
 */
export async function POST(request: NextRequest) {
  try {
    const { materials, batchIndex = 0, totalBatches = 1 } = await request.json();

    if (!materials || !Array.isArray(materials)) {
      return NextResponse.json(
        { error: 'Liste de materiaux requise' },
        { status: 400 }
      );
    }

    // Limiter à 5 matériaux par lot
    const batch = materials.slice(0, 5);

    if (batch.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        batchIndex,
        totalBatches
      });
    }

    console.log(`Analyzing batch ${batchIndex + 1}/${totalBatches}: ${batch.length} materials`);

    const materialsText = batch.map((m: Material, i: number) =>
      `${i + 1}. [ID:${m.id}] ${m.name}${m.description ? ` - ${m.description}` : ''}${m.category ? ` (${m.category})` : ''}`
    ).join('\n');

    const prompt = `Tu es un EXPERT en sourcing de materiaux de construction avec 20 ans d'experience en import de Chine.

MISSION: Analyser chaque materiau et determiner si les informations sont SUFFISANTES pour qu'un fournisseur chinois puisse faire une cotation precise.

MATERIAUX A ANALYSER:
${materialsText}

Pour CHAQUE materiau, reponds avec:
1. Les informations MANQUANTES CRITIQUES pour une cotation (dimensions, matiere, couleur, finition, specifications techniques)
2. Si des PHOTOS sont necessaires pour comprendre le produit
3. Des SUGGESTIONS de clarification a demander au client

ATTENTION:
- Un fournisseur chinois a besoin d'informations PRECISES: dimensions exactes, matiere, finition, couleur
- Sans ces infos, le prix peut varier de 50% ou plus!
- Si le materiau est generique (ex: "Ciment"), seule la quantite suffit
- Si le materiau est specifique (ex: "Carrelage"), il faut dimensions, couleur, finition

REPONDS EN JSON VALIDE:
{
  "analyses": [
    {
      "material_id": "uuid-ici",
      "missing_critical": ["dimension", "couleur"],
      "needs_photos": true,
      "suggestions": ["Precisez les dimensions exactes (L x l)", "Quelle couleur souhaitez-vous?"]
    }
  ]
}`;

    const systemPrompt = "Tu es un expert en sourcing de materiaux BTP. Tu analyses les descriptions pour determiner si elles sont suffisantes pour une cotation. Tu reponds UNIQUEMENT en JSON valide.";

    let modelUsed = 'rule-based';
    const results: AnalysisResult[] = [];

    try {
      const result = await completeJSON<{ analyses: Array<{ material_id: string; missing_critical: string[]; needs_photos: boolean; suggestions: string[] }> }>(
        prompt,
        systemPrompt,
        { temperature: 0.3, maxTokens: 2000 }
      );

      modelUsed = `${result.provider}/${result.model}`;
      console.log(`Batch ${batchIndex + 1} completed with ${modelUsed}`);

      // Build results from AI response
      for (const material of batch) {
        const aiAnalysis = result.data.analyses?.find(a => a.material_id === material.id);

        const missingFields = aiAnalysis?.missing_critical || [];
        const missingFieldsFr = missingFields.map(f => FIELD_NAMES_FR[f] || f);
        const needsDesc = !material.description || material.description.length < 20;
        const needsImages = !material.images || material.images.length === 0;

        // Calculate confidence score
        let confidence = 100;
        confidence -= missingFields.length * 15;
        confidence -= needsDesc ? 20 : 0;
        confidence -= needsImages ? 10 : 0;
        confidence = Math.max(0, Math.min(100, confidence));

        const isComplete = missingFields.length === 0 && !needsDesc;

        results.push({
          material_id: material.id,
          material_name: material.name,
          is_complete: isComplete,
          missing_fields: missingFields,
          missing_fields_fr: missingFieldsFr,
          needs_images: needsImages && missingFields.length > 0,
          needs_description: needsDesc,
          confidence_score: confidence,
          ai_suggestions: aiAnalysis?.suggestions || missingFields.map(f => `Veuillez preciser: ${FIELD_NAMES_FR[f] || f}`),
          current_info_summary: `${material.name}${material.description ? ` - ${material.description}` : ''}`
        });
      }
    } catch (aiError: any) {
      console.error(`Batch ${batchIndex + 1} AI error:`, aiError.message);

      // Fallback: return rule-based analysis
      for (const material of batch) {
        const needsDesc = !material.description || material.description.length < 20;
        const needsImages = !material.images || material.images.length === 0;

        results.push({
          material_id: material.id,
          material_name: material.name,
          is_complete: !needsDesc,
          missing_fields: [],
          missing_fields_fr: [],
          needs_images: needsImages,
          needs_description: needsDesc,
          confidence_score: needsDesc ? 50 : 80,
          ai_suggestions: needsDesc ? ['Ajoutez une description plus detaillee'] : [],
          current_info_summary: `${material.name}${material.description ? ` - ${material.description}` : ''}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      model_used: modelUsed,
      batchIndex,
      totalBatches,
      results,
      materialsAnalyzed: results.length,
      needsClarification: results.filter(r => !r.is_complete).length
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse du lot' },
      { status: 500 }
    );
  }
}
