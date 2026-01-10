import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { materials, userId } = await request.json();

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json(
        { error: 'Materials list is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // Check if user exists and get their subscription
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check subscription status
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no subscription, create a freemium trial
    let userSubscription = subscription;
    if (!subscription) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 15); // 15 days trial

      const { data: newSub, error: newSubError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'Trial',
          project_limit: 5,
          export_limit: 10,
          expires_at: trialEndDate.toISOString(),
        })
        .select()
        .single();

      if (newSubError) {
        console.error('Error creating subscription:', newSubError);
      } else {
        userSubscription = newSub;
      }
    }

    // Check if trial has expired
    if (userSubscription?.expires_at && new Date(userSubscription.expires_at) < new Date()) {
      if (userSubscription.plan === 'Trial') {
        return NextResponse.json(
          { error: 'Your trial period has expired. Please upgrade to continue.' },
          { status: 403 }
        );
      }
    }

    // Create a project for this quote request
    const projectName = `Demande de cotation - ${new Date().toLocaleDateString('fr-FR')}`;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        user_id: userId,
        source: 'public_quote_request',
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    // Insert materials into the project
    const materialsToInsert = materials.map((mat: any) => ({
      project_id: project.id,
      name: mat.name,
      description: mat.description || null,
      quantity: parseFloat(mat.quantity) || 1,
      unit: mat.unit || 'pièce',
      images: mat.images || [],
      category: 'user_defined',
    }));

    const { data: insertedMaterials, error: materialsError } = await supabase
      .from('materials')
      .insert(materialsToInsert)
      .select();

    if (materialsError) {
      console.error('Error inserting materials:', materialsError);
      // Don't fail, project is created
    }

    // Create a supplier request for this project
    const requestNumber = `QR-${nanoid(8).toUpperCase()}`;
    const publicToken = nanoid(32);

    const { data: supplierRequest, error: requestError } = await supabase
      .from('supplier_requests')
      .insert({
        project_id: project.id,
        user_id: userId,
        request_number: requestNumber,
        status: 'pending',
        materials_data: materialsToInsert,
        total_materials: materials.length,
        public_token: publicToken,
        num_suppliers: 3, // Default to 3 suppliers
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating supplier request:', requestError);
    }

    return NextResponse.json({
      success: true,
      requestId: supplierRequest?.id || project.id,
      projectId: project.id,
      requestNumber: requestNumber,
      message: 'Quote request created successfully',
      materialsCount: materials.length,
      trialEndsAt: userSubscription?.expires_at,
    });

  } catch (error: any) {
    console.error('Error in public quote request:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
