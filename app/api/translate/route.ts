import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = 'sk-5d0d9534cc734cccb8117b270e28cae7';

interface TranslationRequest {
  text: string;
  targetLanguage: 'en' | 'zh';
  context?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage, context }: TranslationRequest = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    const systemPrompt = targetLanguage === 'zh'
      ? `You are a professional translator specializing in construction and building materials. Translate the following text from French to Simplified Chinese. Maintain technical accuracy and use appropriate construction terminology. ${context ? `Context: ${context}` : ''}`
      : `You are a professional translator specializing in construction and building materials. Translate the following text from French to English. Maintain technical accuracy and use appropriate construction terminology. ${context ? `Context: ${context}` : ''}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DeepSeek API error:', error);
      return NextResponse.json(
        { error: 'Translation service error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content || '';

    return NextResponse.json({
      translatedText,
      originalText: text,
      targetLanguage,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const translations = await Promise.all(
      materials.map(async (material) => {
        const textToTranslate = `Material: ${material.name}\nDescription: ${material.description || ''}\nCategory: ${material.category || ''}`;
        
        const systemPrompt = targetLanguage === 'zh'
          ? 'You are a professional translator specializing in construction materials. Translate the following material information from French to Simplified Chinese. Keep technical terms accurate. Return ONLY the translated text in the same format (Material: ..., Description: ..., Category: ...).'
          : 'You are a professional translator specializing in construction materials. Translate the following material information from French to English. Keep technical terms accurate. Return ONLY the translated text in the same format (Material: ..., Description: ..., Category: ...).';

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: textToTranslate },
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          return {
            ...material,
            translatedName: material.name,
            translatedDescription: material.description,
            translationError: true,
          };
        }

        const data = await response.json();
        const translated = data.choices[0]?.message?.content || '';
        
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
      })
    );

    return NextResponse.json({ translations });
  } catch (error) {
    console.error('Batch translation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
