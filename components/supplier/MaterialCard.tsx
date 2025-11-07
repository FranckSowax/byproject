"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, DollarSign, Edit, Image as ImageIcon, Package, Ruler } from 'lucide-react';

interface Price {
  id: number;
  amount: number;
  currency: string;
  supplier_name: string;
  country: string;
}

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
  supplierImages?: string[];
  prices?: Price[];
}

interface MaterialCardProps {
  material: Material;
  language: 'fr' | 'en' | 'zh';
  onOpenDescription: () => void;
  onOpenPrice: () => void;
  onOpenEdit: () => void;
}

export function MaterialCard({
  material,
  language,
  onOpenDescription,
  onOpenPrice,
  onOpenEdit,
}: MaterialCardProps) {
  const displayName = language === 'zh' || language === 'en'
    ? material.translatedName || material.name
    : material.name;

  return (
    <div className="group border-2 border-gray-200 rounded-xl p-4 bg-white hover:border-[#5B5FC7] hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Image + Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Image */}
          {material.images && material.images.length > 0 ? (
            <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 border-[#5B5FC7]/20 shadow-sm">
              <img
                src={material.images[0]}
                alt={material.name}
                className="w-full h-full object-cover"
              />
              {material.images.length > 1 && (
                <div className="absolute bottom-0 right-0 bg-[#5B5FC7] text-white text-[10px] px-1 rounded-tl">
                  +{material.images.length - 1}
                </div>
              )}
            </div>
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10 flex items-center justify-center flex-shrink-0 shadow-sm">
              <ImageIcon className="h-7 w-7 text-[#5B5FC7]/40" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base text-[#2D3748] group-hover:text-[#5B5FC7] transition-colors leading-tight mb-1">
              {displayName}
            </h4>
            {material.description && (
              <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                {material.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {material.category && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0">
                  {material.category}
                </Badge>
              )}
              {material.quantity !== null && (
                <Badge variant="outline" className="text-[10px] px-2 py-0 bg-orange-50 text-orange-700 border-orange-200">
                  <Package className="h-3 w-3 mr-1" />
                  {material.quantity}
                </Badge>
              )}
              {material.surface !== null && (
                <Badge variant="outline" className="text-[10px] px-2 py-0 bg-blue-50 text-blue-700 border-blue-200">
                  <Ruler className="h-3 w-3 mr-1" />
                  {material.surface} m²
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Prices */}
        {material.prices && material.prices.length > 0 && (
          <div className="flex flex-col gap-1 px-4">
            {material.prices.map((price) => (
              <div key={price.id} className="flex items-center gap-2 text-green-600 font-semibold">
                <DollarSign className="h-4 w-4" />
                <span className="text-lg">
                  {price.amount} {price.currency}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Right: Action Icons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Description Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
            onClick={onOpenDescription}
            title={language === 'fr' ? 'Voir description' : language === 'en' ? 'View description' : '查看描述'}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          {/* Price Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg hover:bg-green-50 hover:text-green-600 transition-colors"
            onClick={onOpenPrice}
            title={language === 'fr' ? 'Ajouter prix' : language === 'en' ? 'Add price' : '添加价格'}
          >
            <DollarSign className="h-4 w-4" />
          </Button>

          {/* Edit Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-colors"
            onClick={onOpenEdit}
            title={language === 'fr' ? 'Éditer' : language === 'en' ? 'Edit' : '编辑'}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
