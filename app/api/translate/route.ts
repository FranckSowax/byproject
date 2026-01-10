import { NextRequest, NextResponse } from 'next/server';
import { completeText } from '@/lib/ai/clients';

// Configuration pour Netlify
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

interface TranslationRequest {
  text: string;
  targetLanguage: 'en' | 'zh' | 'fr';
  sourceLanguage?: 'fr' | 'en' | 'zh';
  context?: string;
}

const languageMap: Record<string, string> = {
  fr: 'French',
  en: 'English',
  zh: 'Simplified Chinese',
};

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage, sourceLanguage, context }: TranslationRequest = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    const source = sourceLanguage || 'fr';

    // Skip translation if source and target are the same
    if (source === targetLanguage) {
      return NextResponse.json({
        translatedText: text,
        originalText: text,
        targetLanguage,
      });
    }

    const systemPrompt = `You are a professional translator specializing in construction and building materials. Translate the following text from ${languageMap[source]} to ${languageMap[targetLanguage]}. Maintain technical accuracy and use appropriate construction terminology. Return ONLY the translated text, nothing else. ${context ? `Context: ${context}` : ''}`;

    const translatedText = await completeText(
      text,
      systemPrompt,
      { temperature: 0.2, maxTokens: 2000 }
    );

    return NextResponse.json({
      translatedText: translatedText.trim(),
      originalText: text,
      targetLanguage,
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Batch translation for multiple materials
export async function PUT(request: NextRequest) {
  try {
    const { materials, targetLanguage }: { materials: any[]; targetLanguage: 'en' | 'zh' } = await request.json();

    if (!materials || !Array.isArray(materials) || !targetLanguage) {
      return NextResponse.json(
        { error: 'Materials array and target language are required' },
        { status: 400 }
      );
    }

    // Process materials in batches of 5 to avoid timeouts
    const BATCH_SIZE = 5;
    const translations: any[] = [];

    for (let i = 0; i < materials.length; i += BATCH_SIZE) {
      const batch = materials.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (material) => {
          try {
            const textToTranslate = `Material: ${material.name}\nDescription: ${material.description || ''}\nCategory: ${material.category || ''}`;

            const systemPrompt = targetLanguage === 'zh'
              ? 'You are a professional translator specializing in construction materials. Translate the following material information from French to Simplified Chinese. Keep technical terms accurate. Return ONLY the translated text in the same format (Material: ..., Description: ..., Category: ...).'
              : 'You are a professional translator specializing in construction materials. Translate the following material information from French to English. Keep technical terms accurate. Return ONLY the translated text in the same format (Material: ..., Description: ..., Category: ...).';

            const translated = await completeText(
              textToTranslate,
              systemPrompt,
              { temperature: 0.2, maxTokens: 1000 }
            );

            // Parse the translated response
            const lines = translated.split('\n');
            const translatedName = lines.find(l => l.match(/^Material:/i))?.replace(/^Material:\s*/i, '').trim() || material.name;
            const translatedDescription = lines.find(l => l.match(/^Description:/i))?.replace(/^Description:\s*/i, '').trim() || material.description;

            return {
              ...material,
              translatedName,
              translatedDescription,
              originalName: material.name,
              originalDescription: material.description,
            };
          } catch (error) {
            console.error(`Translation error for material ${material.id}:`, error);
            return {
              ...material,
              translatedName: material.name,
              translatedDescription: material.description,
              translationError: true,
            };
          }
        })
      );

      translations.push(...batchResults);
    }

    return NextResponse.json({ translations });
  } catch (error: any) {
    console.error('Batch translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
