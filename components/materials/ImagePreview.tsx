"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  images: string[];
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ImagePreview({ images, alt, size = 'md', className }: ImagePreviewProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const handleMouseEnter = () => {
    if (images.length > 0) {
      hoverTimeout.current = setTimeout(() => {
        setShowTooltip(true);
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    setShowTooltip(false);
  };

  const handleClick = () => {
    if (images.length > 0) {
      setShowLightbox(true);
    }
  };

  if (images.length === 0) {
    return (
      <div className={cn(
        "rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-200",
        sizeClasses[size],
        className
      )}>
        <ImageIcon className="h-1/2 w-1/2 text-slate-300" />
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail */}
      <div 
        className={cn(
          "relative rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group border-2 border-transparent hover:border-violet-400 transition-all",
          sizeClasses[size],
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <img 
          src={images[0]} 
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {images.length > 1 && (
          <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md font-medium">
            +{images.length - 1}
          </div>
        )}

        {/* Hover tooltip preview (Desktop) */}
        {showTooltip && (
          <div 
            className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in-95 duration-200"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-2 w-64">
              <img 
                src={images[0]} 
                alt={alt}
                className="w-full aspect-square object-cover rounded-lg"
              />
              {images.length > 1 && (
                <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                  {images.slice(1, 5).map((img, index) => (
                    <img 
                      key={index}
                      src={img} 
                      alt={`${alt} ${index + 2}`}
                      className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                    />
                  ))}
                  {images.length > 5 && (
                    <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center text-xs text-slate-500 flex-shrink-0">
                      +{images.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-white border-l border-b border-slate-200 rotate-45" />
          </div>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setShowLightbox(false)}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button 
                className="absolute left-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button 
                className="absolute right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev + 1) % images.length);
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Main image */}
          <img 
            src={images[selectedIndex]} 
            alt={alt}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-xl">
              {images.map((img, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                    index === selectedIndex 
                      ? "border-white scale-110" 
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(index);
                  }}
                >
                  <img 
                    src={img} 
                    alt={`${alt} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
