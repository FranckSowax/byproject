import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { completeJSON } from '@/lib/ai/clients';

// Configuration pour Netlify/Vercel - augmenter le timeout
export const maxDuration = 60; // 60 secondes max
export const dynamic = 'force-dynamic';

// Fields that are commonly needed for different material types
const MATERIAL_REQUIRED_FIELDS: Record<string, string[]> = {
  // Electrical materials
  'cable': ['section', 'length', 'type'],
  'fil': ['section', 'length', 'color'],
  'disjoncteur': ['amperage', 'type', 'poles'],
  'prise': ['type', 'color', 'amperage'],
  'interrupteur': ['type', 'color'],

  // Plumbing materials
  'tuyau': ['diameter', 'length', 'material'],
  'raccord': ['diameter', 'type', 'material'],
  'robinet': ['type', 'finish', 'size'],
  'vanne': ['diameter', 'type', 'material'],

  // Building materials
  'carrelage': ['dimensions', 'thickness', 'finish', 'color'],
  'faience': ['dimensions', 'thickness', 'color', 'finish'],
  'peinture': ['type', 'finish', 'color', 'volume'],
  'porte': ['dimensions', 'material', 'type', 'finish'],
  'fenetre': ['dimensions', 'material', 'type', 'glass_type'],

  // Metal materials
  'fer': ['diameter', 'length', 'type'],
  'tube': ['diameter', 'thickness', 'length', 'material'],
  'profile': ['dimensions', 'thickness', 'length', 'type'],

  // Fixtures
  'lavabo': ['dimensions', 'material', 'type', 'color'],
  'wc': ['type', 'color', 'flush_type'],
  'douche': ['dimensions', 'type', 'material'],

  // Default for general materials
  'default': ['dimensions', 'material', 'color']
};

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

function getMaterialType(name: string): string {
  const nameLower = name.toLowerCase();
  for (const type of Object.keys(MATERIAL_REQUIRED_FIELDS)) {
    if (type !== 'default' && nameLower.includes(type)) {
      return type;
    }
  }
  return 'default';
}

function preAnalyzeMaterial(material: Material): { missing: string[], needsImages: boolean, needsDesc: boolean } {
  const missing: string[] = [];
  const name = material.name.toLowerCase();
  const desc = (material.description || '').toLowerCase();
  const fullText = `${name} ${desc}`;

  // Check for dimensions
  const hasDimensions = /\d+\s*(x|×|cm|mm|m|")\s*\d*/i.test(fullText);
  if (!hasDimensions) {
    missing.push('dimensions');
  }

  // Check for material type
  const materialKeywords = ['acier', 'inox', 'pvc', 'cuivre', 'bois', 'aluminium', 'fer', 'bronze', 'laiton', 'plastique', 'ceramique', 'porcelaine', 'verre', 'metal'];
  const hasMaterial = materialKeywords.some(kw => fullText.includes(kw));
  if (!hasMaterial) {
    const materialType = getMaterialType(material.name);
    if (MATERIAL_REQUIRED_FIELDS[materialType]?.includes('material')) {
      missing.push('material');
    }
  }

  // Check for color
  const colorKeywords = ['blanc', 'noir', 'gris', 'rouge', 'bleu', 'vert', 'jaune', 'marron', 'beige', 'chrome', 'dore', 'argent', 'naturel'];
  const hasColor = colorKeywords.some(kw => fullText.includes(kw));
  if (!hasColor) {
    const materialType = getMaterialType(material.name);
    if (MATERIAL_REQUIRED_FIELDS[materialType]?.includes('color')) {
      missing.push('color');
    }
  }

  // Check for diameter (pipes, cables, etc.)
  const hasDiameter = /\d+\s*(mm|cm|dn|")/i.test(fullText) || /diametre|diam\./i.test(fullText);
  const materialType = getMaterialType(material.name);
  if (!hasDiameter && MATERIAL_REQUIRED_FIELDS[materialType]?.includes('diameter')) {
    missing.push('diameter');
  }

  // Check if description is too short
  const needsDesc = !material.description || material.description.length < 20;

  // Check if images would help
  const needsImages = !material.images || material.images.length === 0;

  return { missing, needsImages, needsDesc };
}

export async function POST(request: NextRequest) {
  try {
    const { materials, supplierRequestId, autoSendClarifications = false } = await request.json();

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json(
        { error: 'Liste de materiaux requise' },
        { status: 400 }
      );
    }

    console.log(`Analyzing ${materials.length} materials for completeness...`);

    const supabase = createServiceClient();

    // Update supplier request status to analyzing
    if (supplierRequestId) {
      await supabase
        .from('supplier_requests')
        .update({
          ai_analysis_status: 'analyzing',
          updated_at: new Date().toISOString()
        })
        .eq('id', supplierRequestId);
    }

    // Step 1: Pre-analysis (fast, rule-based)
    const preAnalysisResults: Record<string, { missing: string[], needsImages: boolean, needsDesc: boolean }> = {};
    const materialsNeedingAI: Material[] = [];

    for (const material of materials) {
      const preResult = preAnalyzeMaterial(material);
      preAnalysisResults[material.id] = preResult;

      // If pre-analysis found issues, add to AI analysis for better suggestions
      if (preResult.missing.length > 0 || preResult.needsDesc) {
        materialsNeedingAI.push(material);
      }
    }

    console.log(`Pre-analysis: ${materialsNeedingAI.length}/${materials.length} need deeper AI analysis`);

    // Step 2: AI Analysis for materials with potential issues
    // Process in batches of 5 materials to avoid timeouts
    const BATCH_SIZE = 5;
    let aiAnalysisResults: Record<string, { suggestions: string[], additionalMissing: string[] }> = {};
    let modelUsed = 'rule-based';

    if (materialsNeedingAI.length > 0) {
      const systemPrompt = "Tu es un expert en sourcing de materiaux BTP. Tu analyses les descriptions pour determiner si elles sont suffisantes pour une cotation. Tu reponds UNIQUEMENT en JSON valide.";

      // Split materials into batches
      const batches: Material[][] = [];
      for (let i = 0; i < materialsNeedingAI.length; i += BATCH_SIZE) {
        batches.push(materialsNeedingAI.slice(i, i + BATCH_SIZE));
      }

      console.log(`Processing ${batches.length} batch(es) of max ${BATCH_SIZE} materials each`);

      // Process batches sequentially to avoid rate limits
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const materialsText = batch.map((m, i) =>
          `${i + 1}. [ID:${m.id}] ${m.name}${m.description ? ` - ${m.description}` : ''}${m.category ? ` (${m.category})` : ''}`
        ).join('\n');

        const prompt = `Tu es un EXPERT en sourcing de materiaux de construction avec 20 ans d'experience en import de Chine.

MISSION: Analyser chaque materiau et determiner si les informations sont SUFFISANTES pour qu'un fournisseur chinois puisse faire une cotation precise.

MATERIAUX A ANALYSER (Lot ${batchIndex + 1}/${batches.length}):
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

        try {
          // Use unified AI client with automatic fallback: DeepSeek > OpenAI
          const result = await completeJSON<{ analyses: Array<{ material_id: string; missing_critical: string[]; needs_photos: boolean; suggestions: string[] }> }>(
            prompt,
            systemPrompt,
            { temperature: 0.3, maxTokens: 2000 }
          );

          modelUsed = `${result.provider}/${result.model}`;
          console.log(`Batch ${batchIndex + 1}/${batches.length} completed with ${modelUsed}`);

          if (result.data.analyses && Array.isArray(result.data.analyses)) {
            for (const analysis of result.data.analyses) {
              aiAnalysisResults[analysis.material_id] = {
                suggestions: analysis.suggestions || [],
                additionalMissing: analysis.missing_critical || []
              };
            }
          }
        } catch (aiError: any) {
          console.error(`Batch ${batchIndex + 1} AI analysis error:`, aiError.message);
          // Continue with next batch - rule-based results will be used for failed materials
        }
      }

      console.log(`AI Analysis completed: ${Object.keys(aiAnalysisResults).length}/${materialsNeedingAI.length} materials analyzed`);
    }

    // Step 3: Combine results
    const analysisResults: AnalysisResult[] = materials.map(material => {
      const preResult = preAnalysisResults[material.id] || { missing: [], needsImages: true, needsDesc: true };
      const aiResult = aiAnalysisResults[material.id] || { suggestions: [], additionalMissing: [] };

      // Merge missing fields
      const allMissing = [...new Set([...preResult.missing, ...aiResult.additionalMissing])];
      const missingFr = allMissing.map(f => FIELD_NAMES_FR[f] || f);

      // Calculate confidence score
      let confidence = 100;
      confidence -= allMissing.length * 15;
      confidence -= preResult.needsDesc ? 20 : 0;
      confidence -= preResult.needsImages ? 10 : 0;
      confidence = Math.max(0, Math.min(100, confidence));

      const isComplete = allMissing.length === 0 && !preResult.needsDesc;

      // Generate suggestions if AI didn't provide any
      const suggestions = aiResult.suggestions.length > 0
        ? aiResult.suggestions
        : allMissing.map(f => `Veuillez preciser: ${FIELD_NAMES_FR[f] || f}`);

      return {
        material_id: material.id,
        material_name: material.name,
        is_complete: isComplete,
        missing_fields: allMissing,
        missing_fields_fr: missingFr,
        needs_images: preResult.needsImages && allMissing.length > 0,
        needs_description: preResult.needsDesc,
        confidence_score: confidence,
        ai_suggestions: suggestions,
        current_info_summary: `${material.name}${material.description ? ` - ${material.description}` : ''}`
      };
    });

    // Count materials needing clarification
    const materialsNeedingClarification = analysisResults.filter(r => !r.is_complete);
    const allComplete = materialsNeedingClarification.length === 0;

    // Step 4: Update database if requested
    if (supplierRequestId) {
      const analysisStatus = allComplete ? 'ready' : 'needs_clarification';

      await supabase
        .from('supplier_requests')
        .update({
          ai_analysis_status: analysisStatus,
          ai_analysis_completed_at: new Date().toISOString(),
          ai_analysis_result: {
            model_used: modelUsed,
            total_materials: materials.length,
            complete_materials: materials.length - materialsNeedingClarification.length,
            incomplete_materials: materialsNeedingClarification.length,
            analyzed_at: new Date().toISOString()
          },
          materials_needing_clarification: materialsNeedingClarification.length
        })
        .eq('id', supplierRequestId);

      // Auto-send clarification requests if enabled
      if (autoSendClarifications && materialsNeedingClarification.length > 0) {
        // Get supplier request info for notification
        const { data: supplierRequest } = await supabase
          .from('supplier_requests')
          .select('user_id, project_id, request_number, projects(name)')
          .eq('id', supplierRequestId)
          .single();

        // Update materials with clarification requests in batch (parallel)
        const updatePromises = materialsNeedingClarification.map(result => {
          const clarificationData = {
            requested_at: new Date().toISOString(),
            requested_by: 'ai',
            source: 'ai_analysis',
            message: result.ai_suggestions.join(' '),
            missing_fields: result.missing_fields,
            needs_images: result.needs_images,
            needs_description: result.needs_description,
            ai_suggestions: result.ai_suggestions,
            resolved_at: null,
          };

          return supabase
            .from('materials')
            .update({ clarification_request: clarificationData })
            .eq('id', result.material_id);
        });

        // Execute all updates in parallel
        await Promise.all(updatePromises);

        // Create notification for client
        if (supplierRequest?.user_id) {
          const materialNames = materialsNeedingClarification
            .slice(0, 3)
            .map(m => m.material_name)
            .join(', ');

          await supabase
            .from('notifications')
            .insert({
              user_id: supplierRequest.user_id,
              type: 'clarification_request',
              title: 'Informations supplementaires requises',
              message: `L'IA a detecte que ${materialsNeedingClarification.length} materiau(x) necessitent plus de details pour obtenir une cotation precise: ${materialNames}${materialsNeedingClarification.length > 3 ? '...' : ''}`,
              data: {
                supplier_request_id: supplierRequestId,
                project_id: supplierRequest.project_id,
                material_ids: materialsNeedingClarification.map(m => m.material_id),
                analysis_source: 'ai'
              },
              link: `/dashboard/projects/${supplierRequest.project_id}`,
              icon: 'Bot',
              color: 'orange',
              read: false,
            });
        }
      }

      // Always notify admins about the analysis completion
      // Get all admin users
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');

      // Also check user_metadata for admin role
      const { data: adminAuthUsers } = await supabase.auth.admin.listUsers();
      const adminIds = new Set<string>();

      // Add admins from users table
      if (adminUsers) {
        adminUsers.forEach(u => adminIds.add(u.id));
      }

      // Add admins from auth metadata
      if (adminAuthUsers?.users) {
        adminAuthUsers.users.forEach(u => {
          if (u.user_metadata?.role === 'admin') {
            adminIds.add(u.id);
          }
        });
      }

      // Get project name for notification
      const { data: supplierRequestData } = await supabase
        .from('supplier_requests')
        .select('request_number, projects(name)')
        .eq('id', supplierRequestId)
        .single();

      const projectName = (supplierRequestData?.projects as any)?.name || 'Projet';
      const requestNumber = supplierRequestData?.request_number || '';

      // Create notifications for all admins in batch
      if (adminIds.size > 0) {
        const adminNotifications = Array.from(adminIds).map(adminId => ({
          user_id: adminId,
          type: 'ai_analysis_complete',
          title: allComplete
            ? 'Analyse IA terminee - Pret a envoyer'
            : 'Analyse IA terminee - Clarifications requises',
          message: allComplete
            ? `L'analyse IA de la demande ${requestNumber} (${projectName}) est terminee. Tous les ${materials.length} materiaux sont complets et prets a etre envoyes aux fournisseurs.`
            : `L'analyse IA de la demande ${requestNumber} (${projectName}) a detecte ${materialsNeedingClarification.length}/${materials.length} materiau(x) necessitant des precisions.`,
          data: {
            supplier_request_id: supplierRequestId,
            total_materials: materials.length,
            complete_materials: materials.length - materialsNeedingClarification.length,
            incomplete_materials: materialsNeedingClarification.length,
            analysis_status: allComplete ? 'ready' : 'needs_clarification'
          },
          link: `/admin/supplier-requests/${supplierRequestId}`,
          icon: 'Bot',
          color: allComplete ? 'green' : 'orange',
          read: false,
        }));

        await supabase.from('notifications').insert(adminNotifications);
      }
    }

    console.log(`Analysis complete: ${materialsNeedingClarification.length}/${materials.length} need clarification`);

    return NextResponse.json({
      success: true,
      model_used: modelUsed,
      summary: {
        total_materials: materials.length,
        complete: materials.length - materialsNeedingClarification.length,
        needs_clarification: materialsNeedingClarification.length,
        ready_for_quotation: allComplete
      },
      results: analysisResults,
      materials_needing_clarification: materialsNeedingClarification
    });

  } catch (error) {
    console.error('Material analysis error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse des materiaux' },
      { status: 500 }
    );
  }
}
