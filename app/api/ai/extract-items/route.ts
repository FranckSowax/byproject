import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

// Configuration pour Netlify
export const maxDuration = 20; // 20 secondes max
export const dynamic = 'force-dynamic';

const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    let responseText = '';
    let usedModel = '';

    // Essayer Gemini d'abord
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: prompt,
          config: {
            thinkingConfig: {
              thinkingLevel: "low",
            }
          },
        });
        responseText = response.text || '';
        usedModel = 'gemini-3-pro';
      } catch (geminiError) {
        console.error('Gemini error:', geminiError);
        // Fallback to OpenAI below
      }
    }

    // Si Gemini a échoué ou n'est pas configuré, utiliser OpenAI
    if (!responseText) {
      console.log('🔄 Switching to OpenAI fallback');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un expert extraction BTP. Réponds UNIQUEMENT en JSON valide.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });
      responseText = completion.choices[0]?.message?.content?.trim() || '{}';
      usedModel = 'gpt-4o-mini';
    }
    
    // Nettoyage JSON
    let cleanedResponse = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        success: true,
        items: result.items || [],
        categories: result.categories || [],
        model: usedModel
      });
    } else {
      console.error(`❌ No JSON in response for chunk ${chunkIndex + 1}`);
      return NextResponse.json({ success: false, items: [], error: "No JSON found" });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
