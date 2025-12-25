import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Get all projects (bypass RLS)
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // 2. Get all users to map names
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Create a user map for quick lookup
    const userMap = new Map();
    if (users) {
      users.forEach(user => {
        userMap.set(user.id, {
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'Utilisateur',
          email: user.email
        });
      });
    }

    // 3. Enrich projects with user info and material counts
    const enrichedProjects = await Promise.all(projects.map(async (project) => {
      // Get material count for this project
      const { count } = await supabaseAdmin
        .from('materials')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id);

      const userInfo = userMap.get(project.user_id) || { name: 'Utilisateur Inconnu', email: 'N/A' };

      return {
        ...project,
        user_name: userInfo.name,
        user_email: userInfo.email,
        materials_count: count || 0
      };
    }));

    return NextResponse.json(enrichedProjects);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
