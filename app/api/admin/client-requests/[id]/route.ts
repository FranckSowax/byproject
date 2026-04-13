import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/client-requests/[id]
 * Détail d'une requête client avec items et résultats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // Fetch request
    const { data: clientRequest, error } = await supabase
      .from('client_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !clientRequest) {
      return NextResponse.json({ error: 'Requête non trouvée' }, { status: 404 });
    }

    // Fetch items with search results
    const { data: items } = await supabase
      .from('client_request_items')
      .select('*')
      .eq('client_request_id', id)
      .order('sort_order');

    const itemsWithResults = await Promise.all(
      (items || []).map(async (item) => {
        const { data: results } = await supabase
          .from('marketplace_search_results')
          .select('*')
          .eq('client_request_item_id', item.id)
          .order('created_at');

        return { ...item, search_results: results || [] };
      })
    );

    // Fetch proposals
    const { data: proposals } = await supabase
      .from('client_proposals')
      .select('*')
      .eq('client_request_id', id)
      .order('created_at', { ascending: false });

    // Fetch notes
    const itemIds = (items || []).map(i => i.id);
    let notes: any[] = [];
    if (itemIds.length > 0) {
      const { data: notesData } = await supabase
        .from('client_request_notes')
        .select('*')
        .in('client_request_item_id', itemIds)
        .order('created_at');
      notes = notesData || [];
    }

    return NextResponse.json({
      data: {
        ...clientRequest,
        items: itemsWithResults,
        proposals: proposals || [],
        notes,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/client-requests/[id]
 * Met à jour une requête client (admin)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServiceClient();

    const allowedFields = [
      'status', 'title', 'admin_notes', 'assigned_admin_id',
      'client_name', 'client_email', 'client_phone', 'client_company',
      'sector_id',
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Set timestamps based on status changes
    if (updateData.status === 'proposal_ready') {
      updateData.proposal_sent_at = new Date().toISOString();
    }
    if (updateData.status === 'accepted' || updateData.status === 'rejected') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('client_requests')
      .update(updateData)
      .eq('id', id)
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
 * DELETE /api/admin/client-requests/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('client_requests')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
