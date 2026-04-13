import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/client-requests/[uuid]/items
 * Ajoute un article à la requête client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const body = await request.json();
    const { name, description, quantity, unit, images, reference_url } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom de l\'article est requis' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Find request by public UUID
    const { data: clientRequest, error: reqError } = await supabase
      .from('client_requests')
      .select('id, status')
      .eq('public_uuid', uuid)
      .single();

    if (reqError || !clientRequest) {
      return NextResponse.json({ error: 'Requête non trouvée' }, { status: 404 });
    }

    if (!['draft', 'submitted'].includes(clientRequest.status)) {
      return NextResponse.json(
        { error: 'La requête ne peut plus être modifiée' },
        { status: 400 }
      );
    }

    // Get current item count for sort_order
    const { count } = await supabase
      .from('client_request_items')
      .select('*', { count: 'exact', head: true })
      .eq('client_request_id', clientRequest.id);

    const { data: item, error } = await supabase
      .from('client_request_items')
      .insert({
        client_request_id: clientRequest.id,
        name: name.trim(),
        description: description || null,
        quantity: quantity || 1,
        unit: unit || 'pièce',
        images: images || [],
        reference_url: reference_url || null,
        sort_order: count || 0,
        added_by: 'client',
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: item });
  } catch (error: any) {
    console.error('Error in POST items:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
