import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { fileUrl, chunkIndex, totalChunks, fileType } = await request.json();
    
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
    
    // Calculate chunk boundaries
    const chunkSize = 5 * 1024 * 1024; // 5MB
    const startByte = chunkIndex * chunkSize;
    const endByte = Math.min(startByte + chunkSize, fileContent.length);
    const chunk = fileContent.slice(startByte, endByte);
    
    // Convert chunk to base64 for AI processing
    const chunkBase64 = chunk.toString('base64');
    
    // Determine parsing strategy based on file type
    let extractedText = '';
    
    if (fileType === 'application/pdf') {
      // For PDF, use OpenAI vision or PDF parsing
      extractedText = await parsePDFChunk(chunkBase64, chunkIndex, totalChunks);
    } else if (fileType.includes('spreadsheet') || fileType === 'text/csv') {
      // For Excel/CSV
      extractedText = await parseSpreadsheetChunk(chunkBase64, chunkIndex, totalChunks);
    } else if (fileType.includes('wordprocessingml')) {
      // For DOCX
      extractedText = await parseDocxChunk(chunkBase64, chunkIndex, totalChunks);
    }
    
    // Use AI to extract materials from text
    const materials = await extractMaterialsWithAI(extractedText, chunkIndex, totalChunks);
    
    return NextResponse.json({
      materials,
      chunkIndex,
      totalChunks
    });

  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json({ error: 'Erreur parsing' }, { status: 500 });
  }
}

async function parsePDFChunk(base64Data: string, chunkIndex: number, totalChunks: number): Promise<string> {
  // Use OpenAI to extract text from PDF chunk
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Tu es un assistant spécialisé dans l\'extraction de texte de documents PDF. Extrais tout le texte lisible du document.'
      },
      {
        role: 'user',
        content: `Extrait le texte de ce chunk PDF (${chunkIndex + 1}/${totalChunks}). Retourne uniquement le texte extrait sans commentaires.`
      }
    ],
    max_tokens: 4000
  });
  
  return completion.choices[0]?.message?.content || '';
}

async function parseSpreadsheetChunk(base64Data: string, chunkIndex: number, totalChunks: number): Promise<string> {
  // Simple text extraction for spreadsheets
  // In production, use a library like xlsx or csv-parse
  const buffer = Buffer.from(base64Data, 'base64');
  return buffer.toString('utf-8');
}

async function parseDocxChunk(base64Data: string, chunkIndex: number, totalChunks: number): Promise<string> {
  // Simple text extraction for DOCX
  // In production, use mammoth.js or similar
  const buffer = Buffer.from(base64Data, 'base64');
  return buffer.toString('utf-8');
}

async function extractMaterialsWithAI(text: string, chunkIndex: number, totalChunks: number) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en extraction de listes de matériaux de construction depuis des documents.
          
Ton rôle est d'extraire TOUS les matériaux mentionnés dans le texte et de les structurer.

Pour chaque matériau trouvé, retourne un objet JSON avec:
- name: nom du matériau (string)
- description: description ou spécifications (string, optionnel)
- quantity: quantité numérique si mentionnée, sinon 1 (number)
- unit: unité de mesure (m², kg, unité, m³, etc.) (string)

Retourne UNIQUEMENT un array JSON de matériaux, sans texte additionnel.

Exemples de matériaux : ciment, sable, gravier, fer à béton, briques, carrelage, peinture, etc.`
        },
        {
          role: 'user',
          content: `Extrait tous les matériaux de ce chunk (${chunkIndex + 1}/${totalChunks}):\n\n${text.substring(0, 15000)}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return [];
    
    // Parse JSON response
    const parsed = JSON.parse(content);
    
    // Handle different response formats
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.materials && Array.isArray(parsed.materials)) {
      return parsed.materials;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      return parsed.data;
    }
    
    return [];
    
  } catch (error) {
    console.error('AI extraction error:', error);
    // Fallback: try basic extraction
    return extractMaterialsBasic(text);
  }
}

function extractMaterialsBasic(text: string) {
  // Fallback basic extraction without AI
  // Look for common material keywords
  const keywords = ['ciment', 'sable', 'gravier', 'fer', 'brique', 'carrelage', 'peinture', 'béton'];
  const materials: any[] = [];
  
  keywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      materials.push({
        name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        description: '',
        quantity: 1,
        unit: 'unité'
      });
    }
  });
  
  return materials;
}
