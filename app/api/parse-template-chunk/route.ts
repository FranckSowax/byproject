import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as XLSX from 'xlsx';

// Initialize Gemini with Flash model for speed and efficiency
// Using gemini-1.5-flash as requested (it's the current efficient "Gemini 3" class model)
const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  
  const genAI = new GoogleGenerativeAI(apiKey);
  // Configure for JSON output
  return genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { fileUrl, chunkIndex, totalChunks, fileType } = await request.json();
    
    // Check if Gemini is configured
    const model = getGeminiModel();
    if (!model) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }
    
    if (!fileUrl) {
      return NextResponse.json({ error: 'URL fichier manquante' }, { status: 400 });
    }

    // Download file content
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return NextResponse.json({ error: 'Erreur téléchargement fichier' }, { status: 500 });
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer);
    
    // Note: We process the WHOLE file if possible to ensure context integrity,
    // especially for PDFs and Excels where binary chunking breaks the format.
    // However, if the file is huge, we might need to respect chunking logic.
    // For now, we assume fileUrl points to the specific file/chunk we want to process.
    // If the frontend sends the same URL for all chunks, we should only process it once (chunk 0).
    
    let promptParts: any[] = [];
    const basePrompt = `Tu es un expert en estimation de construction et analyse de devis.
    Ton rôle est d'extraire TOUS les matériaux, équipements et fournitures mentionnés dans le document pour créer une liste quantitative (Bordereau Quantitatif Estimatif).

    INSTRUCTIONS STRICTES :
    1. Analyse le document fourni (image, PDF ou données texte).
    2. Identifie chaque article qui est un matériau de construction, un équipement ou une fourniture.
    3. Ignore les textes administratifs, les clauses juridiques ou les totaux généraux.
    4. Pour chaque article, extrais :
       - name: Le nom précis du matériau
       - description: Les détails techniques, dimensions, références (concatène tout ce qui est pertinent)
       - quantity: La quantité numérique (convertis en nombre, par défaut 1 si non précisé mais implicite)
       - unit: L'unité (m2, m3, kg, t, u, pce, ens, ml, etc.)
       - category: Une catégorie suggérée (Gros Oeuvre, Second Oeuvre, Plomberie, Electricité, Finitions, etc.)

    FORMAT DE SORTIE ATTENDU (JSON) :
    Retourne un tableau d'objets JSON. Exemple :
    [
      { "name": "Ciment CPJ 45", "description": "Sac de 50kg", "quantity": 100, "unit": "sac", "category": "Gros Oeuvre" },
      { "name": "Sable", "description": "Sable fin de rivière", "quantity": 15, "unit": "m3", "category": "Gros Oeuvre" }
    ]
    `;

    promptParts.push(basePrompt);

    // Handle different file types
    if (fileType === 'application/pdf') {
      // PDF Processing via Gemini Vision/Multimodal
      const base64Data = fileContent.toString('base64');
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf"
        }
      });
    } 
    else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType === 'text/csv') {
      // Excel/CSV Processing
      // Parse with XLSX to get text content, as Gemini inlineData doesn't support .xlsx mime type directly yet
      const workbook = XLSX.read(fileContent, { type: 'buffer' });
      let csvContent = '';
      
      // Read all sheets
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        csvContent += `Sheet: ${sheetName}\n`;
        csvContent += XLSX.utils.sheet_to_csv(sheet);
        csvContent += '\n---\n';
      });
      
      promptParts.push(`Voici le contenu du fichier Excel/CSV :\n${csvContent}`);
    }
    else if (fileType.startsWith('image/')) {
      // Image Processing
      const base64Data = fileContent.toString('base64');
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: fileType
        }
      });
    }
    else {
      // Fallback text processing
      const textContent = fileContent.toString('utf-8');
      promptParts.push(`Voici le contenu du fichier texte :\n${textContent}`);
    }

    // Generate content with Gemini
    const result = await model.generateContent(promptParts);
    const response = result.response;
    const text = response.text();

    // Parse JSON output
    let materials = [];
    try {
      // Clean up markdown code blocks if present (Gemini sometimes wraps JSON in ```json ... ```)
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      materials = JSON.parse(cleanedText);
      
      // Ensure it's an array
      if (!Array.isArray(materials) && materials.data) {
        materials = materials.data;
      }
      if (!Array.isArray(materials)) {
        materials = [materials];
      }
    } catch (e) {
      console.error('Error parsing Gemini response:', e);
      console.log('Raw Gemini response:', text);
      // Try to recover specific format
      return NextResponse.json({ error: 'Erreur de formatage IA', raw: text }, { status: 500 });
    }

    return NextResponse.json({
      materials,
      chunkIndex, // Echo back for compatibility
      totalChunks
    });

  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json({ error: 'Erreur parsing: ' + (error as Error).message }, { status: 500 });
  }
}
