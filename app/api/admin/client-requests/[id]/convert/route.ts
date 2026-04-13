import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/client-requests/[id]/convert
 * Convertit une requête client en projet ByProject avec matériaux
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { sector_id, project_name } = body;

    const supabase = createServiceClient();

    // Get request with items and selected results
    const { data: clientRequest, error: reqError } = await supabase
      .from('client_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (reqError || !clientRequest) {
      return NextResponse.json({ error: 'Requête non trouvée' }, { status: 404 });
    }

    // Check if already converted
    if (clientRequest.project_id) {
      return NextResponse.json(
        { error: 'Cette requête est déjà convertie en projet', project_id: clientRequest.project_id },
        { status: 409 }
      );
    }

    // Get items with selected results
    const { data: items } = await supabase
      .from('client_request_items')
      .select('*')
      .eq('client_request_id', id)
      .order('sort_order');

    // Create project
    const { data: project, error: projError } = await supabase
      .from('projects')
      .insert({
        name: project_name || clientRequest.title || `Requête ${clientRequest.request_number}`,
        user_id: clientRequest.assigned_admin_id || clientRequest.user_id,
        sector_id: sector_id || clientRequest.sector_id || null,
      })
      .select()
      .single();

    if (projError || !project) {
      return NextResponse.json({ error: 'Erreur création projet: ' + projError?.message }, { status: 500 });
    }

    // Create materials from items and selected results
    let materialCount = 0;
    let quotationCount = 0;

    for (const item of (items || [])) {
      // Get selected results for this item
      const { data: selectedResults } = await supabase
        .from('marketplace_search_results')
        .select('*')
        .eq('client_request_item_id', item.id)
        .eq('is_selected', true);

      // Create material
      const { data: material, error: matError } = await supabase
        .from('materials')
        .insert({
          project_id: project.id,
          name: item.name,
          category: null,
          quantity: item.quantity || 1,
          weight: null,
          volume: null,
          specs: {
            description: item.description,
            images: item.images,
            reference_url: item.reference_url,
            original_item_id: item.id,
          },
          client_request_item_id: item.id,
        })
        .select()
        .single();

      if (matError || !material) {
        console.error('Error creating material:', matError);
        continue;
      }

      materialCount++;

      // Link item to material
      await supabase
        .from('client_request_items')
        .update({ material_id: material.id })
        .eq('id', item.id);

      // Create material_quotations from selected marketplace results
      for (const result of (selectedResults || [])) {
        const { error: quotError } = await supabase
          .from('material_quotations')
          .insert({
            material_id: material.id,
            supplier_reference: `${result.source}-${result.supplier_name || 'unknown'}`,
            unit_price: result.client_price || result.price_min || 0,
            currency: result.client_currency || 'EUR',
            moq: result.moq || null,
            source_type: 'quotation',
            status: 'active',
            images: result.image_url ? [result.image_url] : [],
            marketplace_search_result_id: result.id,
          });

        if (!quotError) quotationCount++;
      }
    }

    // Link project to client request
    await supabase
      .from('client_requests')
      .update({ project_id: project.id })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      project_id: project.id,
      project_name: project.name,
      materials_created: materialCount,
      quotations_created: quotationCount,
    });
  } catch (error: any) {
    console.error('Error in convert:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
