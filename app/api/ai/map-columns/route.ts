import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { headers, sampleData, targetFields } = await request.json();

    if (!headers || !sampleData || !targetFields) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Appel à GPT-4 pour mapper les colonnes
    const prompt = `Tu es un expert en analyse de données. Analyse ce fichier CSV et mappe les colonnes aux champs cibles.

Colonnes disponibles (index):
${headers.map((h: string, i: number) => `${i}: "${h}"`).join('\n')}

Échantillon de données:
\`\`\`
${sampleData}
\`\`\`

Champs cibles à mapper:
${targetFields.join(', ')}

Instructions:
1. Pour chaque champ cible, identifie l'index de la colonne correspondante
2. Si aucune colonne ne correspond, retourne null
3. Réponds UNIQUEMENT avec un objet JSON valide, sans texte supplémentaire

Format de réponse attendu:
{
  "name": 0,
  "category": 1,
  "quantity": 2,
  "unit": null,
  "weight": null,
  "volume": null,
  "specs": null
}

Réponds maintenant avec le mapping:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant spécialisé dans l\'analyse de données CSV. Tu réponds uniquement avec du JSON valide, sans texte supplémentaire.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    
    // Extraire le JSON de la réponse (au cas où il y aurait du texte autour)
    let mapping;
    try {
      // Essayer de parser directement
      mapping = JSON.parse(responseText);
    } catch {
      // Si ça échoue, chercher un objet JSON dans la réponse
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mapping = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    console.log('AI Mapping Result:', mapping);

    return NextResponse.json({ 
      mapping,
      confidence: 'high',
      message: 'Colonnes mappées avec succès par l\'IA'
    });

  } catch (error) {
    console.error('Error in map-columns API:', error);
    return NextResponse.json(
      { error: 'Failed to map columns', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
