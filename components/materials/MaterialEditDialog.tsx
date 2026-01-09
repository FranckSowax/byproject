"use client";

import { useState, useRef, useId, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, AlertCircle, CheckCircle2, Image as ImageIcon, FileText, Ruler, X, Loader2, Upload, Camera } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Material, ClarificationRequest } from "./types";

interface MaterialEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
  onSave: (material: Material) => Promise<void>;
  projectId: string;
}

export function MaterialEditDialog({
  open,
  onOpenChange,
  material,
  onSave,
  projectId
}: MaterialEditDialogProps) {
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Sync editingMaterial when material prop changes
  useState(() => {
    if (material) {
      setEditingMaterial({ ...material });
    }
  });

  // Update local state when dialog opens with new material
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && material) {
      setEditingMaterial({ ...material });
      setActiveTab("info");
    } else if (!newOpen) {
      setEditingMaterial(null);
    }
    onOpenChange(newOpen);
  };

  const hasClarificationRequest = editingMaterial?.clarification_request &&
    !editingMaterial.clarification_request.resolved_at;

  const needsImages = hasClarificationRequest &&
    editingMaterial?.clarification_request?.needs_images;

  const needsDescription = hasClarificationRequest &&
    editingMaterial?.clarification_request?.needs_description;

  const hasImages = editingMaterial?.images && editingMaterial.images.length > 0;
  const hasDescription = editingMaterial?.description && editingMaterial.description.trim().length > 0;

  const handleSave = async () => {
    if (!editingMaterial) return;

    setIsSaving(true);
    try {
      await onSave(editingMaterial);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving material:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !editingMaterial) return;

    const currentImages = editingMaterial.images || [];
    if (currentImages.length + files.length > 5) {
      toast.error("Maximum 5 images autorisées");
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        toast.error("Vous devez être connecté pour uploader des images");
        return;
      }

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
        formData.append('bucket', 'project-materials');

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
        setEditingMaterial({
          ...editingMaterial,
          images: [...currentImages, ...newImages]
        });
        toast.success(`${newImages.length} image(s) uploadée(s)`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    if (!editingMaterial) return;
    setEditingMaterial({
      ...editingMaterial,
      images: (editingMaterial.images || []).filter(img => img !== imageUrl)
    });
  };

  const triggerFileInput = () => {
    inputRef.current?.click();
  };

  if (!editingMaterial) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl text-white">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Edit className="h-5 w-5" />
              </div>
              <div>
                <span className="block">Éditer le matériau</span>
                <span className="text-sm font-normal text-white/70 truncate block max-w-[400px]">
                  {editingMaterial.name}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Clarification Request Banner */}
        {hasClarificationRequest && (
          <div className="bg-orange-50 border-b border-orange-200 px-6 py-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-800 text-sm">Demande de précision</h4>
                <p className="text-sm text-orange-700 mt-1">
                  {editingMaterial.clarification_request?.message || "Informations supplémentaires requises"}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {needsDescription && (
                    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                      hasDescription ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {hasDescription ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      Description {hasDescription ? '✓' : 'requise'}
                    </div>
                  )}
                  {needsImages && (
                    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                      hasImages ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {hasImages ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      Images {hasImages ? '✓' : 'requises'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b px-6">
            <TabsList className="h-12 bg-transparent gap-4">
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 gap-2"
              >
                <FileText className="h-4 w-4" />
                Informations
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className={`data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 gap-2 ${
                  needsImages && !hasImages ? 'text-orange-600' : ''
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                Images
                {needsImages && !hasImages && (
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
                {hasImages && (
                  <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">
                    {editingMaterial.images?.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="dimensions"
                className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 gap-2"
              >
                <Ruler className="h-4 w-4" />
                Dimensions
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Info Tab */}
            <TabsContent value="info" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nom du matériau *
                </Label>
                <Input
                  id="name"
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  placeholder="Ex: Ciment Portland CEM I 42.5"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                  Description
                  {needsDescription && <span className="text-orange-500">*</span>}
                </Label>
                <Textarea
                  id="description"
                  value={editingMaterial.description || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value || null })}
                  placeholder="Décrivez le matériau, ses spécifications, caractéristiques techniques..."
                  rows={4}
                  className={needsDescription && !hasDescription
                    ? 'border-orange-300 focus:border-orange-400 focus:ring-orange-200'
                    : ''
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Catégorie
                </Label>
                <Input
                  id="category"
                  value={editingMaterial.category || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, category: e.target.value })}
                  placeholder="Ex: Gros Oeuvre, Second Oeuvre, Finitions..."
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Quantité
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={editingMaterial.quantity || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, quantity: parseFloat(e.target.value) || null })}
                  placeholder="0"
                  className="h-11"
                />
              </div>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="mt-0 space-y-4">
              <input
                ref={inputRef}
                type="file"
                id={inputId}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
              />

              {/* Upload Zone */}
              <div
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  uploading
                    ? 'border-gray-300 bg-gray-50 cursor-wait'
                    : needsImages && !hasImages
                    ? 'border-orange-300 bg-orange-50 hover:border-orange-400 hover:bg-orange-100'
                    : 'border-gray-300 bg-gray-50 hover:border-violet-400 hover:bg-violet-50'
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 text-violet-500 mb-3 animate-spin" />
                    <p className="text-sm text-gray-600">Upload en cours...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                      needsImages && !hasImages ? 'bg-orange-100' : 'bg-violet-100'
                    }`}>
                      <Camera className={`h-8 w-8 ${needsImages && !hasImages ? 'text-orange-500' : 'text-violet-500'}`} />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Cliquez pour ajouter des photos
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, GIF • Max 5MB par image • {(editingMaterial.images || []).length}/5 images
                    </p>
                  </div>
                )}
              </div>

              {/* Images Grid */}
              {(editingMaterial.images || []).length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {editingMaterial.images?.map((imageUrl, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={imageUrl}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.png';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(imageUrl)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        title="Supprimer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(editingMaterial.images || []).length === 0 && !uploading && (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucune image ajoutée</p>
                </div>
              )}
            </TabsContent>

            {/* Dimensions Tab */}
            <TabsContent value="dimensions" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surface" className="text-sm font-medium">
                    Surface (m²)
                  </Label>
                  <Input
                    id="surface"
                    type="number"
                    value={editingMaterial.surface || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, surface: parseFloat(e.target.value) || null })}
                    placeholder="0"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-medium">
                    Poids (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    value={editingMaterial.weight || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, weight: parseFloat(e.target.value) || null })}
                    placeholder="0"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume" className="text-sm font-medium">
                    Volume (m³)
                  </Label>
                  <Input
                    id="volume"
                    type="number"
                    value={editingMaterial.volume || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, volume: parseFloat(e.target.value) || null })}
                    placeholder="0"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Conseils</h4>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• La surface est utile pour les revêtements (carrelage, peinture...)</li>
                  <li>• Le poids est important pour les matériaux vendus au kilo</li>
                  <li>• Le volume s'applique aux matériaux en vrac (sable, gravier...)</li>
                </ul>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="border-t px-6 py-4 bg-gray-50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !editingMaterial.name}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
