import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';

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

    // Traduire les matériaux en anglais
    const translateResponseEn = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/translate`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials, targetLanguage: 'en' }),
      }
    );

    if (!translateResponseEn.ok) {
      throw new Error('English translation failed');
    }

    const { translations: materialsEn } = await translateResponseEn.json();

    // Traduire les matériaux en chinois
    const translateResponseZh = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/translate`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials, targetLanguage: 'zh' }),
      }
    );

    if (!translateResponseZh.ok) {
      throw new Error('Chinese translation failed');
    }

    const { translations: materialsZh } = await translateResponseZh.json();

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
