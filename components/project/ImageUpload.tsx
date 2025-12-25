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
      // Get user ID from session
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'anonymous';

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

        // Upload via API route (contourne RLS)
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
      {/* Upload Zone - Clickable Dashed Border */}
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

      {/* Images Grid */}
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
              {/* Remove Button */}
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
