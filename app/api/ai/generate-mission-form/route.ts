import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import OpenAI from 'openai';

// Initialisation des clients
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const useGemini = !!process.env.REPLICATE_API_TOKEN;

interface MissionFormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'file' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  helpText?: string;
  category: string;
}

interface MissionFormSection {
  id: string;
  title: string;
  description?: string;
  fields: MissionFormField[];
}

export async function POST(request: NextRequest) {
  try {
    const { missionContext, sector, country, teamSize, objectives } = await request.json();

    if (!missionContext) {
      return NextResponse.json(
        { error: 'Le contexte de la mission est requis' },
        { status: 400 }
      );
    }

    const systemPrompt = `Tu es un expert en gestion de missions officielles et projets d'approvisionnement internationaux.
Ton rôle est de générer un formulaire dynamique et personnalisé pour collecter toutes les informations nécessaires à la réussite d'une mission.

Le formulaire doit être adapté au contexte spécifique de la mission et couvrir :
1. Les informations générales de la mission
2. Les spécifications techniques des matériaux/équipements recherchés
3. Les exigences logistiques (transport, stockage, livraison)
4. Les critères de qualité et certifications
5. Le budget et les conditions de paiement
6. Le calendrier et les délais

Tu dois générer un JSON structuré avec des sections et des champs de formulaire.

Format de réponse OBLIGATOIRE (JSON uniquement) :
{
  "formTitle": "Titre du formulaire",
  "formDescription": "Description courte",
  "sections": [
    {
      "id": "section_id",
      "title": "Titre de la section",
      "description": "Description optionnelle",
      "fields": [
        {
          "id": "field_id",
          "type": "text|textarea|number|select|date|file|checkbox|radio",
          "label": "Label du champ",
          "placeholder": "Texte d'aide",
          "required": true|false,
          "options": [{"value": "val", "label": "Label"}], // Pour select/radio
          "helpText": "Aide contextuelle",
          "category": "general|technical|logistics|quality|budget|timeline"
        }
      ]
    }
  ],
  "suggestedMaterials": ["Liste de matériaux suggérés basés sur le contexte"]
}`;

    const userPrompt = `Génère un formulaire de mission personnalisé pour le contexte suivant :

CONTEXTE DE LA MISSION :
${missionContext}

SECTEUR D'ACTIVITÉ : ${sector || 'Non spécifié'}
PAYS DE DESTINATION : ${country || 'Non spécifié'}
TAILLE DE L'ÉQUIPE : ${teamSize || 'Non spécifié'} personnes
OBJECTIFS : ${objectives || 'Non spécifiés'}

Génère un formulaire complet et pertinent pour cette mission. Le formulaire doit être pratique et permettre de collecter toutes les informations nécessaires pour :
1. Identifier précisément les besoins en matériaux/équipements
2. Définir les critères de sélection des fournisseurs
3. Planifier la logistique d'approvisionnement
4. Établir le budget prévisionnel

Réponds UNIQUEMENT avec le JSON structuré.`;

    let responseText = '';

    if (useGemini) {
      // Utiliser Gemini 3 Pro via Replicate
      const output = await replicate.run("google/gemini-3-pro", {
        input: {
          prompt: userPrompt,
          system_instruction: systemPrompt,
          temperature: 0.7,
          max_output_tokens: 8000,
          thinking_level: "low"
        }
      });

      responseText = Array.isArray(output) ? output.join("") : String(output);
    } else {
      // Fallback sur OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    }

    // Parser le JSON de la réponse
    // Nettoyer la réponse si elle contient des balises markdown
    let cleanedResponse = responseText;
    if (cleanedResponse.includes('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (cleanedResponse.includes('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }

    const formData = JSON.parse(cleanedResponse.trim());

    return NextResponse.json({
      success: true,
      form: formData,
      provider: useGemini ? 'gemini' : 'openai'
    });

  } catch (error: any) {
    console.error('Error generating mission form:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du formulaire' },
      { status: 500 }
    );
  }
}
