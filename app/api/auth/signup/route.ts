import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, whatsapp, language, isFreemium } = body;

    console.log('Signup request received:', { email, fullName, isFreemium });

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, mot de passe et nom complet sont requis' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Create user in Supabase Auth using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for freemium flow
      user_metadata: {
        full_name: fullName,
        preferred_language: language || 'fr',
        whatsapp: whatsapp || '',
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      if (authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      );
    }

    console.log('Auth user created:', authData.user.id);

    // 2. Create user in users table
    // Note: hashed_password is required by schema but we use Supabase Auth for actual auth
    // We store a placeholder since the real password is managed by Supabase Auth
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        hashed_password: 'SUPABASE_AUTH_MANAGED', // Placeholder - actual auth is via Supabase Auth
        preferred_language: language || 'fr',
        role_id: 3, // Reader par défaut
      })
      .select()
      .single();

    if (userError) {
      console.error('User table error:', userError);
      // This is critical - we need the user in the users table for FK constraints
      // Try to delete the auth user and fail
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil utilisateur: ' + userError.message },
        { status: 500 }
      );
    }
    console.log('User created in users table:', userData?.id);

    // 3. Create subscription - Free plan: 1 project, 15 materials max, no expiration
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: authData.user.id,
        plan: 'Free',
        project_limit: 1,         // 1 projet maximum
        export_limit: 15,         // 15 matériaux maximum
        expires_at: null,         // Pas d'expiration
      });

    if (subscriptionError) {
      console.error('Subscription error:', subscriptionError);
      // Don't fail
    } else {
      console.log('Subscription created');
    }

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      message: 'Compte créé avec succès',
    });

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
