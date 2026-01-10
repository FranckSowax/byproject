import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST - Sync material updates to all supplier tokens
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

    // Get the supplier request
    const { data: supplierRequest, error: requestError } = await supabase
      .from('supplier_requests')
      .select('*, projects:project_id(id, name)')
      .eq('id', requestId)
      .single();

    if (requestError || !supplierRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Get latest materials from the project
    const { data: materials, error: materialsError } = await supabase
      .from('materials' as any)
      .select('*')
      .eq('project_id', supplierRequest.project_id);

    if (materialsError) {
      return NextResponse.json(
        { error: materialsError.message },
        { status: 500 }
      );
    }

    // Translate materials
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const [translateEnRes, translateZhRes] = await Promise.all([
      fetch(`${baseUrl}/api/translate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials, targetLanguage: 'en' }),
      }),
      fetch(`${baseUrl}/api/translate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials, targetLanguage: 'zh' }),
      }),
    ]);

    const materialsEn = translateEnRes.ok
      ? (await translateEnRes.json()).translations
      : materials;
    const materialsZh = translateZhRes.ok
      ? (await translateZhRes.json()).translations
      : materials;

    // Increment version
    const newVersion = (supplierRequest.materials_version || 1) + 1;

    // Prepare new snapshot
    const newSnapshot = {
      fr: materials,
      en: materialsEn,
      zh: materialsZh,
      version: newVersion,
      created_at: new Date().toISOString()
    };

    // Find materials that changed (compare with old snapshot)
    const oldMaterials = supplierRequest.materials_data || [];
    const changedMaterials = materials.filter((newMat: any) => {
      const oldMat = oldMaterials.find((m: any) => m.id === newMat.id);
      if (!oldMat) return true; // New material

      // Check for relevant changes (images, description, clarification resolved)
      return (
        JSON.stringify(newMat.images) !== JSON.stringify(oldMat.images) ||
        newMat.description !== oldMat.description ||
        (newMat.clarification_request?.resolved_at && !oldMat.clarification_request?.resolved_at)
      );
    });

    // Get all supplier tokens for this request
    const { data: supplierTokens, error: tokensError } = await supabase
      .from('supplier_tokens' as any)
      .select('id, status, materials_version')
      .eq('supplier_request_id', requestId);

    if (tokensError) {
      return NextResponse.json(
        { error: tokensError.message },
        { status: 500 }
      );
    }

    // Update each supplier token
    const pendingUpdates = changedMaterials.map((m: any) => ({
      material_id: m.id,
      material_name: m.name,
      change_type: m.clarification_request?.resolved_at ? 'clarification_resolved' : 'updated',
      updated_at: new Date().toISOString()
    }));

    const updatePromises = supplierTokens.map((token: any) =>
      supabase
        .from('supplier_tokens' as any)
        .update({
          materials_snapshot: newSnapshot,
          materials_version: newVersion,
          last_synced_at: new Date().toISOString(),
          has_pending_updates: changedMaterials.length > 0,
          pending_updates: changedMaterials.length > 0 ? pendingUpdates : []
        })
        .eq('id', token.id)
    );

    await Promise.all(updatePromises);

    // Update the main supplier request
    await supabase
      .from('supplier_requests')
      .update({
        materials_data: materials,
        materials_translated_en: materialsEn,
        materials_translated_zh: materialsZh,
        materials_version: newVersion,
        last_materials_update: new Date().toISOString()
      })
      .eq('id', requestId);

    return NextResponse.json({
      success: true,
      message: `${supplierTokens.length} fournisseurs synchronisés`,
      version: newVersion,
      changedMaterials: changedMaterials.length,
      suppliersSynced: supplierTokens.length
    });
  } catch (error: any) {
    console.error('Error syncing supplier tokens:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Check sync status for a request
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get supplier request with its tokens
    const { data: supplierRequest, error: requestError } = await supabase
      .from('supplier_requests')
      .select('materials_version, last_materials_update')
      .eq('id', requestId)
      .single();

    if (requestError) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Get all supplier tokens
    const { data: supplierTokens, error: tokensError } = await supabase
      .from('supplier_tokens' as any)
      .select('id, status, materials_version, has_pending_updates, supplier_name, supplier_company, last_viewed_at')
      .eq('supplier_request_id', requestId);

    if (tokensError) {
      return NextResponse.json(
        { error: tokensError.message },
        { status: 500 }
      );
    }

    // Check how many need sync
    const needsSync = supplierTokens.filter(
      (t: any) => t.materials_version < supplierRequest.materials_version
    );

    return NextResponse.json({
      currentVersion: supplierRequest.materials_version,
      lastUpdate: supplierRequest.last_materials_update,
      suppliers: supplierTokens.map((t: any) => ({
        id: t.id,
        name: t.supplier_name || t.supplier_company || 'Non renseigné',
        status: t.status,
        version: t.materials_version,
        hasPendingUpdates: t.has_pending_updates,
        lastViewed: t.last_viewed_at,
        needsSync: t.materials_version < supplierRequest.materials_version
      })),
      needsSyncCount: needsSync.length
    });
  } catch (error: any) {
    console.error('Error checking sync status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
