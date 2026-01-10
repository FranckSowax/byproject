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
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        preferred_language: language || 'fr',
        role_id: 3, // Reader par défaut
      });

    if (userError) {
      console.error('User table error:', userError);
      // Don't fail - user can still login
    } else {
      console.log('User created in users table');
    }

    // 3. Create subscription
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 15); // 15 days

    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: authData.user.id,
        plan: isFreemium ? 'Trial' : 'Free',
        project_limit: 5,
        export_limit: isFreemium ? 10 : 2,
        expires_at: isFreemium ? trialEndDate.toISOString() : null,
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
