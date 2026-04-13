import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client-requests/[uuid]
 * Récupère une requête client par son UUID public (accès public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const supabase = createServiceClient();

    // Fetch request with items
    const { data: clientRequest, error } = await supabase
      .from('client_requests')
      .select('*')
      .eq('public_uuid', uuid)
      .single();

    if (error || !clientRequest) {
      return NextResponse.json(
        { error: 'Requête non trouvée' },
        { status: 404 }
      );
    }

    // Fetch items
    const { data: items } = await supabase
      .from('client_request_items')
      .select('*')
      .eq('client_request_id', clientRequest.id)
      .order('sort_order');

    return NextResponse.json({
      data: {
        ...clientRequest,
        items: items || [],
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/client-requests/[uuid]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
