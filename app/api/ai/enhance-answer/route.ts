import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.OPENAI_API_KEY ? undefined : 'https://api.deepseek.com/v1',
});

export async function POST(request: NextRequest) {
  try {
    const { question, answer, context } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question et réponse sont requises' },
        { status: 400 }
      );
    }

    const systemPrompt = `Tu es un expert consultant en BTP et missions internationales. 
Ton objectif est d'améliorer la réponse d'un client (délégation officielle) pour qu'elle soit plus professionnelle, précise et complète.

Règles :
1. Garde le sens original de la réponse.
2. Utilise un ton professionnel et institutionnel.
3. Ajoute des détails techniques pertinents si le contexte s'y prête.
4. Corrige les fautes et la syntaxe.
5. Ne sois pas trop verbeux, reste concret.

Retourne UNIQUEMENT le texte amélioré, sans introduction ni guillemets.`;

    const userPrompt = `Contexte de la mission : "${context}"
    
Question posée : "${question}"

Réponse (brouillon) de l'utilisateur : "${answer}"

Améliore cette réponse :`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // ou deepseek-chat
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    });

    const enhancedText = response.choices[0].message.content;

    return NextResponse.json({ enhancedAnswer: enhancedText });

  } catch (error: any) {
    console.error('Error enhancing answer:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'amélioration' },
      { status: 500 }
    );
  }
}
