import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/client-requests
 * Crée une nouvelle requête client avec un UUID public unique
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { client_name, client_email, client_phone, client_company, title } = body;

    const supabase = createServiceClient();
    const publicUuid = crypto.randomUUID();

    // Generate request number
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
        client_name: client_name || null,
        client_email: client_email || null,
        client_phone: client_phone || null,
        client_company: client_company || null,
        title: title || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      public_uuid: publicUuid,
      request_url: `/client-request/${publicUuid}`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/client-requests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
