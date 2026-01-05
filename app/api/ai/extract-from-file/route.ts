import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { Buffer } from 'buffer';

// Configuration pour Netlify - timeout étendu pour les gros fichiers
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Timeout pour les appels API (25 secondes pour laisser du temps au reste)
const API_TIMEOUT_MS = 25000;

// ... (keep SECTOR_CATEGORIES and helper functions as is) ...

// Fonction d'extraction PDF robuste (Serveur)
async function extractTextFromPdfServer(buffer: Buffer): Promise<string> {
  console.log('🔄 Tentative extraction PDF serveur...');
  
  // Outil 1: pdf-parse (Extraction de texte native)
  try {
    console.log('🛠️ Outil 1: pdf-parse');
    // Import dynamique pour éviter les erreurs de build/runtime
    // @ts-ignore
    const pdfParseLib = await import('pdf-parse');
    const pdfParse = (pdfParseLib as any).default || pdfParseLib;
    
    const data = await pdfParse(buffer);
    const text = data.text;
    
    // Vérifier si le texte est suffisant (pas un scan)
    if (text && text.trim().length > 50) {
      console.log(`✅ pdf-parse succès: ${text.length} caractères`);
      return text;
    }
    console.log('⚠️ pdf-parse: texte trop court ou vide (PDF scanné ?)');
  } catch (e) {
    console.error('❌ Erreur pdf-parse:', e);
  }

  // Outil 2: Gemini 2.0 Flash Vision (Multimodal)
  try {
    console.log('🛠️ Outil 2: Gemini 2.0 Flash Vision');
    const gemini = getGeminiClient();
    if (!gemini) throw new Error('Clé API Gemini manquante');

    const model = gemini.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192, // Large context for full text
      }
    });

    const base64Data = buffer.toString('base64');
    
    // Prompt optimisé pour l'OCR
    const result = await withTimeout(
      model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: "Tu es un moteur OCR haute précision. Extrais TOUT le texte lisible de ce document PDF. Conserve la structure, les listes et les tableaux. Ne donne AUCUN commentaire, juste le texte brut." },
            {
              inlineData: {
                data: base64Data,
                mimeType: 'application/pdf'
              }
            }
          ]
        }]
      }),
      45000, // Timeout plus long pour Vision
      'Gemini Vision timeout'
    );

    const text = result.response.text();
    if (text && text.length > 0) {
      console.log(`✅ Gemini Vision succès: ${text.length} caractères`);
      return text;
    }
  } catch (e) {
    console.error('❌ Erreur Gemini Vision:', e);
  }

  throw new Error('Échec de toutes les méthodes d\'extraction PDF');
}

// ... (keep extractFromCSV and extractFromText functions as is) ...

export async function POST(request: NextRequest) {
  console.log('📂 === EXTRACT-FROM-FILE API CALLED ===');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const textContent = formData.get('textContent') as string | null;
    const fileType = formData.get('fileType') as string || 'unknown';
    const sector = formData.get('sector') as string || 'btp';

    console.log(`📋 Received: fileType=${fileType}, sector="${sector}", textLength=${textContent?.length || 0}`);

    let content = textContent || '';
    let detectedType = fileType.toLowerCase();

    // Si un fichier est fourni, lire son contenu
    if (file) {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.csv')) {
        detectedType = 'csv';
        content = await file.text();
      } else if (fileName.endsWith('.txt')) {
        detectedType = 'txt';
        content = await file.text();
      } else if (fileName.endsWith('.pdf')) {
        detectedType = 'pdf';
        
        // Stratégie hybride: Client > pdf-parse > Vision
        if (!content) {
          console.log('⚠️ Pas de contenu texte client, bascule sur extraction serveur...');
          try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            content = await extractTextFromPdfServer(buffer);
          } catch (e) {
            console.error('❌ Échec extraction serveur:', e);
            return NextResponse.json({
              error: 'Impossible de lire le PDF. Veuillez réessayer ou utiliser un fichier texte/Excel.',
              details: e instanceof Error ? e.message : 'Unknown error'
            }, { status: 400 });
          }
        }
      } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        detectedType = 'doc';
        // Pour DOC/DOCX, le contenu doit être extrait côté client (mammoth est lourd côté serveur)
        if (!textContent) {
          return NextResponse.json({
            error: 'Pour les fichiers Word, veuillez extraire le texte côté client',
            hint: 'Utilisez mammoth.js pour les fichiers .docx'
          }, { status: 400 });
        }
      }
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json({
        error: 'Contenu insuffisant pour extraction',
        received: content?.length || 0
      }, { status: 400 });
    }

    console.log(`📁 Processing ${detectedType} file: ${content.length} chars`);

    let result;

    // Choisir la méthode d'extraction selon le type
    if (detectedType === 'csv') {
      result = await extractFromCSV(content, sector);
    } else {
      // TXT, PDF (texte extrait), DOC (texte extrait)
      result = await extractFromText(content, sector, detectedType);
    }

    console.log(`✅ Extracted ${result.items.length} items via ${result.method}`);

    return NextResponse.json({
      success: true,
      ...result,
      fileType: detectedType
    });

  } catch (error) {
    console.error('❌ Extraction error:', error);
    return NextResponse.json({
      error: 'Erreur lors de l\'extraction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
