import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/1688/jobs/[jobId]
 * Get job status and results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: job, error } = await supabase
      .from('search_jobs_1688')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Calculate progress percentage
    const progress = job.total_terms > 0
      ? Math.round((job.completed_terms / job.total_terms) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        totalTerms: job.total_terms,
        completedTerms: job.completed_terms,
        failedTerms: job.failed_terms,
        currentTerm: job.current_term,
        progress,
        errorMessage: job.error_message,
        results: job.status === 'completed' ? job.results : null,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
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
 * DELETE /api/1688/jobs/[jobId]
 * Cancel a pending or running job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Only cancel pending or running jobs
    const { data: job, error: fetchError } = await supabase
      .from('search_jobs_1688')
      .select('status')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'pending' && job.status !== 'running') {
      return NextResponse.json(
        { error: `Cannot cancel job with status: ${job.status}` },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('search_jobs_1688')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Error cancelling job' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job cancelled',
    });
  } catch (error: any) {
    console.error('[1688 Jobs] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
