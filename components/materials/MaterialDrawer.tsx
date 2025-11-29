"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, MessageSquare, Image as ImageIcon, Edit, Trash2, Plus, Package, ChevronLeft, ChevronRight, Send, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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

interface Price {
  id: number;
  amount: number;
  currency: string;
  country: string;
  supplier?: {
    name: string;
    country: string;
  };
  notes?: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_name: string;
  created_at: string;
}

interface MaterialDrawerProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  prices: Price[];
  comments: Comment[];
  onAddPrice: (price: any) => Promise<void>;
  onAddComment: (content: string) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  onUploadImage: (file: File) => Promise<void>;
  isLoading?: boolean;
}

type Tab = 'details' | 'prices' | 'comments' | 'photos';

export function MaterialDrawer({
  material,
  isOpen,
  onClose,
  prices,
  comments,
  onAddPrice,
  onAddComment,
  onEdit,
  onDelete,
  onUploadImage,
  isLoading = false,
}: MaterialDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // Quick price form
  const [showQuickPrice, setShowQuickPrice] = useState(false);
  const [quickPrice, setQuickPrice] = useState({
    amount: '',
    currency: 'EUR',
    country: 'Chine',
    supplier_name: '',
    notes: '',
  });

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('details');
      setNewComment('');
      setShowQuickPrice(false);
    }
  }, [isOpen]);

  if (!material) return null;

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPrice = async () => {
    if (!quickPrice.amount) return;
    setIsSubmitting(true);
    try {
      await onAddPrice(quickPrice);
      setQuickPrice({ amount: '', currency: 'EUR', country: 'Chine', supplier_name: '', notes: '' });
      setShowQuickPrice(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'details', label: 'Détails', icon: <Package className="h-4 w-4" /> },
    { id: 'prices', label: 'Prix', icon: <DollarSign className="h-4 w-4" />, count: prices.length },
    { id: 'comments', label: 'Notes', icon: <MessageSquare className="h-4 w-4" />, count: comments.length },
    { id: 'photos', label: 'Photos', icon: <ImageIcon className="h-4 w-4" />, count: material.images?.length || 0 },
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={cn(
          "fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:h-full sm:w-[480px] md:w-[520px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col",
          isOpen ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"
        )}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-200 px-3 sm:px-4 pb-3 sm:pb-4 pt-1 sm:pt-4">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 line-clamp-2 sm:truncate">{material.name}</h2>
              {material.description && (
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2">{material.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                {material.category && (
                  <Badge className="bg-violet-100 text-violet-700 border-0 text-xs">{material.category}</Badge>
                )}
                {material.quantity && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                    <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    {material.quantity}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 -mt-1 -mr-1">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Tabs - scrollable on mobile */}
          <div className="flex gap-0.5 sm:gap-1 mt-3 sm:mt-4 bg-slate-100 p-0.5 sm:p-1 rounded-lg overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 active:bg-white/50"
                )}
              >
                <span className="flex-shrink-0">{tab.icon}</span>
                <span className="hidden xs:inline truncate">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    "ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0 sm:py-0.5 rounded-full text-[10px] sm:text-xs flex-shrink-0",
                    activeTab === tab.id ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-600"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 overscroll-contain">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-3 sm:space-y-4">
              {/* Image preview */}
              {material.images && material.images.length > 0 && (
                <div 
                  className="relative aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 cursor-pointer group active:scale-[0.99] transition-transform"
                  onClick={() => setShowLightbox(true)}
                >
                  <img 
                    src={material.images[0]} 
                    alt={material.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {material.images.length > 1 && (
                    <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 bg-black/70 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      +{material.images.length - 1} photos
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              )}

              {/* Specs */}
              {material.specs && Object.keys(material.specs).length > 0 && (
                <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base text-slate-900 mb-2 sm:mb-3">Spécifications</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {Object.entries(material.specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs sm:text-sm gap-2">
                        <span className="text-slate-500 capitalize truncate">{key.replace(/_/g, ' ')}</span>
                        <span className="text-slate-900 font-medium text-right">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center active:bg-emerald-100 transition-colors" onClick={() => setActiveTab('prices')}>
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 mx-auto mb-0.5 sm:mb-1" />
                  <p className="text-xl sm:text-2xl font-bold text-emerald-700">{prices.length}</p>
                  <p className="text-[10px] sm:text-xs text-emerald-600">Prix collectés</p>
                </div>
                <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center active:bg-blue-100 transition-colors" onClick={() => setActiveTab('comments')}>
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mx-auto mb-0.5 sm:mb-1" />
                  <p className="text-xl sm:text-2xl font-bold text-blue-700">{comments.length}</p>
                  <p className="text-[10px] sm:text-xs text-blue-600">Notes</p>
                </div>
              </div>
            </div>
          )}

          {/* Prices Tab */}
          {activeTab === 'prices' && (
            <div className="space-y-3 sm:space-y-4">
              {/* Quick add price */}
              {!showQuickPrice ? (
                <Button 
                  onClick={() => setShowQuickPrice(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 h-10 sm:h-11 text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
                  Ajouter un prix
                </Button>
              ) : (
                <div className="bg-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-[10px] sm:text-xs">Montant</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={quickPrice.amount}
                        onChange={(e) => setQuickPrice({ ...quickPrice, amount: e.target.value })}
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                    <div className="w-20 sm:w-24">
                      <Label className="text-[10px] sm:text-xs">Devise</Label>
                      <select
                        value={quickPrice.currency}
                        onChange={(e) => setQuickPrice({ ...quickPrice, currency: e.target.value })}
                        className="w-full h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
                      >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="CNY">CNY</option>
                        <option value="FCFA">FCFA</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] sm:text-xs">Fournisseur</Label>
                    <Input
                      placeholder="Nom du fournisseur"
                      value={quickPrice.supplier_name}
                      onChange={(e) => setQuickPrice({ ...quickPrice, supplier_name: e.target.value })}
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] sm:text-xs">Notes</Label>
                    <Textarea
                      placeholder="Notes optionnelles..."
                      value={quickPrice.notes}
                      onChange={(e) => setQuickPrice({ ...quickPrice, notes: e.target.value })}
                      className="h-14 sm:h-16 resize-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowQuickPrice(false)}
                      className="flex-1 h-9 sm:h-10 text-sm"
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleSubmitPrice}
                      disabled={!quickPrice.amount || isSubmitting}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-9 sm:h-10 text-sm"
                    >
                      {isSubmitting ? "..." : "Enregistrer"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Price list */}
              {prices.length > 0 ? (
                <div className="space-y-2">
                  {prices.map((price) => (
                    <div key={price.id} className="bg-white border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-emerald-300 active:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-base sm:text-lg font-bold text-slate-900">
                            {price.amount.toLocaleString()} {price.currency}
                          </p>
                          {price.supplier && (
                            <p className="text-xs sm:text-sm text-slate-600 truncate">{price.supplier.name}</p>
                          )}
                          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">{price.country}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0">
                          {new Date(price.created_at).toLocaleDateString('fr-FR')}
                        </Badge>
                      </div>
                      {price.notes && (
                        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 sm:mt-2 italic line-clamp-2">{price.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-slate-500">
                  <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-1.5 sm:mb-2 text-slate-300" />
                  <p className="text-sm">Aucun prix enregistré</p>
                </div>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-3 sm:space-y-4">
              {/* Comment input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ajouter une note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 h-16 sm:h-20 resize-none text-sm"
                />
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="self-end bg-blue-600 hover:bg-blue-700 active:bg-blue-800 h-9 w-9 sm:h-10 sm:w-10 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments list */}
              {comments.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
                        <span className="font-medium text-xs sm:text-sm text-blue-900 truncate">{comment.user_name}</span>
                        <span className="text-[10px] sm:text-xs text-blue-600 flex-shrink-0">
                          {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-slate-500">
                  <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-1.5 sm:mb-2 text-slate-300" />
                  <p className="text-sm">Aucune note</p>
                </div>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-3 sm:space-y-4">
              {/* Upload button */}
              <label className="flex items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 border-2 border-dashed border-slate-300 rounded-lg sm:rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50 active:bg-violet-100 transition-colors">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                <span className="text-xs sm:text-sm text-slate-600">Ajouter une photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      onUploadImage(e.target.files[0]);
                    }
                  }}
                />
              </label>

              {/* Photo grid */}
              {material.images && material.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {material.images.map((img, index) => (
                    <div 
                      key={index}
                      className="aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 cursor-pointer group active:scale-[0.98] transition-transform"
                      onClick={() => {
                        setSelectedImageIndex(index);
                        setShowLightbox(true);
                      }}
                    >
                      <img 
                        src={img} 
                        alt={`${material.name} ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-slate-500">
                  <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-1.5 sm:mb-2 text-slate-300" />
                  <p className="text-sm">Aucune photo</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 border-t border-slate-200 p-3 sm:p-4 bg-slate-50 safe-area-inset-bottom">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onEdit} className="flex-1 h-10 sm:h-11 text-sm">
              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Modifier
            </Button>
            <Button variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 h-10 sm:h-11 w-10 sm:w-11 p-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox - fully responsive with swipe support */}
      {showLightbox && material.images && material.images.length > 0 && (
        <div 
          className="fixed inset-0 bg-black z-[60] flex items-center justify-center touch-none"
          onClick={() => setShowLightbox(false)}
        >
          {/* Close button - larger touch target on mobile */}
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12 z-10"
            onClick={() => setShowLightbox(false)}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>

          {/* Image counter */}
          {material.images.length > 1 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 text-white/80 text-xs sm:text-sm bg-black/50 px-2 py-1 rounded-full">
              {selectedImageIndex + 1} / {material.images.length}
            </div>
          )}

          {material.images.length > 1 && (
            <>
              {/* Left arrow - hidden on mobile, use swipe instead */}
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute left-2 sm:left-4 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12 hidden sm:flex"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev - 1 + material.images!.length) % material.images!.length);
                }}
              >
                <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
              </Button>
              {/* Right arrow - hidden on mobile, use swipe instead */}
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute right-2 sm:right-4 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12 hidden sm:flex"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev + 1) % material.images!.length);
                }}
              >
                <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
              </Button>
            </>
          )}

          {/* Main image - tap sides to navigate on mobile */}
          <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
            {/* Left tap zone on mobile */}
            {material.images.length > 1 && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-1/4 sm:hidden z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev - 1 + material.images!.length) % material.images!.length);
                }}
              />
            )}
            
            <img 
              src={material.images[selectedImageIndex]} 
              alt={material.name}
              className="max-w-full max-h-full object-contain select-none"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />

            {/* Right tap zone on mobile */}
            {material.images.length > 1 && (
              <div 
                className="absolute right-0 top-0 bottom-0 w-1/4 sm:hidden z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev + 1) % material.images!.length);
                }}
              />
            )}
          </div>

          {/* Dots indicator */}
          {material.images.length > 1 && (
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
              {material.images.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all",
                    index === selectedImageIndex 
                      ? "bg-white scale-110" 
                      : "bg-white/40 hover:bg-white/60"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(index);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
