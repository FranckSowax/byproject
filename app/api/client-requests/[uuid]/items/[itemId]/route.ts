import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/client-requests/[uuid]/items/[itemId]
 * Met à jour un article
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string; itemId: string }> }
) {
  try {
    const { uuid, itemId } = await params;
    const body = await request.json();
    const supabase = createServiceClient();

    // Verify request exists and is editable
    const { data: clientRequest } = await supabase
      .from('client_requests')
      .select('id, status')
      .eq('public_uuid', uuid)
      .single();

    if (!clientRequest || !['draft', 'submitted'].includes(clientRequest.status)) {
      return NextResponse.json({ error: 'Requête non modifiable' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.reference_url !== undefined) updateData.reference_url = body.reference_url;
    if (body.client_note !== undefined) updateData.client_note = body.client_note;

    const { data, error } = await supabase
      .from('client_request_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('client_request_id', clientRequest.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/client-requests/[uuid]/items/[itemId]
 * Supprime un article
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string; itemId: string }> }
) {
  try {
    const { uuid, itemId } = await params;
    const supabase = createServiceClient();

    const { data: clientRequest } = await supabase
      .from('client_requests')
      .select('id, status')
      .eq('public_uuid', uuid)
      .single();

    if (!clientRequest || !['draft', 'submitted'].includes(clientRequest.status)) {
      return NextResponse.json({ error: 'Requête non modifiable' }, { status: 400 });
    }

    const { error } = await supabase
      .from('client_request_items')
      .delete()
      .eq('id', itemId)
      .eq('client_request_id', clientRequest.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
