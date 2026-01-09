import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST - Send clarification request for specific materials
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    const {
      supplierRequestId,
      materialIds,
      message,
      needsImages,
      needsDescription
    } = body;

    if (!supplierRequestId || !materialIds || materialIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the supplier request to find the user and project
    const { data: supplierRequest, error: requestError } = await supabase
      .from('supplier_requests')
      .select('id, user_id, project_id, request_number, projects(name)')
      .eq('id', supplierRequestId)
      .single();

    if (requestError || !supplierRequest) {
      return NextResponse.json(
        { error: 'Supplier request not found' },
        { status: 404 }
      );
    }

    // Update each material with clarification request
    const clarificationData = {
      requested_at: new Date().toISOString(),
      message: message || 'Veuillez fournir plus de details et/ou des images pour ce materiau.',
      needs_images: needsImages ?? true,
      needs_description: needsDescription ?? true,
      resolved_at: null,
    };

    const { error: updateError } = await supabase
      .from('materials')
      .update({ clarification_request: clarificationData })
      .in('id', materialIds);

    if (updateError) {
      console.error('Error updating materials:', updateError);
      return NextResponse.json(
        { error: 'Failed to update materials' },
        { status: 500 }
      );
    }

    // Get material names for notification
    const { data: materials } = await supabase
      .from('materials')
      .select('name')
      .in('id', materialIds);

    const materialNames = materials?.map(m => m.name).join(', ') || '';

    // Create notification for the user
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: supplierRequest.user_id,
        type: 'clarification_request',
        title: 'Demande de precision',
        message: `Des informations supplementaires sont necessaires pour ${materialIds.length} materiau(x): ${materialNames.substring(0, 100)}${materialNames.length > 100 ? '...' : ''}`,
        data: {
          supplier_request_id: supplierRequestId,
          project_id: supplierRequest.project_id,
          material_ids: materialIds,
          request_number: supplierRequest.request_number,
        },
        link: `/dashboard/projects/${supplierRequest.project_id}`,
        icon: 'AlertCircle',
        color: 'orange',
        read: false,
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue anyway - materials were updated
    }

    // Update supplier request status to indicate clarification needed
    await supabase
      .from('supplier_requests')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', supplierRequestId);

    return NextResponse.json({
      success: true,
      message: `Demande de clarification envoyee pour ${materialIds.length} materiau(x)`,
      materialIds,
    });
  } catch (error) {
    console.error('Error sending clarification request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
