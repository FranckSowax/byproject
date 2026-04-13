import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { notifyClientReviewed } from '@/lib/services/notification-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/client-requests/[uuid]/proposal/respond
 * Le client sélectionne les articles et quantités dans la proposition
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const body = await request.json();
    const { selections, client_notes } = body;

    if (!selections || !Array.isArray(selections)) {
      return NextResponse.json(
        { error: 'Les sélections sont requises' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get request
    const { data: clientRequest } = await supabase
      .from('client_requests')
      .select('*')
      .eq('public_uuid', uuid)
      .single();

    if (!clientRequest) {
      return NextResponse.json({ error: 'Requête non trouvée' }, { status: 404 });
    }

    // Update each search result with client's selection
    let selectedCount = 0;
    for (const selection of selections) {
      const { result_id, selected, quantity } = selection;

      await supabase
        .from('marketplace_search_results')
        .update({
          client_selected: selected,
          client_quantity: quantity || 1,
        })
        .eq('id', result_id);

      if (selected) selectedCount++;
    }

    // Update proposal with client selections
    const { data: proposal } = await supabase
      .from('client_proposals')
      .select('id')
      .eq('client_request_id', clientRequest.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (proposal) {
      await supabase
        .from('client_proposals')
        .update({
          client_selections: selections,
          client_notes: client_notes || null,
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', proposal.id);
    }

    // Update request status
    await supabase
      .from('client_requests')
      .update({
        status: 'proposal_reviewed',
        client_reviewed_at: new Date().toISOString(),
      })
      .eq('id', clientRequest.id);

    // Notify admin (non-blocking)
    notifyClientReviewed(clientRequest, selectedCount).catch(console.error);

    return NextResponse.json({ success: true, selectedCount });
  } catch (error: any) {
    console.error('Error in proposal respond:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
