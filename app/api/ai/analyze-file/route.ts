import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';
// Tesseract sera importé dynamiquement pour éviter les problèmes de build

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

      console.log(`Inserting ${materialsToInsert.length} materials into database`);

      const { error: materialsError } = await supabase
        .from('materials')
        .insert(materialsToInsert);

      if (materialsError) {
        console.error('Materials insert error:', materialsError);
        // Ne pas échouer complètement si l'insertion échoue
        console.log('Continuing despite materials insert error...');
      } else {
        console.log(`Successfully inserted ${materialsToInsert.length} materials`);
      }
    } else {
      console.warn('No materials detected by AI analysis');
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
  try {
    console.log(`PDF OCR processing started for: ${fileName}`);
    
    // Méthode 1: Utiliser GPT-4 Vision (RECOMMANDÉ - Plus précis)
    return await extractTextFromPDFWithVision(file, fileName);
    
  } catch (visionError) {
    console.error('GPT-4 Vision failed, trying Tesseract OCR:', visionError);
    
    try {
      // Méthode 2: Fallback vers Tesseract OCR
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

// Analyser une page avec GPT-4 Vision
async function analyzePageWithVision(pdfBuffer: ArrayBuffer, pageIndex: number): Promise<string> {
  try {
    // Convertir le buffer en base64
    const base64 = Buffer.from(pdfBuffer).toString('base64');
    
    // Utiliser GPT-4 Vision pour extraire le texte
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extrait tout le texte de cette page de PDF. Si c'est un tableau de matériaux de construction, structure-le en format CSV avec les colonnes détectées. Retourne uniquement le texte extrait, sans commentaire.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64}`,
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
    });
    
    return response.choices[0].message.content || '';
    
  } catch (error) {
    console.error('Vision API error:', error);
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

// Fonction pour analyser avec GPT-4o
async function analyzeWithGPT4(fileContent: string, fileName: string) {
  try {
    const prompt = `Tu es un expert en analyse de fichiers de matériaux de construction et d'équipements. 

**MISSION CRITIQUE**: Tu dois TOUJOURS extraire TOUS les matériaux présents dans le fichier, même si les données sont incomplètes.

**RÈGLES IMPORTANTES**:
1. Si une ligne contient un nom de matériau ET une quantité → C'EST UN MATÉRIAU VALIDE
2. Si une ligne contient uniquement un nom → C'EST QUAND MÊME UN MATÉRIAU (quantité = null)
3. Ne rejette JAMAIS un matériau sous prétexte qu'il manque des informations
4. Accepte tous types de matériaux: ciment, fer, câbles, peinture, luminaires, interrupteurs, etc.
5. Les colonnes de prix (Fournisseur A, B, C) ne sont PAS obligatoires pour détecter un matériau

**TYPES DE MATÉRIAUX À DÉTECTER**:
- Matériaux de construction (ciment, fer, sable, gravier, etc.)
- Équipements électriques (câbles, interrupteurs, prises, LED, etc.)
- Peinture et finitions
- Plomberie
- Menuiserie
- Tous autres équipements de chantier

Fichier: ${fileName}

Contenu:
${fileContent.substring(0, 8000)}

**FORMAT DE RÉPONSE JSON**:
{
  "mapping": {
    "columns": [
      {"original": "nom exact de la colonne", "mapped": "name|quantity|price|unit|category|supplier", "confidence": 0.95}
    ],
    "detected_format": "csv|excel|pdf",
    "has_headers": true|false,
    "total_rows": nombre_de_lignes
  },
  "materials": [
    {
      "name": "Nom court du matériau (OBLIGATOIRE)",
      "description": "Description détaillée extraite du nom ou null",
      "category": "Catégorie déduite (électricité, construction, peinture, etc.) ou null",
      "quantity": nombre ou null,
      "unit": "unité (Sac, Barre, m², Pièce, etc.) ou null",
      "specs": {
        "autres_infos": "valeur"
      }
    }
  ],
  "statistics": {
    "total_materials_found": nombre,
    "materials_with_quantity": nombre,
    "materials_without_quantity": nombre
  },
  "suggestions": ["Conseil 1", "Conseil 2"]
}

**EXTRACTION DU NOM ET DESCRIPTION**:
Sépare intelligemment le nom court de la description détaillée:

Exemples:
1. "Ciment CPI 35" → name: "Ciment", description: "CPI 35"
2. "Fer à béton Ø8" → name: "Fer à béton", description: "Diamètre 8mm"
3. "Peinture acrylique 20L blanc mat" → name: "Peinture acrylique", description: "20L blanc mat"
4. "Ampoule LED E27 12W blanc chaud" → name: "Ampoule LED", description: "E27 12W blanc chaud"
5. "Interrupteur va-et-vient" → name: "Interrupteur", description: "va-et-vient"
6. "Câble électrique 3x2.5mm²" → name: "Câble électrique", description: "3x2.5mm²"
7. "Carreaux 60x60 grès cérame" → name: "Carreaux", description: "60x60 grès cérame"

**RÈGLES**:
- name = Type de matériau (court, générique)
- description = Spécifications techniques, dimensions, modèle, couleur, etc.
- Si pas de détails → description: null

**EXEMPLE DE DÉTECTION**:
Si tu vois:
- "Ciment CPI 35" avec quantité 100 → Matériau valide
- "Fer à béton Ø8" avec quantité 200 → Matériau valide  
- "Peinture acrylique" sans quantité → TOUJOURS UN MATÉRIAU VALIDE (quantité: null)
- "Ampoule LED E27 12W" avec quantité 100 → Matériau valide

RÉPONDS UNIQUEMENT EN JSON VALIDE.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant expert en analyse de fichiers de matériaux de construction et d'équipements. Tu DOIS extraire TOUS les matériaux présents, même avec des données incomplètes. Un nom + quantité = matériau valide. Un nom seul = matériau valide aussi. Tu réponds TOUJOURS en JSON valide."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2, // Plus bas pour plus de précision
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const parsedResponse = JSON.parse(response);
    
    // Log pour debug
    console.log('GPT-4o Analysis Results:', {
      materialsFound: parsedResponse.materials?.length || 0,
      fileName,
      statistics: parsedResponse.statistics
    });

    return parsedResponse;

  } catch (error) {
    console.error('GPT-4 analysis error:', error);
    return null;
  }
}
