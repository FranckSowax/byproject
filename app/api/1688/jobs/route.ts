import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/1688/jobs
 * Create a new background search job
 *
 * Body:
 * - projectId?: string - ID du projet (récupère les matériaux)
 * - supplierRequestId?: string - ID de la demande fournisseur
 * - searchTerms?: string[] - Liste des termes à rechercher
 * - options?: { maxResults?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, supplierRequestId, searchTerms: providedTerms, options = {} } = body;

    const supabase = createServiceClient();
    let searchTerms: string[] = providedTerms || [];

    // Si un projectId est fourni, récupérer les matériaux
    if (projectId && searchTerms.length === 0) {
      const { data: materials, error } = await supabase
        .from('materials')
        .select('name, description')
        .eq('project_id', projectId);

      if (error) {
        console.error('[1688 Jobs] Error fetching materials:', error);
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des matériaux' },
          { status: 500 }
        );
      }

      if (!materials || materials.length === 0) {
        return NextResponse.json(
          { error: 'Aucun matériau trouvé pour ce projet' },
          { status: 404 }
        );
      }

      searchTerms = materials.map((m) => {
        if (m.description) {
          return `${m.name} ${m.description}`.trim();
        }
        return m.name;
      });
    }

    if (searchTerms.length === 0) {
      return NextResponse.json(
        { error: 'Aucun terme de recherche fourni' },
        { status: 400 }
      );
    }

    // Limite à 50 termes par job
    if (searchTerms.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 termes de recherche par job' },
        { status: 400 }
      );
    }

    console.log(`[1688 Jobs] Creating job with ${searchTerms.length} search terms`);

    // Créer le job en base
    const { data: job, error: jobError } = await supabase
      .from('search_jobs_1688')
      .insert({
        project_id: projectId || null,
        supplier_request_id: supplierRequestId || null,
        search_terms: searchTerms,
        options: options,
        total_terms: searchTerms.length,
        status: 'pending',
      })
      .select()
      .single();

    if (jobError) {
      console.error('[1688 Jobs] Error creating job:', jobError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du job' },
        { status: 500 }
      );
    }

    console.log(`[1688 Jobs] Job created: ${job.id}`);

    // Déclencher la fonction background Netlify
    const netlifyFunctionUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || ''}/.netlify/functions/search-1688-background`;

    try {
      // Fire and forget - don't wait for the response
      fetch(netlifyFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      }).catch((err) => {
        console.error('[1688 Jobs] Error triggering background function:', err);
      });
    } catch (triggerError) {
      console.error('[1688 Jobs] Error triggering background function:', triggerError);
      // Don't fail - the job is created, it can be retried
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        totalTerms: job.total_terms,
        createdAt: job.created_at,
      },
    });
  } catch (error: any) {
    console.error('[1688 Jobs] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/1688/jobs
 * List jobs (with optional filters)
 *
 * Query params:
 * - projectId?: string
 * - supplierRequestId?: string
 * - status?: string
 * - limit?: number (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const supplierRequestId = searchParams.get('supplierRequestId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const supabase = createServiceClient();

    let query = supabase
      .from('search_jobs_1688')
      .select('id, status, total_terms, completed_terms, failed_terms, current_term, error_message, created_at, started_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    if (supplierRequestId) {
      query = query.eq('supplier_request_id', supplierRequestId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('[1688 Jobs] Error fetching jobs:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des jobs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobs: jobs || [],
    });
  } catch (error: any) {
    console.error('[1688 Jobs] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
