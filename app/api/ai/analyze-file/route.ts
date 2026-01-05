import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';
// @ts-ignore
import pdfParse from 'pdf-parse';
import { Buffer } from 'buffer';

// Configuration
export const maxDuration = 60; // 60 secondes max
export const dynamic = 'force-dynamic';

// Timeout pour les appels API
const API_TIMEOUT_MS = 25000;

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

// Client Gemini 2.0 Flash (principal)
const getGeminiClient = () => {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

// Initialiser DeepSeek (fallback)
const getDeepSeekClient = () => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com/v1',
  });
};

// Initialiser Supabase avec service role
const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// Catégories par secteur
const SECTOR_CATEGORIES: Record<string, string[]> = {
  'btp': [
    'Gros œuvre & Matériaux',
    'Électricité',
    'Plomberie & Sanitaire',
    'Menuiserie & Bois',
    'Peinture & Finitions',
    'Carrelage & Revêtements',
    'Quincaillerie & Fixations',
    'Outillage & Équipement',
    'Sécurité & Protection (EPI)',
    'Transport & Levage',
    'Installation de chantier',
    'Divers',
  ],
  'import': [
    'Électronique & High-Tech',
    'Textile & Habillement',
    'Mobilier & Décoration',
    'Équipement industriel',
    'Pièces détachées',
    'Matières premières',
    'Accessoires',
    'Divers',
  ],
  'commerce': [
    'Produits alimentaires',
    'Cosmétiques & Hygiène',
    'Électroménager',
    'Mobilier',
    'Textile',
    'Papeterie & Bureau',
    'Divers',
  ],
  'default': [
    'Équipement',
    'Matériaux',
    'Fournitures',
    'Services',
    'Divers',
  ],
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { projectId, filePath, fileName } = await request.json();

    console.log('📂 === ANALYSE FICHIER DÉMARRÉE ===');
    console.log(`📁 Projet: ${projectId}`);
    console.log(`📄 Fichier: ${fileName}`);
    console.log(`📍 Chemin: ${filePath}`);

    if (!projectId || !filePath) {
      return NextResponse.json(
        { error: 'Project ID and file path are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 0. Récupérer les infos du projet (secteur)
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        sector:sectors(id, name, slug)
      `)
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('❌ Project fetch error:', projectError);
    }

    const sectorSlug = projectData?.sector?.slug || 'default';
    const sectorName = projectData?.sector?.name || 'Général';
    console.log(`🏭 Secteur détecté: ${sectorName} (${sectorSlug})`);

    // 1. Télécharger le fichier depuis Supabase Storage
    console.log('📥 Téléchargement du fichier...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('project-files')
      .download(filePath);

    if (downloadError) {
      console.error('❌ Download error:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      );
    }

    console.log(`✅ Fichier téléchargé: ${fileData.size} bytes`);

    // 2. Convertir le fichier en texte (selon le type)
    console.log('📝 Extraction du texte...');
    const fileText = await extractTextFromFile(fileData, fileName);

    if (!fileText) {
      console.error('❌ Échec extraction texte');
      return NextResponse.json(
        { error: 'Failed to extract text from file' },
        { status: 500 }
      );
    }

    console.log(`✅ Texte extrait: ${fileText.length} caractères`);
    console.log('📄 Aperçu du texte:');
    console.log(fileText.substring(0, 500));
    console.log('...');

    // 3. Analyser avec l'IA (en passant le secteur)
    console.log('🤖 Analyse IA en cours...');
    const analysis = await analyzeWithAI(fileText, fileName, sectorSlug, sectorName);

    if (!analysis) {
      console.error('❌ Échec analyse IA');
      return NextResponse.json(
        { error: 'Failed to analyze file with AI' },
        { status: 500 }
      );
    }

    console.log(`✅ Analyse IA terminée: ${analysis.materials?.length || 0} matériaux détectés`);
    console.log('📊 Catégories détectées:', [...new Set(analysis.materials?.map((m: any) => m.category) || [])]);

    // 4. Sauvegarder le mapping dans la base de données
    console.log('💾 Sauvegarde du mapping...');
    const { error: mappingError } = await supabase
      .from('column_mappings')
      .insert({
        project_id: projectId,
        ai_mapping: analysis.mapping,
        user_mapping: null,
      });

    if (mappingError) {
      console.error('❌ Mapping save error:', mappingError);
      return NextResponse.json(
        { error: 'Failed to save mapping' },
        { status: 500 }
      );
    }

    // 5. Créer les matériaux détectés
    if (analysis.materials && analysis.materials.length > 0) {
      const materialsToInsert = analysis.materials.map((material: any) => {
        // Enrichir les specs avec l'unité et la description si présentes
        const specs = material.specs || {};

        if (material.description) {
          specs.description = material.description;
        }

        if (material.unit) {
          specs.unit = material.unit;
        }

        return {
          project_id: projectId,
          name: material.name,
          category: material.category || null,
          quantity: material.quantity || null,
          specs: Object.keys(specs).length > 0 ? specs : null,
        };
      });

      console.log(`💾 Insertion de ${materialsToInsert.length} matériaux...`);

      const { error: materialsError } = await supabase
        .from('materials')
        .insert(materialsToInsert);

      if (materialsError) {
        console.error('❌ Materials insert error:', materialsError);
        console.log('⚠️ Continuing despite materials insert error...');
      } else {
        console.log(`✅ ${materialsToInsert.length} matériaux insérés avec succès`);
      }
    } else {
      console.warn('⚠️ Aucun matériau détecté par l\'IA');
    }

    // 6. Mettre à jour le statut du projet
    const { error: updateError } = await supabase
      .from('projects')
      .update({ mapping_status: 'completed' })
      .eq('id', projectId);

    if (updateError) {
      console.error('❌ Project update error:', updateError);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ === ANALYSE TERMINÉE en ${duration}ms ===`);
    console.log(`📊 Résumé: ${analysis.materials?.length || 0} matériaux, modèle: ${analysis.model || 'gpt-4o-mini'}`);

    return NextResponse.json({
      success: true,
      mapping: analysis.mapping,
      materialsCount: analysis.materials?.length || 0,
      categories: [...new Set(analysis.materials?.map((m: any) => m.category) || [])],
      model: analysis.model,
      durationMs: duration,
      message: 'File analyzed successfully',
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
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
    
    // Lire le fichier Excel avec toutes les options pour capturer le maximum de données
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    // Prendre la première feuille
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convertir en CSV pour faciliter l'analyse
    const csvText = XLSX.utils.sheet_to_csv(worksheet, { 
      FS: ',',
      RS: '\n',
      blankrows: false // Ignorer les lignes vides
    });
    
    // Convertir aussi en JSON pour avoir la structure
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '', // Valeur par défaut pour les cellules vides
      blankrows: false,
      raw: false // Convertir tout en texte
    });
    
    // Obtenir les headers (première ligne)
    const headers = jsonData[0] as any[];
    const dataRows = jsonData.slice(1);
    
    // Créer une représentation enrichie
    let enrichedText = `Fichier Excel - Feuille: ${firstSheetName}
Nombre total de lignes: ${jsonData.length}
Nombre de lignes de données: ${dataRows.length}
Colonnes détectées: ${headers.length}

=== EN-TÊTES ===
${headers.map((h, i) => `Colonne ${i + 1}: "${h}"`).join('\n')}

=== APERÇU DES DONNÉES (5 premières lignes) ===
${dataRows.slice(0, 5).map((row: any, i: number) => {
  return `Ligne ${i + 1}: ${headers.map((h: any, j: number) => `${h}="${row[j] || ''}"`).join(' | ')}`;
}).join('\n')}

=== DONNÉES COMPLÈTES (CSV) ===
${csvText}

=== STATISTIQUES ===
- Lignes non vides: ${dataRows.filter((row: any) => row.some((cell: any) => cell && cell.toString().trim())).length}
- Colonnes avec données: ${headers.filter((h: any) => h && h.toString().trim()).length}
`;
    
    console.log('Excel extraction completed:', {
      sheet: firstSheetName,
      totalRows: jsonData.length,
      dataRows: dataRows.length,
      columns: headers.length
    });
    
    return enrichedText;
  } catch (error) {
    console.error('Excel extraction error:', error);
    throw new Error('Erreur lors de l\'extraction du fichier Excel');
  }
}

// Fonction pour extraire le texte d'un fichier PDF avec OCR
async function extractTextFromPDF(file: Blob, fileName: string): Promise<string> {
  // 1. Tentative pdf-parse (rapide & texte natif)
  try {
    console.log('🔄 Tentative extraction PDF native (pdf-parse)...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);
    const text = data.text;

    if (text && text.trim().length > 50) {
      console.log(`✅ pdf-parse succès: ${text.length} caractères`);
      return text;
    }
    console.log('⚠️ pdf-parse: texte insuffisant, bascule sur Vision...');
  } catch (e) {
    console.warn('❌ Erreur pdf-parse:', e);
  }

  try {
    console.log(`PDF OCR processing started for: ${fileName}`);
    
    // Méthode 2: Utiliser GPT-4 Vision (RECOMMANDÉ - Plus précis)
    return await extractTextFromPDFWithVision(file, fileName);
    
  } catch (visionError) {
    console.error('GPT-4 Vision failed, trying Tesseract OCR:', visionError);
    
    try {
      // Méthode 3: Fallback vers Tesseract OCR
      return await extractTextFromPDFWithTesseract(file, fileName);
    } catch (tesseractError) {
      console.error('Tesseract OCR failed:', tesseractError);
      
      // Méthode 3: Guide de conversion (dernier recours)
      return `📄 Fichier PDF détecté: ${fileName}

⚠️ L'extraction automatique a échoué.

🔄 Options disponibles:

1. **Réessayer** - Le PDF peut être trop complexe
2. **Convertir en Excel** - Meilleure qualité d'analyse
3. **Utiliser un OCR externe** - Google Drive, Adobe

💡 Pour de meilleurs résultats:
• Assurez-vous que le PDF contient du texte (pas juste des images)
• Privilégiez les fichiers Excel ou CSV
• Vérifiez que le fichier n'est pas corrompu

Erreurs rencontrées:
- Vision: ${visionError instanceof Error ? visionError.message : 'Erreur inconnue'}
- OCR: ${tesseractError instanceof Error ? tesseractError.message : 'Erreur inconnue'}`;
    }
  }
}

// Méthode 1: GPT-4 Vision pour PDF (RECOMMANDÉ)
async function extractTextFromPDFWithVision(file: Blob, fileName: string): Promise<string> {
  try {
    // Convertir le PDF en images avec pdf-lib
    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF has ${pageCount} pages`);
    
    // Limiter à 5 pages pour éviter les coûts élevés
    const pagesToProcess = Math.min(pageCount, 5);
    
    // Pour chaque page, utiliser GPT-4 Vision
    let extractedText = `Fichier PDF: ${fileName}\nNombre de pages: ${pageCount}\n\n`;
    
    for (let i = 0; i < pagesToProcess; i++) {
      // Note: La conversion PDF → Image nécessite canvas ou sharp
      // Pour simplifier, on utilise directement GPT-4 Vision avec le PDF
      extractedText += `--- Page ${i + 1} ---\n`;
      
      // GPT-4 Vision peut lire directement les PDF
      const pageText = await analyzePageWithVision(arrayBuffer, i);
      extractedText += pageText + '\n\n';
    }
    
    if (pageCount > pagesToProcess) {
      extractedText += `\n⚠️ Seules les ${pagesToProcess} premières pages ont été analysées.\n`;
    }
    
    return extractedText;
    
  } catch (error) {
    console.error('PDF Vision extraction error:', error);
    throw error;
  }
}

// Analyser une page avec Gemini 2.0 Flash Vision
async function analyzePageWithVision(pdfBuffer: ArrayBuffer, pageIndex: number): Promise<string> {
  const gemini = getGeminiClient();
  if (!gemini) {
    return `[Gemini non configuré - page ${pageIndex + 1}]`;
  }

  try {
    // Convertir le buffer en base64
    const base64 = Buffer.from(pdfBuffer).toString('base64');

    const model = gemini.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4000,
      },
    });

    // Utiliser Gemini Vision pour extraire le texte
    const result = await withTimeout(
      model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: `Extrait TOUT le texte de cette page de PDF. Liste CHAQUE élément/matériau sur une ligne séparée. Si c'est un tableau, structure-le en format CSV. Retourne uniquement le texte extrait, sans commentaire.` },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64,
              },
            },
          ],
        }],
      }),
      API_TIMEOUT_MS,
      `Gemini Vision timeout`
    );

    return result.response.text() || '';
  } catch (error: any) {
    console.error('Gemini Vision API error:', error?.message || error);
    return `[Erreur d'extraction pour la page ${pageIndex + 1}]`;
  }
}

// Méthode 2: Tesseract OCR (Fallback)
async function extractTextFromPDFWithTesseract(file: Blob, fileName: string): Promise<string> {
  try {
    // Import dynamique de Tesseract
    const Tesseract = await import('tesseract.js');
    const { PDFDocument } = await import('pdf-lib');
    
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    let extractedText = `Fichier PDF (OCR): ${fileName}\nNombre de pages: ${pageCount}\n\n`;
    
    // Limiter à 3 pages pour Tesseract (plus lent)
    const pagesToProcess = Math.min(pageCount, 3);
    
    for (let i = 0; i < pagesToProcess; i++) {
      extractedText += `--- Page ${i + 1} ---\n`;
      
      // Note: La conversion PDF → Image nécessite une bibliothèque supplémentaire
      // Pour l'instant, on retourne un message
      extractedText += `[OCR Tesseract nécessite une conversion PDF → Image]\n\n`;
    }
    
    return extractedText;
    
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw error;
  }
}

// Fonction pour analyser avec l'IA (Gemini 2.0 Flash + DeepSeek fallback)
async function analyzeWithAI(fileContent: string, fileName: string, sectorSlug: string, sectorName: string) {
  // Récupérer les catégories du secteur
  const categories = SECTOR_CATEGORIES[sectorSlug] || SECTOR_CATEGORIES['default'];

  const systemPrompt = `Tu es un expert en extraction de données pour le secteur ${sectorName}. Tu extrais TOUS les éléments/matériaux présents dans les fichiers. Tu réponds UNIQUEMENT en JSON valide.`;

  const prompt = `Tu es un EXPERT en extraction de données pour le secteur "${sectorName}".

**MISSION CRITIQUE**: Extrais TOUS les éléments/matériaux/articles du fichier ci-dessous.

**CATÉGORIES À UTILISER (EXACTEMENT ces noms)**:
${categories.map(c => `• ${c}`).join('\n')}

**RÈGLES D'EXTRACTION**:
1. Extrais CHAQUE ligne qui contient un élément/matériau/article
2. Un nom seul = élément valide (quantité peut être null)
3. Ignore: en-têtes, totaux, numéros de page, métadonnées
4. Sépare les éléments listés ensemble (ex: "gants, bottes, casques" = 3 items)
5. Corrige les fautes d'orthographe évidentes
6. Catégorise selon le secteur ${sectorName}

**Fichier**: ${fileName}

**Contenu** (${fileContent.length} caractères):
\`\`\`
${fileContent.substring(0, 15000)}
\`\`\`

**FORMAT JSON STRICT**:
{
  "mapping": {
    "columns": [{"original": "colonne", "mapped": "name|quantity|unit", "confidence": 0.9}],
    "detected_format": "pdf|csv|excel",
    "total_rows": 0
  },
  "materials": [
    {
      "name": "Nom court (OBLIGATOIRE)",
      "description": "Détails/specs ou null",
      "category": "Une des catégories listées",
      "quantity": 10,
      "unit": "unité ou null"
    }
  ],
  "statistics": {
    "total_materials_found": 0,
    "by_category": {}
  }
}

RÉPONDS UNIQUEMENT EN JSON VALIDE, sans markdown.`;

  let responseText = '';
  let modelUsed = '';

  // 1. Essayer Gemini 2.0 Flash d'abord (rapide et efficace)
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      console.log('🤖 Tentative avec Gemini 2.0 Flash...');
      const model = gemini.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8000,
          responseMimeType: 'application/json',
        },
      });

      const result = await withTimeout(
        model.generateContent({
          contents: [{
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
          }],
        }),
        API_TIMEOUT_MS,
        `Gemini timeout after ${API_TIMEOUT_MS / 1000}s`
      );

      responseText = result.response.text()?.trim() || '';
      modelUsed = 'gemini-2.0-flash';
      console.log(`✅ Gemini réponse reçue: ${responseText.length} caractères`);
    } catch (error: any) {
      console.error('❌ Gemini error:', error?.message || error);
    }
  }

  // 2. Fallback DeepSeek si Gemini échoue
  if (!responseText) {
    const deepseek = getDeepSeekClient();
    if (deepseek) {
      try {
        console.log('🔄 Fallback vers DeepSeek...');
        const completion = await withTimeout(
          deepseek.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 8000,
          }),
          API_TIMEOUT_MS,
          `DeepSeek timeout after ${API_TIMEOUT_MS / 1000}s`
        );

        responseText = completion.choices[0]?.message?.content?.trim() || '';
        modelUsed = 'deepseek-chat';
        console.log(`✅ DeepSeek réponse reçue: ${responseText.length} caractères`);
      } catch (error: any) {
        console.error('❌ DeepSeek error:', error?.message || error);
      }
    }
  }

  if (!responseText) {
    console.error('❌ Aucun modèle IA disponible');
    return null;
  }

  // Nettoyage et parsing JSON
  try {
    // Retirer les éventuels blocs markdown
    let cleanJson = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '');

    // Trouver le JSON
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Pas de JSON trouvé dans la réponse');
      console.log('Réponse brute:', responseText.substring(0, 500));
      return null;
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);

    // Ajouter le modèle utilisé
    parsedResponse.model = modelUsed;

    console.log('📊 Résultats analyse:', {
      materialsFound: parsedResponse.materials?.length || 0,
      model: modelUsed,
      categories: [...new Set(parsedResponse.materials?.map((m: any) => m.category) || [])],
    });

    return parsedResponse;
  } catch (parseError) {
    console.error('❌ JSON parse error:', parseError);
    console.log('Réponse brute:', responseText.substring(0, 1000));
    return null;
  }
}
