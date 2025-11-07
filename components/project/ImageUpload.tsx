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
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} n'est pas une image`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} est trop volumineux (max 5MB)`);
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = path ? `${path}/${fileName}` : fileName;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Erreur upload ${file.name}: ${error.message}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
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
      // Reset input
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split(`/${bucket}/`);
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        // Delete from storage
        const { error } = await supabase.storage
          .from(bucket)
          .remove([filePath]);

        if (error) {
          console.error('Delete error:', error);
          toast.error('Erreur lors de la suppression');
          return;
        }
      }

      // Remove from list
      onImagesChange(images.filter(img => img !== imageUrl));
      toast.success('Image supprimée');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <input
          type="file"
          id="image-upload"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading || images.length >= maxImages}
        />
        <label htmlFor="image-upload">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={uploading || images.length >= maxImages}
            onClick={() => document.getElementById('image-upload')?.click()}
            asChild
          >
            <span>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Ajouter des images ({images.length}/{maxImages})
                </>
              )}
            </span>
          </Button>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG, GIF jusqu'à 5MB. Maximum {maxImages} images.
        </p>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={imageUrl}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.png';
                  }}
                />
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(imageUrl)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Supprimer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="p-8 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-2">Aucune image</p>
            <p className="text-xs text-gray-500">
              Cliquez sur "Ajouter des images" pour commencer
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
