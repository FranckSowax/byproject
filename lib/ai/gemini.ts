import Replicate from "replicate";

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Types for Gemini 3 Pro
export interface GeminiInput {
  prompt: string;
  images?: string[];
  videos?: string[];
  audio?: string;
  system_instruction?: string;
  thinking_level?: "low" | "high";
  temperature?: number;
  top_p?: number;
  max_output_tokens?: number;
}

export interface GeminiOptions {
  stream?: boolean;
}

/**
 * Call Gemini 3 Pro via Replicate API
 * @param input - The input parameters for the model
 * @param options - Additional options (streaming, etc.)
 * @returns The model response as a string
 */
export async function callGemini3Pro(
  input: GeminiInput,
  options: GeminiOptions = {}
): Promise<string> {
  const modelInput = {
    prompt: input.prompt,
    images: input.images || [],
    videos: input.videos || [],
    audio: input.audio,
    system_instruction: input.system_instruction,
    thinking_level: input.thinking_level || "low",
    temperature: input.temperature ?? 1,
    top_p: input.top_p ?? 0.95,
    max_output_tokens: input.max_output_tokens ?? 65535,
  };

  if (options.stream) {
    // Streaming mode
    let result = "";
    for await (const event of replicate.stream("google/gemini-3-pro", { input: modelInput })) {
      result += event;
    }
    return result;
  } else {
    // Non-streaming mode
    const output = await replicate.run("google/gemini-3-pro", { input: modelInput });
    if (Array.isArray(output)) {
      return output.join("");
    }
    return String(output);
  }
}

/**
 * Analyze a file (image, PDF, etc.) with Gemini 3 Pro
 * Optimized for document analysis with sector context
 */
export async function analyzeFileWithGemini(
  fileUrl: string,
  prompt: string,
  sectorContext?: string
): Promise<string> {
  const systemInstruction = sectorContext
    ? `Tu es un assistant spécialisé dans l'analyse de documents pour le secteur: ${sectorContext}. 
       Analyse les documents avec précision et adapte ton vocabulaire et tes catégories au secteur spécifié.
       Réponds toujours en français.`
    : `Tu es un assistant spécialisé dans l'analyse de documents professionnels.
       Analyse les documents avec précision et structure.
       Réponds toujours en français.`;

  // Determine file type from URL
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl);
  const isVideo = /\.(mp4|mov|avi|webm)$/i.test(fileUrl);
  const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(fileUrl);

  const input: GeminiInput = {
    prompt,
    system_instruction: systemInstruction,
    thinking_level: "high", // Use high thinking for document analysis
    temperature: 0.3, // Lower temperature for more precise analysis
  };

  if (isImage) {
    input.images = [fileUrl];
  } else if (isVideo) {
    input.videos = [fileUrl];
  } else if (isAudio) {
    input.audio = fileUrl;
  } else {
    // For PDFs and other documents, include URL in prompt
    input.prompt = `Document URL: ${fileUrl}\n\n${prompt}`;
  }

  return callGemini3Pro(input);
}

/**
 * Map columns from a file using Gemini 3 Pro
 * Sector-aware column mapping for intelligent data structuring
 */
export async function mapColumnsWithGemini(
  columns: string[],
  sampleData: Record<string, string>[],
  sectorName: string,
  customSectorName?: string
): Promise<{
  mappings: Record<string, string>;
  suggestions: string[];
  categories: string[];
}> {
  const sector = customSectorName || sectorName;
  
  const prompt = `Tu es un expert en structuration de données pour le secteur "${sector}".

Voici les colonnes d'un fichier importé:
${columns.map((c, i) => `${i + 1}. "${c}"`).join("\n")}

Voici un échantillon des données (3 premières lignes):
${JSON.stringify(sampleData.slice(0, 3), null, 2)}

Ta tâche:
1. Propose un mapping intelligent des colonnes vers des champs standards:
   - name: Nom du produit/article
   - category: Catégorie
   - quantity: Quantité
   - unit: Unité de mesure
   - description: Description
   - reference: Référence/SKU
   - price: Prix unitaire
   - specs: Spécifications techniques

2. Suggère des catégories pertinentes pour ce secteur "${sector}"

3. Identifie les colonnes qui pourraient être ignorées

Réponds en JSON avec ce format exact:
{
  "mappings": {
    "nom_colonne_originale": "champ_standard"
  },
  "suggestions": ["suggestion 1", "suggestion 2"],
  "categories": ["catégorie 1", "catégorie 2", "catégorie 3"]
}`;

  const response = await callGemini3Pro({
    prompt,
    system_instruction: `Tu es un assistant de mapping de données. Réponds uniquement en JSON valide, sans markdown ni explication.`,
    thinking_level: "high",
    temperature: 0.2,
  });

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found in response");
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return {
      mappings: {},
      suggestions: ["Vérifiez manuellement le mapping des colonnes"],
      categories: [],
    };
  }
}

/**
 * Generate smart suggestions based on sector
 */
export async function generateSectorSuggestions(
  sectorName: string,
  customSectorName?: string,
  context?: string
): Promise<string[]> {
  const sector = customSectorName || sectorName;
  
  const prompt = `Pour le secteur "${sector}", génère 5 suggestions pratiques pour optimiser un projet de sourcing.
${context ? `Contexte additionnel: ${context}` : ""}

Réponds avec une liste JSON de 5 suggestions courtes et actionnables.
Format: ["suggestion 1", "suggestion 2", ...]`;

  const response = await callGemini3Pro({
    prompt,
    thinking_level: "low",
    temperature: 0.7,
  });

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    return [];
  }
}
