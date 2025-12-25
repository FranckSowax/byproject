import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json();

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

    // Générer un token public
    const publicToken = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 jours

    // Mettre à jour la demande
    const { error: updateError } = await supabase
      .from('supplier_requests')
      .update({
        status: 'sent',
        public_token: publicToken,
        expires_at: expiresAt.toISOString(),
        materials_data: materials,
        materials_translated_en: materialsEn,
        materials_translated_zh: materialsZh,
        total_materials: materials.length,
        sent_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Demande envoyée aux fournisseurs',
      publicToken,
    });
  } catch (error: any) {
    console.error('Error in send supplier request API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
