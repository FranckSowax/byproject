# 📦 GUIDE D'EXPORT - PARTIE 2 : API Routes & Composants Avancés

---

## 8. API ROUTES

### `app/api/upload-image/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Utiliser le service role key pour contourner RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const bucket = formData.get('bucket') as string || 'project-materials';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/images/${timestamp}.${fileExt}`;

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      path: fileName,
      publicUrl
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### `app/api/ai/extract-items/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const useGemini = !!process.env.REPLICATE_API_TOKEN;

const MAX_LINES_PER_CHUNK = 100;
const MAX_CHARS_PER_CHUNK = 12000;

interface ExtractedItem {
  name: string;
  description: string | null;
  category: string;
  quantity: number | null;
  unit: string | null;
  specs: Record<string, any>;
}

interface ChunkResult {
  items: ExtractedItem[];
  categories: string[];
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

function mergeChunkResults(results: ChunkResult[]): { items: ExtractedItem[]; categories: string[] } {
  const allItems: ExtractedItem[] = [];
  const allCategories = new Set<string>();
  
  for (const result of results) {
    allItems.push(...result.items);
    result.categories.forEach(cat => allCategories.add(cat));
  }
  
  const uniqueItems = allItems.reduce((acc, item) => {
    const exists = acc.find(i => i.name.toLowerCase() === item.name.toLowerCase());
    if (!exists) {
      acc.push(item);
    }
    return acc;
  }, [] as ExtractedItem[]);
  
  return {
    items: uniqueItems,
    categories: Array.from(allCategories).sort(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, fileContent, fileName, sectorName, customSectorName } = await request.json();

    if (!projectId || !fileContent) {
      return NextResponse.json(
        { error: 'Project ID and file content are required' },
        { status: 400 }
      );
    }

    const sector = customSectorName || sectorName || 'général';
    const chunks = splitIntoChunks(fileContent);
    const totalChunks = chunks.length;
    
    console.log('🚀 Starting extraction...', { projectId, fileName, sector, totalChunks });

    const modelUsed = useGemini ? 'gemini-3-pro' : 'gpt-4o';
    const chunkResults: ChunkResult[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkNumber = i + 1;
      
      const extractionPrompt = buildChunkExtractionPrompt(chunk, fileName, sector, chunkNumber, totalChunks);
      
      let responseText: string;

      try {
        if (useGemini) {
          const geminiInput = {
            prompt: extractionPrompt,
            system_instruction: `Tu es un expert en extraction de données pour le secteur "${sector}". Réponds UNIQUEMENT en JSON valide.`,
            thinking_level: "high" as const,
            temperature: 0.3,
            max_output_tokens: 16000,
          };

          const output = await replicate.run("google/gemini-3-pro", { input: geminiInput });
          responseText = Array.isArray(output) ? output.join("") : String(output);
          
        } else {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `Tu es un expert en extraction de données pour le secteur "${sector}". Réponds UNIQUEMENT en JSON valide.`
              },
              { role: 'user', content: extractionPrompt }
            ],
            temperature: 0.3,
            max_tokens: 8000,
            response_format: { type: "json_object" }
          });

          responseText = completion.choices[0]?.message?.content?.trim() || '{}';
        }

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const chunkResult = JSON.parse(jsonMatch[0]);
          chunkResults.push({
            items: chunkResult.items || [],
            categories: chunkResult.categories || [],
          });
        }
      } catch (chunkError) {
        console.error(`❌ Error processing chunk ${chunkNumber}:`, chunkError);
      }
    }

    const mergedResults = mergeChunkResults(chunkResults);
    const items = mergedResults.items;
    const categories = mergedResults.categories;

    // Save items to database
    if (items.length > 0) {
      const materialsToInsert = items.map(item => ({
        project_id: projectId,
        name: item.name,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        specs: {
          ...item.specs,
          unit: item.unit,
          extracted_by: modelUsed,
          sector: sector,
        },
      }));

      const { error: insertError } = await supabase
        .from('materials')
        .insert(materialsToInsert);

      if (insertError) {
        console.error('❌ Error inserting materials:', insertError);
      }
    }

    // Update project status
    await supabase
      .from('projects')
      .update({ mapping_status: 'completed' })
      .eq('id', projectId);

    return NextResponse.json({
      success: true,
      model: modelUsed,
      sector,
      items,
      categories,
      statistics: {
        totalItems: items.length,
        itemsWithQuantity: items.filter(i => i.quantity !== null).length,
        categoriesCount: categories.length,
        chunksProcessed: chunkResults.length,
        totalChunks,
      },
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildChunkExtractionPrompt(
  chunkContent: string, 
  fileName: string, 
  sector: string, 
  chunkNumber: number, 
  totalChunks: number
): string {
  return `Tu es un expert en extraction de données pour le secteur "${sector}".

**FICHIER**: ${fileName} (chunk ${chunkNumber}/${totalChunks})

**CONTENU**:
\`\`\`
${chunkContent}
\`\`\`

**TA MISSION**: Extraire TOUS les éléments (matériaux, équipements, articles).

**FORMAT JSON**:
{
  "items": [
    {
      "name": "Nom court",
      "description": "Description détaillée ou null",
      "category": "Catégorie",
      "quantity": 10 ou null,
      "unit": "Unité ou null",
      "specs": {}
    }
  ],
  "categories": ["Catégorie 1", "Catégorie 2"]
}

RÉPONDS UNIQUEMENT EN JSON VALIDE.`;
}
```

---

## 9. COMPOSANT ImagePreview (Lightbox)

### `components/materials/ImagePreview.tsx`

```typescript
"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  images: string[];
  alt?: string;
  className?: string;
  showThumbnails?: boolean;
  maxThumbnails?: number;
}

export function ImagePreview({
  images = [],
  alt = "Image",
  className,
  showThumbnails = true,
  maxThumbnails = 4,
}: ImagePreviewProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className={cn("bg-gray-100 rounded-lg flex items-center justify-center", className)}>
        <span className="text-gray-400 text-sm">Pas d'image</span>
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setShowLightbox(false);
    if (e.key === "ArrowLeft") setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    if (e.key === "ArrowRight") setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Preview Image */}
      <div
        className={cn("relative cursor-pointer group overflow-hidden rounded-lg", className)}
        onClick={() => setShowLightbox(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-image.png';
          }}
        />
        
        {/* Hover overlay */}
        <div className={cn(
          "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <ZoomIn className="h-8 w-8 text-white" />
        </div>

        {/* Image count badge */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            +{images.length - 1}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="flex gap-1 mt-2">
          {images.slice(0, maxThumbnails).map((img, idx) => (
            <div
              key={idx}
              className={cn(
                "w-10 h-10 rounded cursor-pointer overflow-hidden border-2 transition-all",
                currentIndex === idx ? "border-blue-500" : "border-transparent hover:border-gray-300"
              )}
              onClick={() => {
                setCurrentIndex(idx);
                setShowLightbox(true);
              }}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
          {images.length > maxThumbnails && (
            <div
              className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-600 cursor-pointer hover:bg-gray-300"
              onClick={() => setShowLightbox(true)}
            >
              +{images.length - maxThumbnails}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={() => setShowLightbox(false)}
          >
            <X className="h-8 w-8" />
          </button>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white hover:text-gray-300 z-10 p-2 bg-black/50 rounded-full"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                className="absolute right-4 text-white hover:text-gray-300 z-10 p-2 bg-black/50 rounded-full"
                onClick={handleNext}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Main image */}
          <img
            src={images[currentIndex]}
            alt={`${alt} ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Thumbnails in lightbox */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-12 h-12 rounded cursor-pointer overflow-hidden border-2 transition-all",
                  currentIndex === idx ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
              >
                <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 10. COMPOSANT MaterialCard

### `components/materials/MaterialCard.tsx`

```typescript
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImagePreview } from "./ImagePreview";
import { Package, DollarSign, MessageSquare } from "lucide-react";

interface MaterialCardProps {
  material: {
    id: string;
    name: string;
    description?: string | null;
    category?: string | null;
    quantity?: number | null;
    images?: string[];
  };
  pricesCount?: number;
  commentsCount?: number;
  onClick?: () => void;
}

export function MaterialCard({
  material,
  pricesCount = 0,
  commentsCount = 0,
  onClick,
}: MaterialCardProps) {
  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-video bg-gray-100">
        <ImagePreview
          images={material.images || []}
          alt={material.name}
          className="w-full h-full"
          showThumbnails={false}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
          {material.name}
        </h3>
        
        {material.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
            {material.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {material.category && (
            <Badge variant="secondary" className="text-xs">
              {material.category}
            </Badge>
          )}
          
          {material.quantity && (
            <Badge variant="outline" className="text-xs">
              <Package className="h-3 w-3 mr-1" />
              {material.quantity}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>{pricesCount} prix</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{commentsCount} notes</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

*Suite dans EXPORT_GUIDE_MATERIALS_PART3.md (Page Comparaison & MaterialDetailModal)...*
