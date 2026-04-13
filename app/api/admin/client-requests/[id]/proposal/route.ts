import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { notifyProposalReady } from '@/lib/services/notification-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/client-requests/[id]/proposal
 * Génère et envoie une proposition au client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      default_margin_percent = 20,
      document_type = 'devis',
      valid_days = 30,
    } = body;

    const supabase = createServiceClient();

    // Get request
    const { data: clientRequest, error: reqError } = await supabase
      .from('client_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (reqError || !clientRequest) {
      return NextResponse.json({ error: 'Requête non trouvée' }, { status: 404 });
    }

    // Get all selected results
    const { data: items } = await supabase
      .from('client_request_items')
      .select('id')
      .eq('client_request_id', id);

    const itemIds = (items || []).map(i => i.id);
    if (itemIds.length === 0) {
      return NextResponse.json({ error: 'Aucun article dans la requête' }, { status: 400 });
    }

    const { data: selectedResults } = await supabase
      .from('marketplace_search_results')
      .select('*')
      .in('client_request_item_id', itemIds)
      .eq('is_selected', true);

    if (!selectedResults || selectedResults.length === 0) {
      return NextResponse.json(
        { error: 'Aucun résultat sélectionné pour la proposition' },
        { status: 400 }
      );
    }

    // Calculate total
    const totalAmount = selectedResults.reduce((sum, r) => {
      return sum + (r.client_price || 0) * (r.quantity || 1);
    }, 0);

    // Generate proposal number
    const { count } = await supabase
      .from('client_proposals')
      .select('*', { count: 'exact', head: true });

    const counter = (count || 0) + 1;
    const proposalNumber = `PR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(counter).padStart(4, '0')}`;

    // Create proposal
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + valid_days);

    const { data: proposal, error: propError } = await supabase
      .from('client_proposals')
      .insert({
        client_request_id: id,
        proposal_number: proposalNumber,
        status: 'sent',
        total_amount: Math.round(totalAmount * 100) / 100,
        currency: 'EUR',
        default_margin_percent: default_margin_percent,
        document_type,
        valid_until: validUntil.toISOString(),
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (propError) {
      return NextResponse.json({ error: propError.message }, { status: 500 });
    }

    // Update request status
    await supabase
      .from('client_requests')
      .update({
        status: 'proposal_ready',
        proposal_sent_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Notify (non-blocking)
    notifyProposalReady(clientRequest).catch(console.error);

    return NextResponse.json({
      data: proposal,
      proposal_url: `/client-request/${clientRequest.public_uuid}/proposal`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
