"use client";

import { DollarSign, MessageSquare, Package, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImagePreview } from "./ImagePreview";
import { cn } from "@/lib/utils";

interface Material {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number | null;
  specs: any;
  images?: string[];
}

interface MaterialCardProps {
  material: Material;
  pricesCount: number;
  commentsCount: number;
  onClick: () => void;
  className?: string;
}

export function MaterialCard({ 
  material, 
  pricesCount, 
  commentsCount, 
  onClick,
  className 
}: MaterialCardProps) {
  return (
    <div 
      className={cn(
        "group relative bg-white border border-slate-200 rounded-xl p-4 cursor-pointer transition-all duration-200",
        "hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/50",
        "active:scale-[0.99]",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Image */}
        <ImagePreview 
          images={material.images || []} 
          alt={material.name}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 group-hover:text-violet-700 transition-colors truncate">
                {material.name}
              </h3>
              {material.description && (
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                  {material.description}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>

          {/* Tags and stats */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {material.category && (
              <Badge className="bg-violet-100 text-violet-700 border-0 text-xs font-medium">
                {material.category}
              </Badge>
            )}
            {material.quantity && (
              <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                <Package className="h-3 w-3 mr-1" />
                {material.quantity}
              </Badge>
            )}
            
            {/* Stats indicators */}
            <div className="flex items-center gap-2 ml-auto">
              {pricesCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-medium">{pricesCount}</span>
                </div>
              )}
              {commentsCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <MessageSquare className="h-3 w-3" />
                  <span className="font-medium">{commentsCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hover indicator bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
