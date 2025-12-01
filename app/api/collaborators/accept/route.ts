import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { projectId } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Trouver l'invitation pour cet utilisateur
    const { data: invitation, error: findError } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('email', user.email?.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (findError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation non trouvée' },
        { status: 404 }
      );
    }

    // Accepter l'invitation
    const { error: updateError } = await supabase
      .from('project_collaborators')
      .update({
        status: 'accepted',
        user_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) throw updateError;

    // Notifier le propriétaire du projet
    const { data: project } = await supabase
      .from('projects')
      .select('name, user_id')
      .eq('id', projectId)
      .single();

    if (project) {
      await supabase.from('notifications').insert({
        user_id: project.user_id,
        type: 'collaboration_accepted',
        title: 'Invitation acceptée',
        message: `${user.email} a accepté votre invitation pour "${project.name}"`,
        data: { projectId, email: user.email },
        link: `/dashboard/projects/${projectId}`,
        icon: 'check-circle',
        color: 'green',
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    );
  }
}
