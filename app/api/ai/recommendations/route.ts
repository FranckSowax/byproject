import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateRecommendations, Material } from '@/lib/ai/recommendations';

// Initialiser Supabase avec service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    console.log('🤖 Generating recommendations for project:', projectId);

    // 1. Récupérer tous les matériaux du projet avec leurs prix
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select(`
        id,
        name,
        category,
        quantity,
        specs,
        prices (
          id,
          amount,
          currency,
          supplier_name,
          country
        )
      `)
      .eq('project_id', projectId);

    if (materialsError) {
      console.error('Error fetching materials:', materialsError);
      return NextResponse.json(
        { error: 'Failed to fetch materials' },
        { status: 500 }
      );
    }

    if (!materials || materials.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        message: 'No materials found for this project'
      });
    }

    console.log(`📊 Analyzing ${materials.length} materials...`);

    // 2. Générer les recommandations
    const recommendations = await generateRecommendations(materials as Material[]);

    console.log(`✅ Generated ${recommendations.length} recommendations`);
    console.log('Top 3 recommendations:', recommendations.slice(0, 3).map(r => ({
      title: r.title,
      savings: r.potentialSavings,
      priority: r.priority
    })));

    // 3. Calculer les statistiques
    const totalPotentialSavings = recommendations.reduce((sum, r) => sum + r.potentialSavings, 0);
    const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;

    return NextResponse.json({
      success: true,
      recommendations,
      statistics: {
        totalRecommendations: recommendations.length,
        totalPotentialSavings,
        highPriorityCount,
        byType: {
          alternative: recommendations.filter(r => r.type === 'alternative').length,
          bulk_discount: recommendations.filter(r => r.type === 'bulk_discount').length,
          grouping: recommendations.filter(r => r.type === 'grouping').length,
          quantity_optimization: recommendations.filter(r => r.type === 'quantity_optimization').length,
          timing: recommendations.filter(r => r.type === 'timing').length,
        }
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
