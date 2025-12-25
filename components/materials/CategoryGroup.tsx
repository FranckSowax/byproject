"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Edit2, Check, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MaterialCard } from "./MaterialCard";

interface Material {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number | null;
  specs: any;
  images?: string[];
}

interface CategoryGroupProps {
  category: string;
  materials: Material[];
  pricesByMaterial: Record<string, any[]>;
  commentsByMaterial: Record<string, any[]>;
  isExpanded: boolean;
  onToggle: () => void;
  onMaterialClick: (material: Material) => void;
  onCategoryRename: (oldName: string, newName: string) => Promise<void>;
  color?: string;
}

// Couleurs pour les catégories
const categoryColors: Record<string, { bg: string; text: string; border: string; light: string }> = {
  'Électricité': { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-300', light: 'bg-amber-50' },
  'Plomberie': { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-300', light: 'bg-blue-50' },
  'Mobilier': { bg: 'bg-violet-500', text: 'text-violet-700', border: 'border-violet-300', light: 'bg-violet-50' },
  'Décoration': { bg: 'bg-pink-500', text: 'text-pink-700', border: 'border-pink-300', light: 'bg-pink-50' },
  'Cuisine': { bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-300', light: 'bg-orange-50' },
  'Literie': { bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-300', light: 'bg-indigo-50' },
  'Salle de bain': { bg: 'bg-cyan-500', text: 'text-cyan-700', border: 'border-cyan-300', light: 'bg-cyan-50' },
  'Éclairage': { bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-300', light: 'bg-yellow-50' },
  'Revêtements': { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-300', light: 'bg-emerald-50' },
  'Menuiserie': { bg: 'bg-amber-600', text: 'text-amber-800', border: 'border-amber-400', light: 'bg-amber-50' },
  'Quincaillerie': { bg: 'bg-slate-500', text: 'text-slate-700', border: 'border-slate-300', light: 'bg-slate-50' },
};

const defaultColor = { bg: 'bg-slate-500', text: 'text-slate-700', border: 'border-slate-300', light: 'bg-slate-50' };

export function CategoryGroup({
  category,
  materials,
  pricesByMaterial,
  commentsByMaterial,
  isExpanded,
  onToggle,
  onMaterialClick,
  onCategoryRename,
}: CategoryGroupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(category);
  const [isSaving, setIsSaving] = useState(false);

  const colors = categoryColors[category] || defaultColor;
  
  // Calculer les stats de la catégorie
  const totalQuantity = materials.reduce((sum, m) => sum + (m.quantity || 0), 0);
  const totalPrices = materials.reduce((sum, m) => sum + (pricesByMaterial[m.id]?.length || 0), 0);
  const totalComments = materials.reduce((sum, m) => sum + (commentsByMaterial[m.id]?.length || 0), 0);

  const handleSaveCategory = async () => {
    if (editValue.trim() && editValue !== category) {
      setIsSaving(true);
      try {
        await onCategoryRename(category, editValue.trim());
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(category);
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg sm:rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {/* Category Header */}
      <div 
        className={cn(
          "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 cursor-pointer transition-all duration-200 active:bg-slate-100",
          isExpanded ? colors.light : "hover:bg-slate-50"
        )}
        onClick={() => !isEditing && onToggle()}
      >
        {/* Expand/Collapse icon */}
        <div className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center transition-all flex-shrink-0",
          colors.bg
        )}>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          ) : (
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          )}
        </div>

        {/* Category name */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-7 sm:h-8 text-sm font-semibold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCategory();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={handleSaveCategory}
                disabled={isSaving}
              >
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400 hover:text-slate-600"
                onClick={handleCancelEdit}
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 group/edit">
              <h3 className={cn("font-semibold text-sm sm:text-base truncate", colors.text)}>
                {category}
              </h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 sm:h-6 sm:w-6 opacity-0 group-hover/edit:opacity-100 hover:opacity-100 text-slate-400 hover:text-slate-600 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Edit2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Stats - responsive layout */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Items count - always visible */}
          <Badge 
            variant="secondary" 
            className={cn("font-semibold text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5", colors.light, colors.text)}
          >
            <span className="sm:hidden">{materials.length}</span>
            <span className="hidden sm:inline">{materials.length} élément{materials.length > 1 ? 's' : ''}</span>
          </Badge>

          {/* Total quantity - hidden on very small screens */}
          {totalQuantity > 0 && (
            <Badge variant="outline" className="text-orange-600 border-orange-200 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 hidden xs:flex">
              <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
              {totalQuantity}
            </Badge>
          )}

          {/* Prices indicator - hidden on mobile */}
          {totalPrices > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-[10px] sm:text-xs text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              <span className="font-medium">{totalPrices} prix</span>
            </div>
          )}
        </div>
      </div>

      {/* Materials list - with animation */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-out",
        isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="border-t border-slate-100 p-2 sm:p-3 space-y-1.5 sm:space-y-2 bg-slate-50/50">
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              pricesCount={pricesByMaterial[material.id]?.length || 0}
              commentsCount={commentsByMaterial[material.id]?.length || 0}
              onClick={() => onMaterialClick(material)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
