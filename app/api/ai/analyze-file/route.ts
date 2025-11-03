import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';

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

    // CSV et TXT - Lecture directe
    if (fileExtension === 'csv' || fileExtension === 'txt') {
      return await file.text();
    }

    // Excel - Parsing avec xlsx
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      return await extractTextFromExcel(file);
    }

    // PDF - Parsing avec pdf-parse (import dynamique)
    if (fileExtension === 'pdf') {
      return await extractTextFromPDF(file, fileName);
    }

    return null;
  } catch (error) {
    console.error('Text extraction error:', error);
    return null;
  }
}

// Fonction pour extraire le texte d'un fichier Excel
async function extractTextFromExcel(file: Blob): Promise<string> {
  try {
    // Convertir le Blob en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Lire le fichier Excel
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Prendre la première feuille
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convertir en CSV pour faciliter l'analyse
    const csvText = XLSX.utils.sheet_to_csv(worksheet);
    
    // Alternative: Convertir en JSON pour une structure plus riche
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Retourner le CSV avec quelques métadonnées
    return `Fichier Excel - Feuille: ${firstSheetName}
Nombre de lignes: ${jsonData.length}

Données:
${csvText}`;
  } catch (error) {
    console.error('Excel extraction error:', error);
    throw new Error('Erreur lors de l\'extraction du fichier Excel');
  }
}

// Fonction pour extraire le texte d'un fichier PDF
async function extractTextFromPDF(file: Blob, fileName: string): Promise<string> {
  // Note: pdf-parse a des problèmes de compatibilité ESM avec Next.js
  // Pour l'instant, nous recommandons d'utiliser Excel ou CSV
  // Une alternative serait d'utiliser une API externe comme PDF.co ou Adobe PDF Services
  
  console.warn(`PDF parsing attempted for: ${fileName}`);
  
  return `📄 Fichier PDF détecté: ${fileName}

🔄 Conversion Recommandée

Pour une meilleure analyse, veuillez convertir votre PDF en:
• Excel (.xlsx) - Recommandé ✅
• CSV (.csv) - Recommandé ✅
• Texte (.txt)

💡 Outils de conversion gratuits:
• Adobe Acrobat Reader (Export to Excel)
• Google Drive (Ouvrir avec Google Sheets)
• Convertisseurs en ligne: pdf2excel.com, ilovepdf.com

⚡ Pourquoi Excel/CSV ?
• Meilleure détection des colonnes
• Préservation de la structure des données
• Analyse IA plus précise
• Support complet des formules

📊 Une fois converti, uploadez le fichier Excel ou CSV pour une analyse automatique complète.`;
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
