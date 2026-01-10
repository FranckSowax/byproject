import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { materials, userId } = body;

    console.log('Quote request received:', { materialsCount: materials?.length, userId });

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json(
        { error: 'La liste des matériaux est requise', message: 'La liste des matériaux est requise' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise', message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // Try to get user from auth.users using admin API
    let authUserEmail: string | undefined;
    let authUserMetadata: any = {};

    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (!authError && authUser?.user) {
        authUserEmail = authUser.user.email;
        authUserMetadata = authUser.user.user_metadata || {};
        console.log('Auth user found:', authUserEmail);
      } else {
        console.log('Auth user lookup failed, continuing anyway:', authError?.message);
      }
    } catch (adminError) {
      console.log('Admin API not available, continuing without user verification');
    }

    // Check if user exists in users table, if not create them
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.log('User not in users table, creating...', userError?.message);
      // Try to create user in users table
      // Note: hashed_password is required by schema but we use Supabase Auth
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUserEmail || `user-${userId.slice(0, 8)}@temp.local`,
          full_name: authUserMetadata?.full_name || 'Utilisateur',
          hashed_password: 'SUPABASE_AUTH_MANAGED', // Placeholder - actual auth is via Supabase Auth
          preferred_language: authUserMetadata?.preferred_language || 'fr',
          role_id: 3, // Reader par défaut
        })
        .select()
        .single();

      if (createUserError) {
        console.error('Error creating user in users table:', createUserError);
        return NextResponse.json(
          { error: 'Erreur: impossible de créer le profil utilisateur. ' + createUserError.message, message: 'Erreur de création du profil' },
          { status: 500 }
        );
      } else {
        userData = newUser;
        console.log('User created in users table');
      }
    } else {
      console.log('User found in users table:', userData.email);
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
          { error: 'Votre période d\'essai a expiré. Veuillez mettre à niveau pour continuer.', message: 'Votre période d\'essai a expiré. Veuillez mettre à niveau pour continuer.' },
          { status: 403 }
        );
      }
    }

    // Create a project for this quote request
    const projectName = `Demande de cotation - ${new Date().toLocaleDateString('fr-FR')}`;
    console.log('Creating project:', projectName, 'for user:', userId);

    // First try with source field, then without if it fails
    let project: any = null;
    let projectError: any = null;

    // Try inserting with source field first
    const { data: projectData, error: projectErr } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        user_id: userId,
      } as any)
      .select()
      .single();

    if (projectErr) {
      console.error('Error creating project:', projectErr);
      return NextResponse.json(
        { error: 'Erreur lors de la création du projet: ' + projectErr.message, message: 'Erreur lors de la création du projet' },
        { status: 500 }
      );
    }

    project = projectData;
    console.log('Project created successfully:', project.id);

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
      { error: error.message || 'Erreur interne du serveur', message: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
