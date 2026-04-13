import { NextRequest, NextResponse } from 'next/server';
import { searchTaobaoByKeyword, searchTaobaoByImage } from '@/lib/services/taobao-service';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * POST /api/marketplace/taobao/search
 * Recherche Taobao par mot-clé ou image
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, image_url, max_results = 10 } = body;

    if (!keyword && !image_url) {
      return NextResponse.json(
        { error: 'keyword ou image_url requis' },
        { status: 400 }
      );
    }

    let result;
    if (image_url) {
      result = await searchTaobaoByImage(image_url, { maxResults: max_results });
    } else {
      result = await searchTaobaoByKeyword(keyword, { maxResults: max_results });
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Taobao search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
