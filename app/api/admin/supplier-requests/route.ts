import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    // Log environment variables (without exposing values)
    console.log('Environment check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
    });

    const supabase = createServiceClient();

    const { data: requests, error } = await supabase
      .from('supplier_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Enrichir avec les données des projets et utilisateurs
    const enrichedRequests = await Promise.all(
      (requests || []).map(async (request) => {
        // Récupérer le projet
        const { data: project } = await supabase
          .from('projects' as any)
          .select('id, name')
          .eq('id', request.project_id)
          .single();

        // Récupérer l'utilisateur depuis auth.users
        const { data: user } = await supabase.auth.admin.getUserById(request.user_id);

        return {
          ...request,
          projects: project,
          users: user?.user ? {
            id: user.user.id,
            email: user.user.email,
            full_name: user.user.user_metadata?.full_name || user.user.email,
          } : null,
        };
      })
    );

    return NextResponse.json({ data: enrichedRequests });
  } catch (error: any) {
    console.error('Error in supplier-requests API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
