# 📦 GUIDE COMPLET D'EXPORT - Fonctionnalités Matériaux & Comparaison

> Ce guide contient TOUT le code nécessaire pour reproduire les fonctionnalités de gestion de matériaux, upload de fichiers, et comparaison de prix dans une autre application Next.js.

---

## 📋 TABLE DES MATIÈRES

1. [Structure du Projet](#1-structure-du-projet)
2. [Dépendances NPM](#2-dépendances-npm)
3. [Variables d'Environnement](#3-variables-denvironnement)
4. [Schéma Base de Données](#4-schéma-base-de-données)
5. [Librairies Utilitaires](#5-librairies-utilitaires)
6. [Composants UI (shadcn)](#6-composants-ui-shadcn)
7. [Composants Matériaux](#7-composants-matériaux)
8. [Composants Upload](#8-composants-upload)
9. [API Routes](#9-api-routes)
10. [Pages Principales](#10-pages-principales)

---

## 1. STRUCTURE DU PROJET

```
your-app/
├── app/
│   ├── api/
│   │   ├── upload-image/
│   │   │   └── route.ts
│   │   ├── ai/
│   │   │   ├── extract-items/
│   │   │   │   └── route.ts
│   │   │   └── map-columns/
│   │   │       └── route.ts
│   │   └── translate/
│   │       └── route.ts
│   └── dashboard/
│       └── projects/
│           └── [id]/
│               ├── page.tsx
│               └── comparison/
│                   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── accordion.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── progress.tsx
│   │   └── textarea.tsx
│   ├── materials/
│   │   ├── MaterialCard.tsx
│   │   ├── ImagePreview.tsx
│   │   ├── MaterialDetailModal.tsx
│   │   └── CategoryGroup.tsx
│   ├── project/
│   │   └── ImageUpload.tsx
│   └── supplier/
│       ├── EditMaterialModal.tsx
│       ├── MaterialCard.tsx
│       └── SupplierImageUpload.tsx
├── lib/
│   ├── utils.ts
│   ├── comments.ts
│   ├── translation.ts
│   └── supabase/
│       └── client.ts
└── types/
    └── database.ts
```

---

## 2. DÉPENDANCES NPM

```bash
# Installation des dépendances principales
npm install @supabase/ssr @supabase/supabase-js
npm install lucide-react sonner
npm install jspdf jspdf-autotable
npm install clsx tailwind-merge class-variance-authority
npm install openai replicate

# shadcn/ui (à installer via CLI)
npx shadcn@latest init
npx shadcn@latest add button card input label textarea badge dialog accordion progress
```

### package.json (dépendances)

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "lucide-react": "^0.400.0",
    "sonner": "^1.5.0",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "class-variance-authority": "^0.7.0",
    "openai": "^4.0.0",
    "replicate": "^0.25.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-progress": "^1.1.0"
  }
}
```

---

## 3. VARIABLES D'ENVIRONNEMENT

Créez un fichier `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI (pour extraction IA)
OPENAI_API_KEY=sk-your_openai_key

# Replicate (pour Gemini 3 Pro - optionnel)
REPLICATE_API_TOKEN=r8_your_replicate_token
```

---

## 4. SCHÉMA BASE DE DONNÉES

Exécutez ces migrations dans Supabase SQL Editor :

```sql
-- =============================================
-- TABLE: projects
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sector_id UUID,
  custom_sector_name TEXT,
  image_url TEXT,
  estimated_budget NUMERIC,
  budget_currency TEXT DEFAULT 'EUR',
  target_date DATE,
  project_type TEXT DEFAULT 'sourcing',
  mapping_status TEXT DEFAULT 'pending' CHECK (mapping_status IN ('pending', 'completed', 'corrected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- TABLE: materials
-- =============================================
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity NUMERIC,
  surface NUMERIC,
  weight NUMERIC,
  volume NUMERIC,
  specs JSONB DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_materials_project_id ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);

-- RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view materials of own projects" ON materials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = materials.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can insert materials to own projects" ON materials
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = materials.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can update materials of own projects" ON materials
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = materials.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can delete materials of own projects" ON materials
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = materials.project_id AND projects.user_id = auth.uid())
  );

-- =============================================
-- TABLE: suppliers
-- =============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT,
  contact_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  wechat TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  logo_url TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  location_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert suppliers" ON suppliers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update suppliers" ON suppliers FOR UPDATE USING (auth.uid() IS NOT NULL);

-- =============================================
-- TABLE: prices
-- =============================================
CREATE TABLE IF NOT EXISTS prices (
  id SERIAL PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'FCFA',
  country TEXT,
  converted_amount NUMERIC,
  package_length NUMERIC,
  package_width NUMERIC,
  package_height NUMERIC,
  units_per_package INTEGER DEFAULT 1,
  variations JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_prices_material_id ON prices(material_id);
CREATE INDEX IF NOT EXISTS idx_prices_supplier_id ON prices(supplier_id);

-- RLS
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prices of own materials" ON prices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM materials m
      JOIN projects p ON p.id = m.project_id
      WHERE m.id = prices.material_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert prices to own materials" ON prices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM materials m
      JOIN projects p ON p.id = m.project_id
      WHERE m.id = prices.material_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update prices of own materials" ON prices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM materials m
      JOIN projects p ON p.id = m.project_id
      WHERE m.id = prices.material_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete prices of own materials" ON prices
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM materials m
      JOIN projects p ON p.id = m.project_id
      WHERE m.id = prices.material_id AND p.user_id = auth.uid()
    )
  );

-- =============================================
-- TABLE: material_comments
-- =============================================
CREATE TABLE IF NOT EXISTS material_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  comment TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_material_comments_material_id ON material_comments(material_id);

-- RLS
ALTER TABLE material_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-deleted comments" ON material_comments
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Authenticated users can insert comments" ON material_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- TABLE: photos (pour les prix)
-- =============================================
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_id INTEGER REFERENCES prices(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_photos_price_id ON photos(price_id);
CREATE INDEX IF NOT EXISTS idx_photos_material_id ON photos(material_id);

-- RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert photos" ON photos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- STORAGE BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-materials',
  'project-materials',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access for project-materials" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-materials');

CREATE POLICY "Authenticated users can upload to project-materials" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-materials' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-materials' AND auth.uid() IS NOT NULL);
```

---

## 5. LIBRAIRIES UTILITAIRES

### `lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
```

### `lib/comments.ts`

```typescript
import { createClient } from '@/lib/supabase/client';

export interface MaterialComment {
  id: string;
  user_name: string;
  user_email: string;
  comment: string;
  created_at: string;
}

export async function getMaterialComments(materialId: string): Promise<MaterialComment[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('material_comments')
    .select('id, user_name, user_email, comment, created_at')
    .eq('material_id', materialId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return data || [];
}

export async function getBatchMaterialComments(
  materialIds: string[]
): Promise<Record<string, MaterialComment[]>> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('material_comments')
    .select('id, material_id, user_name, user_email, comment, created_at')
    .in('material_id', materialIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching batch comments:', error);
    return {};
  }

  const commentsByMaterial: Record<string, MaterialComment[]> = {};
  
  data?.forEach((comment: any) => {
    const materialId = comment.material_id;
    if (!commentsByMaterial[materialId]) {
      commentsByMaterial[materialId] = [];
    }
    commentsByMaterial[materialId].push({
      id: comment.id,
      user_name: comment.user_name,
      user_email: comment.user_email,
      comment: comment.comment,
      created_at: comment.created_at,
    });
  });

  return commentsByMaterial;
}

export function formatCommentDate(dateString: string, locale: string = 'fr-FR'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

---

## 6. COMPOSANTS UI (shadcn)

> **Note**: Installez ces composants via `npx shadcn@latest add <component>`
> Ou copiez-les depuis le dépôt shadcn/ui

Les composants requis sont :
- `button`
- `card`
- `input`
- `label`
- `textarea`
- `badge`
- `dialog`
- `accordion`
- `progress`

---

## 7. COMPOSANTS MATÉRIAUX

### `components/project/ImageUpload.tsx`

```typescript
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  bucket?: string;
  path?: string;
}

export function ImageUpload({
  images = [],
  onImagesChange,
  maxImages = 5,
  bucket = 'project-materials',
  path = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images autorisées`);
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'anonymous';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} n'est pas une image`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} est trop volumineux (max 5MB)`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('bucket', bucket);

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(`Erreur upload ${file.name}: ${error.error}`);
          continue;
        }

        const data = await response.json();
        newImages.push(data.publicUrl);
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(`${newImages.length} image(s) uploadée(s)`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      const urlParts = imageUrl.split(`/${bucket}/`);
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        const { error } = await supabase.storage
          .from(bucket)
          .remove([filePath]);

        if (error) {
          console.error('Delete error:', error);
          toast.error('Erreur lors de la suppression');
          return;
        }
      }

      onImagesChange(images.filter(img => img !== imageUrl));
      toast.success('Image supprimée');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-4">
      <div className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
        uploading || images.length >= maxImages 
          ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
          : 'border-gray-400 hover:border-gray-500 cursor-pointer'
      }`}>
        <input
          type="file"
          id="image-upload"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading || images.length >= maxImages}
        />
        <label
          htmlFor="image-upload"
          className={`flex flex-col items-center ${
            uploading || images.length >= maxImages ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 text-gray-400 mb-2 animate-spin" />
              <span className="text-sm text-gray-600">Upload en cours...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {images.length >= maxImages 
                  ? `Maximum ${maxImages} images atteint` 
                  : 'Cliquez pour ajouter des images'}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                JPG, PNG, GIF jusqu'à 5MB. {images.length}/{maxImages} images
              </span>
            </>
          )}
        </label>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Image ${index + 1}`}
                className="w-full h-24 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(imageUrl)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Supprimer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

*Suite dans EXPORT_GUIDE_MATERIALS_PART2.md...*
