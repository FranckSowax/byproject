"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, DollarSign, Edit, Image as ImageIcon, Package, Ruler, ChevronDown, ChevronUp, XCircle } from 'lucide-react';

interface PriceVariation {
  id: string;
  label: string;
  labelFr?: string;
  amount: string;
  notes: string;
  notesFr?: string;
}

interface Price {
  id: number;
  amount: number;
  currency: string;
  supplier_name: string;
  country: string;
  variations: PriceVariation[];
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
  unavailable?: boolean;
}

interface MaterialCardProps {
  material: Material;
  language: 'fr' | 'en' | 'zh';
  onOpenDescription: () => void;
  onOpenPrice: () => void;
  onOpenEdit: () => void;
  onMarkUnavailable?: () => void;
}

export function MaterialCard({
  material,
  language,
  onOpenDescription,
  onOpenPrice,
  onOpenEdit,
  onMarkUnavailable,
}: MaterialCardProps) {
  const [showAllPrices, setShowAllPrices] = useState(false);
  
  const displayName = language === 'zh' || language === 'en'
    ? material.translatedName || material.name
    : material.name;

  const hasPrice = material.prices && material.prices.length > 0;
  const mainPrice = hasPrice ? material.prices![0] : null;
  const hasVariations = mainPrice && mainPrice.variations && mainPrice.variations.length > 0;
  const isUnavailable = material.unavailable;

  return (
    <div className={`group border-2 rounded-xl p-4 transition-all duration-200 ${
      isUnavailable
        ? 'border-gray-300 bg-gray-100 opacity-60'
        : hasPrice 
        ? 'border-green-300 bg-green-50/30 hover:border-green-400 hover:shadow-lg' 
        : 'border-gray-200 bg-white hover:border-[#5B5FC7] hover:shadow-lg'
    }`}>
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

        {/* Middle: Prices or Unavailable */}
        {!isUnavailable && hasPrice && mainPrice && (
          <div className="flex flex-col gap-1 px-4">
            {/* Main Price */}
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <span className="text-lg">
                {mainPrice.amount} {mainPrice.currency}
              </span>
              {hasVariations && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowAllPrices(!showAllPrices)}
                >
                  {showAllPrices ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Variations (dropdown) */}
            {showAllPrices && hasVariations && (
              <div className="flex flex-col gap-1 pl-2 mt-1">
                {mainPrice.variations.map((variation) => {
                  const displayLabel = language === 'fr' && variation.labelFr
                    ? variation.labelFr
                    : variation.label;
                  
                  return (
                    <div key={variation.id} className="flex flex-col gap-0.5 text-green-500 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {variation.amount} {mainPrice.currency}
                        </span>
                        {displayLabel && (
                          <span className="text-xs text-gray-600">
                            ({displayLabel})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {isUnavailable && (
          <div className="flex items-center gap-2 px-4 text-gray-500 italic">
            <XCircle className="h-5 w-5" />
            <span className="text-sm">
              {language === 'fr' ? 'Non disponible' : language === 'en' ? 'Unavailable' : '不可用'}
            </span>
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

          {/* Unavailable Icon */}
          {onMarkUnavailable && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-lg transition-colors ${
                isUnavailable
                  ? 'bg-gray-200 text-gray-600'
                  : 'hover:bg-red-50 hover:text-red-600'
              }`}
              onClick={onMarkUnavailable}
              title={language === 'fr' ? 'Ne peut pas fournir' : language === 'en' ? 'Cannot supply' : '无法供应'}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
