"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface SupplierImageUploadProps {
  supplierImages: string[];
  onSupplierImagesChange: (images: string[]) => void;
  maxImages?: number;
  bucket: string;
  path: string;
}

export function SupplierImageUpload({
  supplierImages,
  onSupplierImagesChange,
  maxImages = 5,
  bucket,
  path,
}: SupplierImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (supplierImages.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images autorisées`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Type de fichier non supporté: ${file.type}`);
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Fichier trop volumineux: ${file.name}`);
        }

        // Get user ID from session
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || 'anonymous';

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
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        return data.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onSupplierImagesChange([...supplierImages, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) ajoutée(s)`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = supplierImages[index];
    
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === bucket);
      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        
        // Delete from storage
        await supabase.storage.from(bucket).remove([filePath]);
      }

      // Remove from state
      const newImages = supplierImages.filter((_, i) => i !== index);
      onSupplierImagesChange(newImages);
      toast.success('Image supprimée');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      {supplierImages.length < maxImages && (
        <div>
          <input
            type="file"
            id="supplier-image-upload"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <label htmlFor="supplier-image-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isUploading}
              asChild
            >
              <span className="cursor-pointer">
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter vos images ({supplierImages.length}/{maxImages})
                  </>
                )}
              </span>
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG, GIF jusqu'à 5MB. Maximum {maxImages} images.
          </p>
        </div>
      )}

      {/* Image Grid */}
      {supplierImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {supplierImages.map((imageUrl, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-200 group"
            >
              <img
                src={imageUrl}
                alt={`Supplier image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
