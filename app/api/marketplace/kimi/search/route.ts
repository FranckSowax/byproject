import { NextRequest, NextResponse } from 'next/server';
import { searchKimiFactories } from '@/lib/services/kimi-service';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * POST /api/marketplace/kimi/search
 * Recherche d'usines via Kimi AI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, max_results = 5 } = body;

    if (!query) {
      return NextResponse.json({ error: 'query requis' }, { status: 400 });
    }

    const result = await searchKimiFactories(query, { maxResults: max_results });

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Kimi search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
