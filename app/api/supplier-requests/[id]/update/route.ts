import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST - Update an existing supplier request with modified materials
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    const requestId = params.id;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the supplier request
    const { data: supplierRequest, error: requestError } = await supabase
      .from('supplier_requests')
      .select('*, projects(name)')
      .eq('id', requestId)
      .single();

    if (requestError || !supplierRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Verify user owns this request
    if (supplierRequest.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get updated materials from the project
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .eq('project_id', supplierRequest.project_id)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (materialsError) {
      return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
    }

    // Count modified materials (those with resolved clarification requests)
    const modifiedMaterials = materials?.filter(
      m => m.clarification_request?.resolved_at
    ) || [];

    // Prepare updated materials data with modification flags
    const updatedMaterialsData = materials?.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      category: m.category,
      quantity: m.quantity,
      images: m.images || [],
      clarification_request: m.clarification_request,
      was_modified: m.clarification_request?.resolved_at ? true : false,
    })) || [];

    // Update the supplier request with new materials data
    const { error: updateError } = await serviceClient
      .from('supplier_requests')
      .update({
        materials_data: updatedMaterialsData,
        total_materials: materials?.length || 0,
        updated_at: new Date().toISOString(),
        status: 'pending_admin', // Reset to pending for admin review
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating supplier request:', updateError);
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }

    // Get admin users to notify them
    const { data: adminUsers } = await serviceClient
      .from('users')
      .select('id')
      .eq('role_id', 1);

    // Create notifications for admins
    if (adminUsers && adminUsers.length > 0) {
      const notifications = adminUsers.map(admin => ({
        user_id: admin.id,
        type: 'request_updated',
        title: 'Demande de cotation mise à jour',
        message: `Le client a mis à jour sa demande ${supplierRequest.request_number} avec ${modifiedMaterials.length} matériau(x) modifié(s)`,
        data: {
          supplier_request_id: requestId,
          request_number: supplierRequest.request_number,
          project_id: supplierRequest.project_id,
          modified_count: modifiedMaterials.length,
        },
        link: `/admin/supplier-requests/${requestId}`,
        icon: 'Package',
        color: 'blue',
        read: false,
      }));

      await serviceClient.from('notifications').insert(notifications);
    }

    return NextResponse.json({
      success: true,
      message: `Demande mise à jour avec ${modifiedMaterials.length} matériau(x) modifié(s)`,
      modifiedCount: modifiedMaterials.length,
    });
  } catch (error) {
    console.error('Error updating supplier request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
