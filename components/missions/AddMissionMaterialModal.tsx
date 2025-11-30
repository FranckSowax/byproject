"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  X,
  Plus,
  Package,
  Loader2,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface AddMissionMaterialModalProps {
  missionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  suggestedMaterials?: string[];
}

const CATEGORIES = [
  { value: 'btp', label: '🏗️ BTP / Construction' },
  { value: 'medical', label: '🏥 Médical / Hospitalier' },
  { value: 'hotel', label: '🏨 Hôtellerie' },
  { value: 'industrial', label: '🏭 Industriel' },
  { value: 'electrical', label: '⚡ Électrique' },
  { value: 'plumbing', label: '🔧 Plomberie' },
  { value: 'furniture', label: '🪑 Mobilier' },
  { value: 'equipment', label: '🔩 Équipement' },
  { value: 'other', label: '📦 Autre' },
];

const PRIORITIES = [
  { value: 'low', label: 'Basse', color: 'bg-slate-100 text-slate-700' },
  { value: 'normal', label: 'Normale', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'Haute', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-700' },
];

const UNITS = [
  'unité', 'pièce', 'lot', 'kg', 'tonne', 'm', 'm²', 'm³', 
  'litre', 'carton', 'palette', 'container'
];

export default function AddMissionMaterialModal({
  missionId,
  isOpen,
  onClose,
  onSuccess,
  suggestedMaterials = []
}: AddMissionMaterialModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: '',
    unit: 'unité',
    priority: 'normal',
    specifications: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast.error("Maximum 5 images autorisées");
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Créer les previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSuggestedClick = (material: string) => {
    setFormData(prev => ({ ...prev, name: material }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Le nom du matériau est requis");
      return;
    }

    setLoading(true);
    try {
      // Upload des images si présentes
      const uploadedImages: string[] = [];
      for (const image of images) {
        const fileName = `${missionId}/${Date.now()}-${image.name}`;
        const { data, error } = await supabase.storage
          .from('mission-materials')
          .upload(fileName, image);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('mission-materials')
          .getPublicUrl(fileName);

        uploadedImages.push(urlData.publicUrl);
      }

      // Créer le matériau
      const { error } = await supabase
        .from('mission_materials' as any)
        .insert({
          mission_id: missionId,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          quantity: formData.quantity ? parseFloat(formData.quantity) : null,
          unit: formData.unit,
          priority: formData.priority,
          specifications: formData.specifications ? { notes: formData.specifications } : {},
          images: uploadedImages,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Matériau ajouté avec succès !");
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        quantity: '',
        unit: 'unité',
        priority: 'normal',
        specifications: ''
      });
      setImages([]);
      setImagePreview([]);

    } catch (error: any) {
      console.error('Error adding material:', error);
      toast.error("Erreur lors de l'ajout du matériau");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Ajouter un matériau</h2>
              <p className="text-sm text-slate-500">Définissez les besoins de votre mission</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* Suggestions IA */}
          {suggestedMaterials.length > 0 && (
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Suggestions IA</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedMaterials.map((material, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedClick(material)}
                    className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    {material}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du matériau *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Carrelage 60x60 antidérapant"
              className="h-12"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Décrivez les caractéristiques du matériau..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Catégorie et Quantité */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <div className="flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  placeholder="0"
                  className="h-12 flex-1"
                />
                <select
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="h-12 px-3 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {UNITS.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label>Priorité</Label>
            <div className="flex gap-2">
              {PRIORITIES.map(priority => (
                <button
                  key={priority.value}
                  onClick={() => handleChange('priority', priority.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    formData.priority === priority.value
                      ? priority.color + " ring-2 ring-offset-2 ring-current"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Spécifications */}
          <div className="space-y-2">
            <Label htmlFor="specifications">Spécifications techniques</Label>
            <Textarea
              id="specifications"
              value={formData.specifications}
              onChange={(e) => handleChange('specifications', e.target.value)}
              placeholder="Dimensions, normes, certifications requises..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Images (max 5)</Label>
            <div className="flex flex-wrap gap-3">
              {imagePreview.map((preview, index) => (
                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Plus className="h-6 w-6 text-slate-400" />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !formData.name.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter le matériau
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
