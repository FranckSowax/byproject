"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SupplierImageUpload } from './SupplierImageUpload';

interface Material {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number | null;
  surface: number | null;
  weight: number | null;
  volume: number | null;
  supplierImages?: string[];
}

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  onSubmit: (data: Partial<Material>) => Promise<void>;
  language: 'fr' | 'en' | 'zh';
}

const translations = {
  fr: {
    title: 'Éditer le matériau',
    subtitle: 'Modifiez les informations du matériau',
    name: 'Nom',
    description: 'Description',
    descriptionPlaceholder: 'Spécifications, caractéristiques, notes...',
    category: 'Catégorie',
    categoryPlaceholder: 'Ex: Matériaux de base, Ferraillage...',
    quantity: 'Quantité',
    surface: 'Surface (m²)',
    weight: 'Poids (kg)',
    volume: 'Volume (m³)',
    images: 'Images',
    cancel: 'Annuler',
    save: 'Enregistrer',
    required: '*',
  },
  en: {
    title: 'Edit Material',
    subtitle: 'Modify material information',
    name: 'Name',
    description: 'Description',
    descriptionPlaceholder: 'Specifications, characteristics, notes...',
    category: 'Category',
    categoryPlaceholder: 'Ex: Base materials, Reinforcement...',
    quantity: 'Quantity',
    surface: 'Surface (m²)',
    weight: 'Weight (kg)',
    volume: 'Volume (m³)',
    images: 'Images',
    cancel: 'Cancel',
    save: 'Save',
    required: '*',
  },
  zh: {
    title: '编辑材料',
    subtitle: '修改材料信息',
    name: '名称',
    description: '描述',
    descriptionPlaceholder: '规格、特性、备注...',
    category: '类别',
    categoryPlaceholder: '例如：基础材料、钢筋...',
    quantity: '数量',
    surface: '表面（平方米）',
    weight: '重量（公斤）',
    volume: '体积（立方米）',
    images: '图片',
    cancel: '取消',
    save: '保存',
    required: '*',
  },
};

export function EditMaterialModal({
  isOpen,
  onClose,
  material,
  onSubmit,
  language,
}: EditMaterialModalProps) {
  const t = translations[language];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Material>>({
    name: '',
    description: '',
    category: '',
    quantity: null,
    surface: null,
    weight: null,
    volume: null,
    supplierImages: [],
  });

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        description: material.description || '',
        category: material.category || '',
        quantity: material.quantity,
        surface: material.surface,
        weight: material.weight,
        volume: material.volume,
        supplierImages: material.supplierImages || [],
      });
    }
  }, [material]);

  const handleSubmit = async () => {
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error updating material:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!material) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t.title}</DialogTitle>
          <DialogDescription>{t.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">{t.name} {t.required}</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">{t.description}</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t.descriptionPlaceholder}
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">{t.category}</Label>
            <Input
              id="category"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder={t.categoryPlaceholder}
              className="mt-1"
            />
          </div>

          {/* Quantity & Surface */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">{t.quantity}</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity || ''}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseFloat(e.target.value) || null })
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="surface">{t.surface}</Label>
              <Input
                id="surface"
                type="number"
                value={formData.surface || ''}
                onChange={(e) =>
                  setFormData({ ...formData, surface: parseFloat(e.target.value) || null })
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>

          {/* Weight & Volume */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">{t.weight}</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight || ''}
                onChange={(e) =>
                  setFormData({ ...formData, weight: parseFloat(e.target.value) || null })
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="volume">{t.volume}</Label>
              <Input
                id="volume"
                type="number"
                value={formData.volume || ''}
                onChange={(e) =>
                  setFormData({ ...formData, volume: parseFloat(e.target.value) || null })
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <Label className="mb-2 block">{t.images}</Label>
            <SupplierImageUpload
              supplierImages={formData.supplierImages || []}
              onSupplierImagesChange={(images) =>
                setFormData({ ...formData, supplierImages: images })
              }
              maxImages={5}
              bucket="project-materials"
              path={`supplier-materials/${material.id}`}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.name}>
            {isSubmitting ? '...' : t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
