import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
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

    // Execute all count queries in parallel
    const [
      { count: usersCount },
      { count: projectsCount },
      { count: templatesCount },
      { count: supplierRequestsCount },
      { count: materialsCount },
      { count: activeCount },
      { count: completedCount }
    ] = await Promise.all([
      supabaseAdmin.from('users' as any).select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('templates').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('supplier_requests').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('materials').select('*', { count: 'exact', head: true }),
      // Active requests (pending, sent, in_progress)
      supabaseAdmin.from('supplier_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'sent', 'in_progress']),
      // Completed requests
      supabaseAdmin.from('supplier_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
    ]);

    return NextResponse.json({
      totalUsers: usersCount || 0,
      totalProjects: projectsCount || 0,
      totalTemplates: templatesCount || 0,
      totalSupplierRequests: supplierRequestsCount || 0,
      totalMaterials: materialsCount || 0,
      activeRequests: activeCount || 0,
      completedRequests: completedCount || 0,
      recentActivity: 0 // Placeholder
    });

  } catch (error: any) {
    console.error('Error loading admin stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
