import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export const maxDuration = 20;
export const dynamic = 'force-dynamic';


const getGoogleGenAIClient = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

export async function POST(request: NextRequest) {
  try {
    const { fileSample, fileName } = await request.json();

    if (!fileSample || !Array.isArray(fileSample)) {
      return NextResponse.json({ error: 'Sample data required' }, { status: 400 });
    }

    console.log(`🧠 Analyzing file structure for: ${fileName}`);

    const prompt = `Tu es un Data Engineer Expert. Tu dois analyser la structure de ce fichier Excel (échantillon des premières lignes).

FICHIER: ${fileName}

ÉCHANTILLON (Ligne 0 à ${fileSample.length - 1}):
\`\`\`json
${JSON.stringify(fileSample)}
\`\`\`

TA MISSION:
1. Identifie l'index de la ligne d'en-tête (header row). C'est la ligne qui contient les titres des colonnes (ex: "Désignation", "Prix", "Qté").
   - Note: Ignore les titres de projet, dates, ou métadonnées au début.
   - Si pas d'en-tête clair, estime la meilleure ligne.

2. Identifie les index des colonnes clés (0-indexed) en cherchant les mots-clés correspondants dans l'en-tête ou les données :
   - name: "Désignation", "Libellé", "Description", "Article", "Matériau"
   - quantity: "Qté", "Quantité", "Nombre", "Qte"
   - unit: "Unité", "U", "Unit"
   - price: "Prix", "PU", "P.U.", "Prix Unitaire"
   - category: "Catégorie", "Lot", "Corps d'état" (souvent absent)
   - ref: "Réf", "Code", "Numéro"

3. Détecte la devise si possible (EUR, XAF, FCFA, $).

FORMAT JSON ATTENDU:
{
  "headerRowIndex": 4,
  "columns": {
    "name": 1,
    "description": 1,
    "quantity": 3,
    "unit": 2,
    "price": 4,
    "category": null,
    "ref": 0
  },
  "confidence": 0.9
}

RÈGLES:
- Si une colonne est introuvable, mets null.
- Réponds UNIQUEMENT en JSON valide.`;

    let responseText = '';
    let usedModel = '';

    // Essayer Gemini d'abord (très bon pour l'analyse structurelle)
    const ai = getGoogleGenAIClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: prompt,
          // Removed thinkingConfig to avoid type errors
        });
        responseText = response.text || '';
        usedModel = 'gemini-3-pro';
      } catch (geminiError) {
        console.error('Gemini structure analysis error:', geminiError);
      }
    }

    // Fallback OpenAI
    const openai = getOpenAIClient();
    if (!responseText && openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un expert en structure de données. Réponds UNIQUEMENT en JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      });
      responseText = completion.choices[0]?.message?.content?.trim() || '{}';
      usedModel = 'gpt-4o-mini';
    }

    // Parsing de la réponse
    let cleanedResponse = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const config = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        success: true,
        config,
        model: usedModel
      });
    } else {
      throw new Error('Invalid JSON response from AI');
    }

  } catch (error) {
    console.error('Structure analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
