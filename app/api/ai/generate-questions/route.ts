import { NextRequest, NextResponse } from 'next/server';
import { completeJSON } from '@/lib/ai/clients';

export async function POST(request: NextRequest) {
  try {
    const { missionDescription, context } = await request.json();

    if (!missionDescription) {
      return NextResponse.json(
        { error: 'La description de la mission est requise' },
        { status: 400 }
      );
    }

    const systemPrompt = `Tu es un consultant expert en missions diplomatiques et grands projets de construction internationaux (BTP, Infrastructure).
Ton rôle est d'analyser une demande de mission pour une délégation officielle et de poser les questions les plus pertinentes pour structurer leur voyage et leur projet.

Objectif : Générer exactement 10 questions stratégiques et logistiques pour préparer une offre de "SaaS en marque blanche" et l'organisation du voyage (Factory Tour).

Les questions doivent couvrir :
1. La nature technique du projet
2. Le profil de la délégation (VIP, technique, politique)
3. Les attentes logistiques (Hébergement, Sécurité, Transport)
4. Les objectifs de la visite (Signature, Contrôle qualité, Sourcing)

Format de réponse attendu : JSON uniquement, tableau de chaînes de caractères.
Exemple : {"questions": ["Quel est le budget estimatif ?", "Combien de personnes composent la délégation ?"]}`;

    const userPrompt = `Voici la description de la mission : "${missionDescription}".
${context ? `Contexte supplémentaire : ${context}` : ''}

Génère les 10 questions les plus pertinentes maintenant.`;

    console.log('🧠 Generating questions with unified client (DeepSeek > Gemini > OpenAI)...');

    const result = await completeJSON<{ questions?: string[]; list?: string[] }>(
      userPrompt,
      systemPrompt,
      { temperature: 0.7, maxTokens: 2000 }
    );

    console.log(`✅ Questions generated with ${result.provider}/${result.model}`);

    // S'assurer qu'on renvoie un tableau de questions
    const questions = result.data.questions || result.data.list || Object.values(result.data)[0];

    return NextResponse.json({ questions });

  } catch (error: any) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération des questions' },
      { status: 500 }
    );
  }
}
