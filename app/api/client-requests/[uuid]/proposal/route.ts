import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client-requests/[uuid]/proposal
 * Le client consulte la proposition curée par l'admin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const supabase = createServiceClient();

    // Get request
    const { data: clientRequest, error: reqError } = await supabase
      .from('client_requests')
      .select('*')
      .eq('public_uuid', uuid)
      .single();

    if (reqError || !clientRequest) {
      return NextResponse.json({ error: 'Requête non trouvée' }, { status: 404 });
    }

    // Get latest proposal
    const { data: proposal } = await supabase
      .from('client_proposals')
      .select('*')
      .eq('client_request_id', clientRequest.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!proposal) {
      return NextResponse.json(
        { error: 'Aucune proposition disponible' },
        { status: 404 }
      );
    }

    // Mark as viewed
    if (proposal.status === 'sent') {
      await supabase
        .from('client_proposals')
        .update({ status: 'viewed', viewed_at: new Date().toISOString() })
        .eq('id', proposal.id);
    }

    // Get items with selected search results
    const { data: items } = await supabase
      .from('client_request_items')
      .select('*')
      .eq('client_request_id', clientRequest.id)
      .order('sort_order');

    // Get selected search results for each item
    const itemsWithResults = await Promise.all(
      (items || []).map(async (item) => {
        const { data: results } = await supabase
          .from('marketplace_search_results')
          .select('*')
          .eq('client_request_item_id', item.id)
          .eq('is_selected', true)
          .order('created_at');

        return { ...item, search_results: results || [] };
      })
    );

    return NextResponse.json({
      data: {
        request: clientRequest,
        proposal,
        items: itemsWithResults,
      },
    });
  } catch (error: any) {
    console.error('Error in GET proposal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
