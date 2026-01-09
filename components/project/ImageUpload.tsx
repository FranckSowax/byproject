"use client";

import { useState, useRef, useId } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileSelect called');
    const files = event.target.files;
    console.log('Files selected:', files?.length);

    if (!files || files.length === 0) {
      console.log('No files selected, returning');
      return;
    }

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images autorisées`);
      return;
    }

    setUploading(true);
    toast.info('Upload en cours...');
    const newImages: string[] = [];

    try {
      // Get user ID from session
      console.log('Getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session result:', { hasSession: !!session, userId: session?.user?.id, error: sessionError });
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
        console.log('Preparing upload for:', file.name);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('bucket', bucket);

        console.log('Sending to /api/upload-image...');
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        });
        console.log('Response status:', response.status);

        if (!response.ok) {
          const error = await response.json();
          console.error('Upload error response:', error);
          toast.error(`Erreur upload ${file.name}: ${error.error}`);
          continue;
        }

        const data = await response.json();
        console.log('Upload success:', data);
        newImages.push(data.publicUrl);
      }

      if (newImages.length > 0) {
        console.log('Calling onImagesChange with:', [...images, ...newImages]);
        onImagesChange([...images, ...newImages]);
        toast.success(`${newImages.length} image(s) uploadée(s)`);
      } else {
        console.log('No new images to add');
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

  const handleClick = () => {
    if (!uploading && images.length < maxImages && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone - Clickable Dashed Border */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          uploading || images.length >= maxImages
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-400 hover:border-gray-500 hover:bg-gray-50 cursor-pointer'
        }`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          id={inputId}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading || images.length >= maxImages}
        />
        <div className="flex flex-col items-center">
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
        </div>
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
