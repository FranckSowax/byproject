import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/projects/[id]/materials
 * Récupère les matériaux d'un projet
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: materials, error } = await supabase
      .from('materials')
      .select('id, name, description, quantity, unit, specs')
      .eq('project_id', projectId)
      .order('name');

    if (error) {
      console.error('[Materials API] Error:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des matériaux' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: materials || [],
      count: materials?.length || 0,
    });
  } catch (error: any) {
    console.error('[Materials API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
