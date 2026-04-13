import { NextRequest, NextResponse } from 'next/server';
import { translateWithKimi, translateBatchWithKimi } from '@/lib/services/kimi-service';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * POST /api/marketplace/kimi/translate
 * Traduction via Kimi AI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts, source_lang = 'zh', target_lang = 'fr' } = body;

    // Single text translation
    if (text) {
      const translated = await translateWithKimi(text, source_lang, target_lang);
      return NextResponse.json({ data: { translated } });
    }

    // Batch translation
    if (texts && Array.isArray(texts)) {
      const translated = await translateBatchWithKimi(texts, target_lang);
      return NextResponse.json({ data: { translated } });
    }

    return NextResponse.json({ error: 'text ou texts requis' }, { status: 400 });
  } catch (error: any) {
    console.error('Kimi translate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
