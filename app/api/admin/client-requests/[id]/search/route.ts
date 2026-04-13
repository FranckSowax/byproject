import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { searchItemsForRequest } from '@/lib/services/marketplace-aggregator';
import { notifySearchComplete } from '@/lib/services/notification-service';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/client-requests/[id]/search
 * Lance la recherche marketplace pour tous les items de la requête
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { sources, maxResultsPerSource } = body;

    const supabase = createServiceClient();

    // Verify request exists
    const { data: clientRequest, error: reqError } = await supabase
      .from('client_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (reqError || !clientRequest) {
      return NextResponse.json({ error: 'Requête non trouvée' }, { status: 404 });
    }

    // Check not already searching
    if (clientRequest.status === 'searching') {
      return NextResponse.json(
        { error: 'Une recherche est déjà en cours' },
        { status: 409 }
      );
    }

    console.log(`[Admin] Starting marketplace search for request ${id}`);

    // Run search
    const { totalResults, errors } = await searchItemsForRequest(id, {
      sources,
      maxResultsPerSource: maxResultsPerSource || 10,
    });

    // Notify admin
    notifySearchComplete(clientRequest, totalResults).catch(console.error);

    return NextResponse.json({
      success: true,
      totalResults,
      errors,
    });
  } catch (error: any) {
    console.error('Error in search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
