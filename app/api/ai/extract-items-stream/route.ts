import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Configuration pour Netlify
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Google Gemini API directe
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Utiliser Gemini si la clé est disponible
const useGemini = !!geminiApiKey;

// Chunks plus petits pour streaming rapide
const MAX_LINES_PER_CHUNK = 30;
const MAX_CHARS_PER_CHUNK = 4000;

interface ExtractedItem {
  name: string;
  description: string | null;
  category: string;
  quantity: number | null;
  unit: string | null;
  specs: Record<string, any>;
}

function splitIntoChunks(fileContent: string): string[] {
  const lines = fileContent.split('\n');
  const headerLine = lines[0];
  const dataLines = lines.slice(1).filter(line => line.trim());
  
  const chunks: string[] = [];
  let currentChunk: string[] = [headerLine];
  let currentChunkSize = headerLine.length;
  
  for (const line of dataLines) {
    const wouldExceedLines = currentChunk.length >= MAX_LINES_PER_CHUNK;
    const wouldExceedChars = currentChunkSize + line.length > MAX_CHARS_PER_CHUNK;
    
    if (wouldExceedLines || wouldExceedChars) {
      if (currentChunk.length > 1) {
        chunks.push(currentChunk.join('\n'));
      }
      currentChunk = [headerLine, line];
      currentChunkSize = headerLine.length + line.length;
    } else {
      currentChunk.push(line);
      currentChunkSize += line.length;
    }
  }
  
  if (currentChunk.length > 1) {
    chunks.push(currentChunk.join('\n'));
  }
  
  return chunks;
}

function buildChunkPrompt(chunk: string, sector: string, chunkNum: number, total: number): string {
  return `Tu es un expert en extraction de données pour le secteur "${sector}".

CHUNK ${chunkNum}/${total} - CONTENU À ANALYSER:
${chunk}

INSTRUCTIONS:
1. Extrais CHAQUE ligne qui contient un matériau, produit ou article
2. Crée des catégories logiques pour le secteur BTP/Construction
3. Récupère les quantités si présentes

RÉPONDS UNIQUEMENT avec ce JSON (sans backticks, sans explication):
{"items":[{"name":"Nom du matériau","description":"Description détaillée ou null","category":"Catégorie BTP","quantity":10,"unit":"unité","specs":{}}],"categories":["Catégorie1","Catégorie2"]}

CATÉGORIES SUGGÉRÉES pour BTP: Plomberie, Électricité, Menuiserie, Peinture, Carrelage, Quincaillerie, Gros œuvre, Second œuvre, Sanitaire, Revêtements

IMPORTANT: Réponds UNIQUEMENT avec le JSON, pas de texte avant ou après.`;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { projectId, fileContent, fileName, sectorName, customSectorName } = await request.json();

        if (!projectId || !fileContent) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: 'Missing data' }) + '\n'));
          controller.close();
          return;
        }

        const sector = customSectorName || sectorName || 'général';
        const chunks = splitIntoChunks(fileContent);
        const totalChunks = chunks.length;
        const modelUsed = 'gpt-4o-mini'; // OpenAI plus fiable pour JSON

        // Envoyer le statut initial
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'start',
          totalChunks,
          model: modelUsed,
          sector
        }) + '\n'));

        const allItems: ExtractedItem[] = [];
        const allCategories = new Set<string>();

        // Traiter chaque chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const chunkNum = i + 1;

          // Envoyer la progression
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'progress',
            chunk: chunkNum,
            total: totalChunks,
            percent: Math.round((chunkNum / totalChunks) * 100)
          }) + '\n'));

          try {
            const prompt = buildChunkPrompt(chunk, sector, chunkNum, totalChunks);
            let responseText: string;

            // Utiliser OpenAI GPT-4o-mini (plus fiable pour l'extraction JSON)
            const completion = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                { 
                  role: 'system', 
                  content: `Tu es un expert en extraction de données pour le secteur "${sector}". 
Tu extrais TOUS les matériaux/articles du contenu fourni.
Tu réponds UNIQUEMENT en JSON valide avec cette structure:
{"items":[{"name":"Nom","description":null,"category":"Catégorie","quantity":1,"unit":"u","specs":{}}],"categories":["Cat1"]}` 
                },
                { role: 'user', content: prompt }
              ],
              temperature: 0.1,
              max_tokens: 4000,
              response_format: { type: "json_object" }
            });
            responseText = completion.choices[0]?.message?.content?.trim() || '{}';
            console.log(`📝 OpenAI response chunk ${chunkNum}:`, responseText.substring(0, 500));

            // Nettoyer la réponse - enlever les backticks markdown si présents
            let cleanedResponse = responseText;
            
            // Enlever ```json ... ``` ou ``` ... ```
            cleanedResponse = cleanedResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
            
            // Chercher le JSON
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
              try {
                const result = JSON.parse(jsonMatch[0]);
                const items = result.items || [];
                const categories = result.categories || [];

                console.log(`✅ Chunk ${chunkNum} parsed: ${items.length} items, ${categories.length} categories`);

                items.forEach((item: ExtractedItem) => {
                  // Valider que l'item a au moins un nom
                  if (item && item.name && item.name.trim()) {
                    const exists = allItems.find(i => i.name.toLowerCase() === item.name.toLowerCase());
                    if (!exists) {
                      allItems.push({
                        name: item.name.trim(),
                        description: item.description || null,
                        category: item.category || 'Non catégorisé',
                        quantity: item.quantity || null,
                        unit: item.unit || null,
                        specs: item.specs || {},
                      });
                    }
                  }
                });
                categories.forEach((cat: string) => {
                  if (cat && cat.trim()) allCategories.add(cat.trim());
                });

                // Envoyer les items extraits de ce chunk
                controller.enqueue(encoder.encode(JSON.stringify({
                  type: 'chunk_result',
                  chunk: chunkNum,
                  itemsCount: items.length,
                  items: items.slice(0, 5)
                }) + '\n'));
              } catch (parseError) {
                console.error(`❌ JSON parse error chunk ${chunkNum}:`, parseError);
                console.error('Raw response:', cleanedResponse.substring(0, 1000));
                controller.enqueue(encoder.encode(JSON.stringify({
                  type: 'chunk_error',
                  chunk: chunkNum,
                  error: 'JSON parse failed'
                }) + '\n'));
              }
            } else {
              console.error(`❌ No JSON found in chunk ${chunkNum}:`, cleanedResponse.substring(0, 500));
              // Envoyer un aperçu de la réponse pour debug
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'chunk_error',
                chunk: chunkNum,
                error: 'No JSON in response',
                preview: cleanedResponse.substring(0, 200)
              }) + '\n'));
            }
          } catch (chunkError) {
            console.error(`❌ Chunk ${chunkNum} error:`, chunkError);
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'chunk_error',
              chunk: chunkNum,
              error: chunkError instanceof Error ? chunkError.message : 'Extraction failed'
            }) + '\n'));
          }
        }

        // Sauvegarder en base
        if (allItems.length > 0) {
          const materialsToInsert = allItems.map(item => ({
            project_id: projectId,
            name: item.name,
            description: item.description,
            category: item.category,
            quantity: item.quantity,
            specs: {
              ...item.specs,
              unit: item.unit,
              extracted_by: modelUsed,
              sector,
            },
          }));

          const { error } = await supabase.from('materials').insert(materialsToInsert);
          if (error) console.error('Insert error:', error);
        }

        // Mettre à jour le statut du projet
        await supabase.from('projects').update({ mapping_status: 'completed' }).eq('id', projectId);

        // Envoyer le résultat final
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'complete',
          success: true,
          model: modelUsed,
          sector,
          items: allItems,
          categories: Array.from(allCategories).sort(),
          statistics: {
            totalItems: allItems.length,
            itemsWithQuantity: allItems.filter(i => i.quantity !== null).length,
            categoriesCount: allCategories.size,
            chunksProcessed: totalChunks,
          }
        }) + '\n'));

      } catch (error) {
        console.error('Stream error:', error);
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }) + '\n'));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
