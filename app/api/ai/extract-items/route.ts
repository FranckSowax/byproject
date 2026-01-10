import { NextRequest, NextResponse } from 'next/server';
import { completeJSON } from '@/lib/ai/clients';

// Configuration pour Netlify
export const maxDuration = 20; // 20 secondes max
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { chunkContent, sector, chunkIndex, totalChunks } = await request.json();

    if (!chunkContent) {
      return NextResponse.json({ error: 'Chunk content required' }, { status: 400 });
    }

    console.log(`🧩 Processing chunk ${chunkIndex + 1}/${totalChunks} (${chunkContent.length} chars)`);

    const prompt = `Tu es un expert en extraction de données pour le secteur "${sector}".
    
CONTENU À ANALYSER (Partie ${chunkIndex + 1}/${totalChunks}):
\`\`\`
${chunkContent}
\`\`\`

TA MISSION:
1. Extrais CHAQUE ligne qui contient un matériau ou article.
2. Ignore les en-têtes de pages ou totaux si ce ne sont pas des articles.
3. Crée des catégories logiques pour le BTP.

FORMAT JSON ATTENDU (sans markdown):
{
  "items": [
    {
      "name": "Nom du matériau",
      "description": "Détails ou null",
      "category": "Catégorie BTP",
      "quantity": 10,
      "unit": "u"
    }
  ],
  "categories": ["Catégorie 1"]
}`;

    try {
      console.log('🧠 Extracting items with unified client (DeepSeek > Gemini > OpenAI)...');

      const systemPrompt = 'Tu es un expert extraction BTP. Réponds UNIQUEMENT en JSON valide.';

      const result = await completeJSON<{ items: Array<{ name: string; description?: string; category: string; quantity?: number; unit?: string }>; categories: string[] }>(
        prompt,
        systemPrompt,
        { temperature: 0.1, maxTokens: 4000 }
      );

      const usedModel = `${result.provider}/${result.model}`;
      console.log(`✅ Extraction completed with ${usedModel}`);

      return NextResponse.json({
        success: true,
        items: result.data.items || [],
        categories: result.data.categories || [],
        model: usedModel
      });
    } catch (error) {
      console.error(`❌ AI extraction error for chunk ${chunkIndex + 1}:`, error);
      return NextResponse.json({ success: false, items: [], error: "AI extraction failed" });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
