import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/client-requests
 * Liste toutes les requêtes client (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('client_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with item counts
    const enrichedRequests = await Promise.all(
      (requests || []).map(async (req) => {
        const { count: itemCount } = await supabase
          .from('client_request_items')
          .select('*', { count: 'exact', head: true })
          .eq('client_request_id', req.id);

        const { count: resultCount } = await supabase
          .from('marketplace_search_results')
          .select('*', { count: 'exact', head: true })
          .in('client_request_item_id',
            (await supabase
              .from('client_request_items')
              .select('id')
              .eq('client_request_id', req.id)
            ).data?.map(i => i.id) || []
          );

        return {
          ...req,
          item_count: itemCount || 0,
          result_count: resultCount || 0,
        };
      })
    );

    return NextResponse.json({ data: enrichedRequests });
  } catch (error: any) {
    console.error('Error in admin client-requests GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/client-requests
 * Admin crée une nouvelle requête client (génère le lien pour le client)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title, client_name, client_email } = body;

    const supabase = createServiceClient();
    const publicUuid = crypto.randomUUID();

    const { count } = await supabase
      .from('client_requests')
      .select('*', { count: 'exact', head: true });

    const counter = (count || 0) + 1;
    const requestNumber = `CR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(counter).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('client_requests')
      .insert({
        public_uuid: publicUuid,
        request_number: requestNumber,
        title: title || null,
        client_name: client_name || null,
        client_email: client_email || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      public_uuid: publicUuid,
      client_url: `/client-request/${publicUuid}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
