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
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-11 h-11 sm:w-14 sm:h-14',
    lg: 'w-16 h-16 sm:w-20 sm:h-20',
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

      {/* Lightbox - fully responsive */}
      {showLightbox && (
        <div 
          className="fixed inset-0 bg-black z-[100] flex items-center justify-center touch-none"
          onClick={() => setShowLightbox(false)}
        >
          {/* Close button - larger touch target */}
          <button 
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white/80 hover:text-white p-2 sm:p-3 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors z-20"
            onClick={() => setShowLightbox(false)}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 text-white/80 text-xs sm:text-sm bg-black/50 px-2 sm:px-3 py-1 rounded-full z-20">
            {selectedIndex + 1} / {images.length}
          </div>

          {/* Navigation - hidden on mobile, use tap zones */}
          {images.length > 1 && (
            <>
              <button 
                className="absolute left-2 sm:left-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
              >
                <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
              </button>
              <button 
                className="absolute right-2 sm:right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev + 1) % images.length);
                }}
              >
                <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
              </button>
            </>
          )}

          {/* Main image with tap zones for mobile */}
          <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
            {/* Left tap zone */}
            {images.length > 1 && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-1/4 sm:hidden z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
              />
            )}
            
            <img 
              src={images[selectedIndex]} 
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-lg select-none"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />

            {/* Right tap zone */}
            {images.length > 1 && (
              <div 
                className="absolute right-0 top-0 bottom-0 w-1/4 sm:hidden z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev + 1) % images.length);
                }}
              />
            )}
          </div>

          {/* Thumbnails - scrollable on mobile */}
          {images.length > 1 && (
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 bg-black/50 p-1.5 sm:p-2 rounded-lg sm:rounded-xl max-w-[90vw] overflow-x-auto scrollbar-hide">
              {images.map((img, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-md sm:rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                    index === selectedIndex 
                      ? "border-white scale-105 sm:scale-110" 
                      : "border-transparent opacity-60 hover:opacity-100 active:opacity-100"
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
        </div>
      )}
    </>
  );
}
