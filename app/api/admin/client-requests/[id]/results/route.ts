import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/client-requests/[id]/results
 * Récupère tous les résultats de recherche pour une requête
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const selectedOnly = searchParams.get('selected') === 'true';

    // Get all items for this request
    const { data: items } = await supabase
      .from('client_request_items')
      .select('id, name, images, status')
      .eq('client_request_id', id)
      .order('sort_order');

    if (!items || items.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const itemIds = items.map(i => i.id);

    // Build results query
    let query = supabase
      .from('marketplace_search_results')
      .select('*')
      .in('client_request_item_id', itemIds)
      .order('created_at');

    if (source) {
      query = query.eq('source', source);
    }
    if (selectedOnly) {
      query = query.eq('is_selected', true);
    }

    const { data: results, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group results by item
    const groupedByItem = items.map(item => ({
      item,
      results: (results || []).filter(r => r.client_request_item_id === item.id),
    }));

    return NextResponse.json({
      data: groupedByItem,
      totalResults: results?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
