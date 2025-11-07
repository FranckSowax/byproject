"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, Package, Ruler, Weight, Box } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  translatedName?: string;
  description: string | null;
  category: string | null;
  quantity: number | null;
  surface: number | null;
  weight: number | null;
  volume: number | null;
  images: string[];
}

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  language: 'fr' | 'en' | 'zh';
}

const translations = {
  fr: {
    title: 'Détails du Matériau',
    description: 'Description',
    noDescription: 'Aucune description disponible',
    images: 'Images',
    noImages: 'Aucune image disponible',
    quantity: 'Quantité',
    surface: 'Surface',
    weight: 'Poids',
    volume: 'Volume',
    category: 'Catégorie',
  },
  en: {
    title: 'Material Details',
    description: 'Description',
    noDescription: 'No description available',
    images: 'Images',
    noImages: 'No images available',
    quantity: 'Quantity',
    surface: 'Surface',
    weight: 'Weight',
    volume: 'Volume',
    category: 'Category',
  },
  zh: {
    title: '材料详情',
    description: '描述',
    noDescription: '无描述',
    images: '图片',
    noImages: '无图片',
    quantity: '数量',
    surface: '表面',
    weight: '重量',
    volume: '体积',
    category: '类别',
  },
};

export function DescriptionModal({
  isOpen,
  onClose,
  material,
  language,
}: DescriptionModalProps) {
  if (!material) return null;

  const t = translations[language];
  const displayName = language === 'zh' || language === 'en' 
    ? material.translatedName || material.name 
    : material.name;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {displayName}
          </DialogTitle>
          {material.category && (
            <Badge variant="secondary" className="w-fit mt-2">
              {material.category}
            </Badge>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t.description}
            </h3>
            {material.description ? (
              <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">
                {material.description}
              </p>
            ) : (
              <p className="text-gray-400 text-sm italic">{t.noDescription}</p>
            )}
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {material.quantity !== null && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-gray-600">{t.quantity}</span>
                </div>
                <p className="font-bold text-blue-900">{material.quantity}</p>
              </div>
            )}
            {material.surface !== null && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Ruler className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-gray-600">{t.surface}</span>
                </div>
                <p className="font-bold text-green-900">{material.surface} m²</p>
              </div>
            )}
            {material.weight !== null && (
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Weight className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-gray-600">{t.weight}</span>
                </div>
                <p className="font-bold text-orange-900">{material.weight} kg</p>
              </div>
            )}
            {material.volume !== null && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Box className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-gray-600">{t.volume}</span>
                </div>
                <p className="font-bold text-purple-900">{material.volume} m³</p>
              </div>
            )}
          </div>

          {/* Images Gallery */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {t.images} {material.images.length > 0 && `(${material.images.length})`}
            </h3>
            {material.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {material.images.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                    onClick={() => window.open(imageUrl, '_blank')}
                  >
                    <img
                      src={imageUrl}
                      alt={`${material.name} - ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                        <ImageIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">{t.noImages}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
