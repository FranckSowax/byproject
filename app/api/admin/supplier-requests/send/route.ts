import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';
import { completeText } from '@/lib/ai/clients';

// Configuration pour Netlify
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Fonction de traduction par lots
async function translateMaterialsBatch(
  materials: any[],
  targetLanguage: 'en' | 'zh'
): Promise<any[]> {
  const BATCH_SIZE = 5;
  const results: any[] = [];

  for (let i = 0; i < materials.length; i += BATCH_SIZE) {
    const batch = materials.slice(i, i + BATCH_SIZE);

    // Préparer le texte à traduire
    const textToTranslate = batch.map((m, idx) =>
      `[${idx + 1}] ${m.name}${m.description ? ` | ${m.description}` : ''}${m.category ? ` | ${m.category}` : ''}`
    ).join('\n');

    const systemPrompt = targetLanguage === 'zh'
      ? 'Translate these construction materials from French to Simplified Chinese. Return ONLY the translations in the same format [1] name | description | category, one per line.'
      : 'Translate these construction materials from French to English. Return ONLY the translations in the same format [1] name | description | category, one per line.';

    try {
      const translated = await completeText(
        `Translate:\n${textToTranslate}`,
        systemPrompt,
        { temperature: 0.2, maxTokens: 2000 }
      );

      // Parser les traductions
      const lines = translated.split('\n').filter(l => l.trim());

      batch.forEach((material, idx) => {
        const line = lines.find(l => l.startsWith(`[${idx + 1}]`));
        if (line) {
          const parts = line.replace(/^\[\d+\]\s*/, '').split('|').map(p => p.trim());
          results.push({
            ...material,
            translatedName: parts[0] || material.name,
            translatedDescription: parts[1] || material.description,
            originalName: material.name,
            originalDescription: material.description,
          });
        } else {
          results.push({
            ...material,
            translatedName: material.name,
            translatedDescription: material.description,
            translationError: true,
          });
        }
      });
    } catch (error) {
      console.error(`Translation batch error:`, error);
      // Fallback: utiliser les originaux
      batch.forEach(material => {
        results.push({
          ...material,
          translatedName: material.name,
          translatedDescription: material.description,
          translationError: true,
        });
      });
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const { requestId, numSuppliers } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Récupérer la demande avec les matériaux du projet
    const { data: supplierRequest, error: requestError } = await supabase
      .from('supplier_requests')
      .select('*, projects:project_id(id, name)')
      .eq('id', requestId)
      .single();

    if (requestError) {
      console.error('Error fetching request:', requestError);
      return NextResponse.json(
        { error: requestError.message },
        { status: 500 }
      );
    }

    // Nombre de fournisseurs (défaut: celui de la demande ou 3)
    const supplierCount = numSuppliers || supplierRequest.num_suppliers || 3;

    // Récupérer les matériaux du projet
    const { data: materials, error: materialsError } = await supabase
      .from('materials' as any)
      .select('*')
      .eq('project_id', supplierRequest.project_id);

    if (materialsError) {
      console.error('Error fetching materials:', materialsError);
      return NextResponse.json(
        { error: materialsError.message },
        { status: 500 }
      );
    }

    console.log(`Translating ${materials.length} materials...`);

    // Traduire les matériaux en anglais et chinois en parallèle
    const [materialsEn, materialsZh] = await Promise.all([
      translateMaterialsBatch(materials, 'en'),
      translateMaterialsBatch(materials, 'zh'),
    ]);

    console.log(`Translation complete: EN=${materialsEn.length}, ZH=${materialsZh.length}`);

    // Préparer le snapshot des matériaux avec traductions
    const materialsSnapshot = {
      fr: materials,
      en: materialsEn,
      zh: materialsZh,
      version: 1,
      created_at: new Date().toISOString()
    };

    // Date d'expiration (30 jours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Générer un token unique par fournisseur
    const supplierTokens = [];
    for (let i = 0; i < supplierCount; i++) {
      const token = nanoid(32);
      supplierTokens.push({
        supplier_request_id: requestId,
        token,
        materials_snapshot: materialsSnapshot,
        materials_version: 1,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });
    }

    // Insérer les tokens fournisseurs
    const { data: insertedTokens, error: tokensError } = await supabase
      .from('supplier_tokens')
      .insert(supplierTokens)
      .select('id, token');

    if (tokensError) {
      console.error('Error creating supplier tokens:', tokensError);
      return NextResponse.json(
        { error: tokensError.message },
        { status: 500 }
      );
    }

    // Mettre à jour la demande principale
    const { error: updateError } = await supabase
      .from('supplier_requests')
      .update({
        status: 'sent',
        materials_data: materials,
        materials_translated_en: materialsEn,
        materials_translated_zh: materialsZh,
        materials_version: 1,
        last_materials_update: new Date().toISOString(),
        total_materials: materials.length,
        sent_at: new Date().toISOString(),
        num_suppliers: supplierCount
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Générer les URLs pour chaque fournisseur
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const supplierLinks = insertedTokens.map((t: any, index: number) => ({
      id: t.id,
      label: `Fournisseur ${index + 1}`,
      token: t.token,
      url: `${baseUrl}/supplier-quote/${t.token}`
    }));

    return NextResponse.json({
      success: true,
      message: `${supplierCount} liens fournisseurs générés`,
      supplierLinks,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error: any) {
    console.error('Error in send supplier request API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
