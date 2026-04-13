import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { notifyRequestSubmitted } from '@/lib/services/notification-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/client-requests/[uuid]/submit
 * Le client soumet sa requête avec ses informations personnelles
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const body = await request.json();
    const { client_name, client_email, client_phone, client_company, notes } = body;

    if (!client_name || !client_email) {
      return NextResponse.json(
        { error: 'Le nom et l\'email sont requis' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check request exists
    const { data: clientRequest, error: reqError } = await supabase
      .from('client_requests')
      .select('id, status')
      .eq('public_uuid', uuid)
      .single();

    if (reqError || !clientRequest) {
      return NextResponse.json({ error: 'Requête non trouvée' }, { status: 404 });
    }

    // Check it has items
    const { count: itemCount } = await supabase
      .from('client_request_items')
      .select('*', { count: 'exact', head: true })
      .eq('client_request_id', clientRequest.id);

    if (!itemCount || itemCount === 0) {
      return NextResponse.json(
        { error: 'Ajoutez au moins un article avant de soumettre' },
        { status: 400 }
      );
    }

    // Update request with client info and status
    const { data: updated, error } = await supabase
      .from('client_requests')
      .update({
        client_name,
        client_email,
        client_phone: client_phone || null,
        client_company: client_company || null,
        admin_notes: notes || null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', clientRequest.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch items for notification
    const { data: items } = await supabase
      .from('client_request_items')
      .select('*')
      .eq('client_request_id', clientRequest.id);

    // Send notification (non-blocking)
    notifyRequestSubmitted({ ...updated, items: items || [] }).catch(console.error);

    return NextResponse.json({ data: updated, success: true });
  } catch (error: any) {
    console.error('Error in submit:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
