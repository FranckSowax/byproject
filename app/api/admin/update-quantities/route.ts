import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    const { projectName, userEmail, multiplier } = await request.json();

    if (!projectName || !userEmail || !multiplier) {
      return NextResponse.json(
        { error: 'projectName, userEmail, et multiplier sont requis' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Trouver l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: `Utilisateur non trouvé: ${userEmail}` },
        { status: 404 }
      );
    }

    // 2. Trouver le projet
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .eq('user_id', user.id)
      .ilike('name', `%${projectName}%`)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: `Projet non trouvé: ${projectName} pour l'utilisateur ${userEmail}` },
        { status: 404 }
      );
    }

    // 3. Récupérer les matériaux AVANT mise à jour
    const { data: materialsBefore, error: fetchError } = await supabase
      .from('materials')
      .select('id, name, category, quantity')
      .eq('project_id', project.id)
      .order('name');

    if (fetchError) {
      return NextResponse.json(
        { error: `Erreur lors de la récupération des matériaux: ${fetchError.message}` },
        { status: 500 }
      );
    }

    // 4. Mettre à jour les quantités
    const { error: updateError } = await supabase.rpc('multiply_quantities', {
      p_project_id: project.id,
      p_multiplier: multiplier
    });

    // Si la fonction RPC n'existe pas, utiliser une approche alternative
    if (updateError) {
      // Mise à jour manuelle de chaque matériau
      const updatePromises = materialsBefore?.map(async (material) => {
        if (material.quantity !== null) {
          return supabase
            .from('materials')
            .update({ quantity: material.quantity * multiplier })
            .eq('id', material.id);
        }
        return null;
      }) || [];

      await Promise.all(updatePromises.filter(Boolean));
    }

    // 5. Récupérer les matériaux APRÈS mise à jour
    const { data: materialsAfter, error: afterError } = await supabase
      .from('materials')
      .select('id, name, category, quantity')
      .eq('project_id', project.id)
      .order('name');

    if (afterError) {
      return NextResponse.json(
        { error: `Erreur lors de la vérification: ${afterError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${materialsAfter?.length || 0} matériaux mis à jour (quantités × ${multiplier})`,
      project: {
        id: project.id,
        name: project.name
      },
      user: {
        id: user.id,
        email: user.email
      },
      materialsUpdated: materialsAfter?.length || 0,
      before: materialsBefore,
      after: materialsAfter
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
