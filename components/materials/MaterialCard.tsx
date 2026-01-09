"use client";

import { DollarSign, MessageSquare, Package, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImagePreview } from "./ImagePreview";
import { cn } from "@/lib/utils";
import { Material } from "./types";

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
  const hasClarificationRequest = material.clarification_request && !material.clarification_request.resolved_at;
  const hasResolvedClarification = material.clarification_request && material.clarification_request.resolved_at;

  return (
    <div
      className={cn(
        "group relative bg-white border rounded-lg sm:rounded-xl p-2.5 sm:p-4 cursor-pointer transition-all duration-200",
        hasClarificationRequest
          ? "border-orange-300 bg-orange-50/50 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100/50"
          : "border-slate-200 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/50",
        "active:scale-[0.98] active:bg-slate-50",
        "touch-manipulation", // Better touch handling
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5 sm:gap-4">
        {/* Image - smaller on mobile */}
        <ImagePreview 
          images={material.images || []} 
          alt={material.name}
          size="sm"
          className="sm:hidden"
        />
        <ImagePreview 
          images={material.images || []} 
          alt={material.name}
          size="md"
          className="hidden sm:block"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5 sm:gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-2 sm:truncate">
                {material.name}
              </h3>
              {material.description && (
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-1 hidden sm:block">
                  {material.description}
                </p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 sm:group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" />
          </div>

          {/* Tags and stats - responsive */}
          <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
            {/* Clarification request badge - prominent display */}
            {hasClarificationRequest && (
              <Badge className="bg-orange-500 text-white border-0 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0 sm:py-0.5 animate-pulse">
                <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                {material.clarification_request?.needs_images && material.clarification_request?.needs_description
                  ? "Images + Détails requis"
                  : material.clarification_request?.needs_images
                  ? "Images requises"
                  : "Détails requis"}
              </Badge>
            )}
            {/* Resolved clarification badge */}
            {hasResolvedClarification && (
              <Badge className="bg-emerald-500 text-white border-0 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0 sm:py-0.5">
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                Modifié
              </Badge>
            )}
            {/* Category badge - hidden on very small screens if too long */}
            {material.category && !hasClarificationRequest && !hasResolvedClarification && (
              <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0 sm:py-0.5 max-w-[100px] sm:max-w-none truncate">
                {material.category}
              </Badge>
            )}
            {material.quantity && (
              <Badge variant="outline" className="text-orange-600 border-orange-200 text-[10px] sm:text-xs px-1 sm:px-2 py-0 sm:py-0.5">
                <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                {material.quantity}
              </Badge>
            )}
            
            {/* Stats indicators - compact on mobile */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              {pricesCount > 0 && (
                <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="font-medium">{pricesCount}</span>
                </div>
              )}
              {commentsCount > 0 && (
                <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="font-medium">{commentsCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hover indicator bar - hidden on touch devices */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 sm:w-1 bg-violet-500 rounded-l-lg sm:rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
      
      {/* Touch feedback indicator - visible on mobile */}
      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-violet-500/5 opacity-0 group-active:opacity-100 transition-opacity sm:hidden pointer-events-none" />
    </div>
  );
}
