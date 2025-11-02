import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialiser OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialiser Supabase avec service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { projectId, filePath, fileName } = await request.json();

    if (!projectId || !filePath) {
      return NextResponse.json(
        { error: 'Project ID and file path are required' },
        { status: 400 }
      );
    }

    // 1. Télécharger le fichier depuis Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('project-files')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      );
    }

    // 2. Convertir le fichier en texte (selon le type)
    const fileText = await extractTextFromFile(fileData, fileName);

    if (!fileText) {
      return NextResponse.json(
        { error: 'Failed to extract text from file' },
        { status: 500 }
      );
    }

    // 3. Analyser avec GPT-4o
    const analysis = await analyzeWithGPT4(fileText, fileName);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Failed to analyze file with AI' },
        { status: 500 }
      );
    }

    // 4. Sauvegarder le mapping dans la base de données
    const { error: mappingError } = await supabase
      .from('column_mappings')
      .insert({
        project_id: projectId,
        ai_mapping: analysis.mapping,
        user_mapping: null,
      });

    if (mappingError) {
      console.error('Mapping save error:', mappingError);
      return NextResponse.json(
        { error: 'Failed to save mapping' },
        { status: 500 }
      );
    }

    // 5. Créer les matériaux détectés
    if (analysis.materials && analysis.materials.length > 0) {
      const materialsToInsert = analysis.materials.map((material: any) => ({
        project_id: projectId,
        name: material.name,
        category: material.category || null,
        quantity: material.quantity || null,
        specs: material.specs || null,
      }));

      const { error: materialsError } = await supabase
        .from('materials')
        .insert(materialsToInsert);

      if (materialsError) {
        console.error('Materials insert error:', materialsError);
      }
    }

    // 6. Mettre à jour le statut du projet
    const { error: updateError } = await supabase
      .from('projects')
      .update({ mapping_status: 'completed' })
      .eq('id', projectId);

    if (updateError) {
      console.error('Project update error:', updateError);
    }

    return NextResponse.json({
      success: true,
      mapping: analysis.mapping,
      materialsCount: analysis.materials?.length || 0,
      message: 'File analyzed successfully',
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fonction pour extraire le texte selon le type de fichier
async function extractTextFromFile(file: Blob, fileName: string): Promise<string | null> {
  try {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      // Pour CSV, lire directement le texte
      return await file.text();
    }

    if (fileExtension === 'txt') {
      return await file.text();
    }

    // Pour PDF et Excel, on retourne un placeholder pour l'instant
    // TODO: Implémenter pdf-parse et xlsx
    if (fileExtension === 'pdf') {
      return `[PDF File: ${fileName}]\nPDF parsing will be implemented with pdf-parse library.`;
    }

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      return `[Excel File: ${fileName}]\nExcel parsing will be implemented with xlsx library.`;
    }

    return null;
  } catch (error) {
    console.error('Text extraction error:', error);
    return null;
  }
}

// Fonction pour analyser avec GPT-4o
async function analyzeWithGPT4(fileContent: string, fileName: string) {
  try {
    const prompt = `Tu es un expert en analyse de fichiers de matériaux de construction. 
Analyse ce fichier et identifie:

1. Les colonnes présentes (nom, quantité, prix, unité, catégorie, etc.)
2. Les matériaux/équipements listés
3. La structure des données

Fichier: ${fileName}

Contenu:
${fileContent.substring(0, 4000)} // Limiter à 4000 caractères

Réponds au format JSON strict suivant:
{
  "mapping": {
    "columns": [
      {"original": "nom de la colonne dans le fichier", "mapped": "name|quantity|price|unit|category|specs", "confidence": 0.95}
    ],
    "detected_format": "csv|excel|pdf",
    "has_headers": true|false
  },
  "materials": [
    {
      "name": "Nom du matériau",
      "category": "Catégorie",
      "quantity": 10,
      "specs": {"key": "value"}
    }
  ],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant expert en analyse de fichiers de matériaux de construction. Tu réponds toujours en JSON valide."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(response);

  } catch (error) {
    console.error('GPT-4 analysis error:', error);
    return null;
  }
}
