"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, MessageSquare, Image as ImageIcon, Edit2, Trash2, Plus, Package, ChevronLeft, ChevronRight, Send, Camera, Save, Check, MapPin, Phone, User, Globe, Building } from "lucide-react";
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
  surface?: number | null;
  weight?: number | null;
  volume?: number | null;
  specs: any;
  images?: string[];
}

interface PricePhoto {
  id: string;
  url: string;
  created_at?: string;
}

interface Price {
  id: number;
  amount: number;
  currency: string;
  country: string;
  supplier?: {
    id?: string;
    name: string;
    country?: string;
    contact_name?: string;
    phone?: string;
    whatsapp?: string;
    wechat?: string;
    email?: string;
  };
  notes?: string;
  created_at: string;
  converted_amount?: number;
  photos?: PricePhoto[];
}

interface Comment {
  id: string;
  content: string;
  user_name: string;
  created_at: string;
}

interface MaterialDetailModalProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  prices: Price[];
  comments: Comment[];
  onSave: (material: Partial<Material>) => Promise<void>;
  onDelete: () => void;
  onAddPrice: (price: any) => Promise<void>;
  onDeletePrice?: (priceId: number) => Promise<void>;
  onAddComment: (content: string) => Promise<void>;
  onUploadImage: (file: File) => Promise<string | null>;
  onDeleteImage?: (imageUrl: string) => Promise<void>;
  onUploadPricePhoto?: (priceId: number, file: File) => Promise<string | null>;
  onDeletePricePhoto?: (priceId: number, photoUrl: string) => Promise<void>;
}

type Tab = 'details' | 'prices' | 'comments' | 'photos';

const COUNTRIES = [
  { value: 'Cameroun', label: '🇨🇲 Cameroun', currency: 'FCFA' },
  { value: 'Chine', label: '🇨🇳 Chine', currency: 'CNY' },
  { value: 'Turquie', label: '🇹🇷 Turquie', currency: 'TRY' },
  { value: 'Dubai', label: '🇦🇪 Dubai', currency: 'AED' },
  { value: 'France', label: '🇫🇷 France', currency: 'EUR' },
  { value: 'Allemagne', label: '🇩🇪 Allemagne', currency: 'EUR' },
  { value: 'Italie', label: '🇮🇹 Italie', currency: 'EUR' },
  { value: 'Espagne', label: '🇪🇸 Espagne', currency: 'EUR' },
  { value: 'USA', label: '🇺🇸 USA', currency: 'USD' },
  { value: 'Inde', label: '🇮🇳 Inde', currency: 'INR' },
  { value: 'Sénégal', label: '🇸🇳 Sénégal', currency: 'FCFA' },
  { value: 'Côte d\'Ivoire', label: '🇨🇮 Côte d\'Ivoire', currency: 'FCFA' },
];

const CURRENCIES = ['FCFA', 'EUR', 'USD', 'CNY', 'TRY', 'AED', 'INR', 'GBP'];

export function MaterialDetailModal({
  material,
  isOpen,
  onClose,
  prices,
  comments,
  onSave,
  onDelete,
  onAddPrice,
  onDeletePrice,
  onAddComment,
  onUploadImage,
  onDeleteImage,
  onUploadPricePhoto,
  onDeletePricePhoto,
}: MaterialDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showAddPrice, setShowAddPrice] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [expandedPriceId, setExpandedPriceId] = useState<number | null>(null);

  // Editable fields
  const [editData, setEditData] = useState<Partial<Material>>({});
  
  // New price form
  const [newPrice, setNewPrice] = useState({
    amount: '',
    currency: 'FCFA',
    country: 'Cameroun',
    supplier_name: '',
    contact_name: '',
    phone: '',
    whatsapp: '',
    wechat: '',
    email: '',
    notes: '',
  });

  useEffect(() => {
    if (material && isOpen) {
      setEditData({
        name: material.name,
        description: material.description,
        category: material.category,
        quantity: material.quantity,
        surface: material.surface,
        weight: material.weight,
        volume: material.volume,
      });
      setIsEditing(false);
      setActiveTab('details');
    }
  }, [material, isOpen]);

  if (!material) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ id: material.id, ...editData });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPrice = async () => {
    if (!newPrice.amount) return;
    setIsSaving(true);
    try {
      await onAddPrice({
        ...newPrice,
        amount: parseFloat(newPrice.amount),
      });
      setNewPrice({
        amount: '',
        currency: 'FCFA',
        country: 'Cameroun',
        supplier_name: '',
        contact_name: '',
        phone: '',
        whatsapp: '',
        wechat: '',
        email: '',
        notes: '',
      });
      setShowAddPrice(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSaving(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCountryChange = (country: string) => {
    const countryData = COUNTRIES.find(c => c.value === country);
    setNewPrice({
      ...newPrice,
      country,
      currency: countryData?.currency || 'FCFA',
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'details', label: 'Détails', icon: <Package className="h-4 w-4" /> },
    { id: 'prices', label: 'Prix', icon: <DollarSign className="h-4 w-4" />, count: prices.length },
    { id: 'comments', label: 'Notes', icon: <MessageSquare className="h-4 w-4" />, count: comments.length },
    { id: 'photos', label: 'Photos', icon: <ImageIcon className="h-4 w-4" />, count: material.images?.length || 0 },
  ];

  // Group prices by country
  const pricesByCountry = prices.reduce((acc, price) => {
    if (!acc[price.country]) acc[price.country] = [];
    acc[price.country].push(price);
    return acc;
  }, {} as Record<string, Price[]>);

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Modal - centered on desktop, slide-up on mobile */}
      <div 
        className={cn(
          "fixed z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 ease-out",
          // Mobile: full screen slide-up
          "inset-0 sm:inset-auto",
          // Desktop: centered modal
          "sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:w-[90vw] sm:max-w-[900px] sm:h-[85vh] sm:max-h-[800px] sm:rounded-2xl",
          isOpen 
            ? "translate-y-0 sm:scale-100 opacity-100" 
            : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-200 px-4 sm:px-6 pb-4 pt-2 sm:pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="text-lg sm:text-xl font-bold h-auto py-1 px-2 -ml-2"
                  placeholder="Nom du matériau"
                />
              ) : (
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 line-clamp-2">{material.name}</h2>
              )}
              
              <div className="flex flex-wrap gap-1.5 mt-2">
                {isEditing ? (
                  <Input
                    value={editData.category || ''}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="h-7 text-xs w-32"
                    placeholder="Catégorie"
                  />
                ) : material.category ? (
                  <Badge className="bg-violet-100 text-violet-700 border-0 text-xs">{material.category}</Badge>
                ) : null}
                
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-orange-500" />
                    <Input
                      type="number"
                      value={editData.quantity || ''}
                      onChange={(e) => setEditData({ ...editData, quantity: parseFloat(e.target.value) || null })}
                      className="h-7 text-xs w-20"
                      placeholder="Qté"
                    />
                  </div>
                ) : material.quantity ? (
                  <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    {material.quantity}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isEditing ? (
                <>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 h-8 sm:h-9"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      setEditData({
                        name: material.name,
                        description: material.description,
                        category: material.category,
                        quantity: material.quantity,
                        surface: material.surface,
                        weight: material.weight,
                        volume: material.volume,
                      });
                      setIsEditing(false);
                    }}
                    className="h-8 sm:h-9"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="h-8 sm:h-9"
                  >
                    <Edit2 className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Modifier</span>
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={onClose}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-slate-100 p-1 rounded-lg overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 active:bg-white/50"
                )}
              >
                <span className="flex-shrink-0">{tab.icon}</span>
                <span className="hidden xs:inline">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs",
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Description */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Description</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value || null })}
                    placeholder="Spécifications, caractéristiques, notes..."
                    className="min-h-[100px] resize-none"
                  />
                ) : (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 min-h-[60px]">
                    {material.description || <span className="text-slate-400 italic">Aucune description</span>}
                  </p>
                )}
              </div>

              {/* Dimensions grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Quantité</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.quantity || ''}
                      onChange={(e) => setEditData({ ...editData, quantity: parseFloat(e.target.value) || null })}
                      placeholder="0"
                      className="h-9"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-slate-900">{material.quantity || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Surface (m²)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.surface || ''}
                      onChange={(e) => setEditData({ ...editData, surface: parseFloat(e.target.value) || null })}
                      placeholder="0"
                      className="h-9"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-slate-900">{material.surface || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Poids (kg)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.weight || ''}
                      onChange={(e) => setEditData({ ...editData, weight: parseFloat(e.target.value) || null })}
                      placeholder="0"
                      className="h-9"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-slate-900">{material.weight || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Volume (m³)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.volume || ''}
                      onChange={(e) => setEditData({ ...editData, volume: parseFloat(e.target.value) || null })}
                      placeholder="0"
                      className="h-9"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-slate-900">{material.volume || '-'}</p>
                  )}
                </div>
              </div>

              {/* Image preview */}
              {material.images && material.images.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Aperçu</Label>
                  <div 
                    className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 cursor-pointer group max-w-md"
                    onClick={() => setShowLightbox(true)}
                  >
                    <img 
                      src={material.images[0]} 
                      alt={material.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {material.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        +{material.images.length - 1} photos
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                <div 
                  className="bg-emerald-50 rounded-xl p-4 text-center cursor-pointer hover:bg-emerald-100 transition-colors"
                  onClick={() => setActiveTab('prices')}
                >
                  <DollarSign className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-emerald-700">{prices.length}</p>
                  <p className="text-xs text-emerald-600">Prix collectés</p>
                </div>
                <div 
                  className="bg-blue-50 rounded-xl p-4 text-center cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => setActiveTab('comments')}
                >
                  <MessageSquare className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-700">{comments.length}</p>
                  <p className="text-xs text-blue-600">Notes</p>
                </div>
              </div>
            </div>
          )}

          {/* Prices Tab */}
          {activeTab === 'prices' && (
            <div className="space-y-4">
              {/* Add price button or form */}
              {!showAddPrice ? (
                <Button 
                  onClick={() => setShowAddPrice(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un prix
                </Button>
              ) : (
                <div className="bg-emerald-50 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau prix
                  </h3>
                  
                  {/* Country & Currency */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Pays *</Label>
                      <select
                        value={newPrice.country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Devise</Label>
                      <select
                        value={newPrice.currency}
                        onChange={(e) => setNewPrice({ ...newPrice, currency: e.target.value })}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {CURRENCIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <Label className="text-xs">Montant *</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={newPrice.amount}
                      onChange={(e) => setNewPrice({ ...newPrice, amount: e.target.value })}
                      placeholder="0.00"
                      className="h-10 text-lg font-semibold"
                    />
                  </div>

                  {/* Supplier info */}
                  <div className="border-t border-emerald-200 pt-4">
                    <h4 className="text-sm font-medium text-emerald-700 mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Fournisseur (optionnel)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nom du fournisseur</Label>
                        <Input
                          value={newPrice.supplier_name}
                          onChange={(e) => setNewPrice({ ...newPrice, supplier_name: e.target.value })}
                          placeholder="Ex: Alibaba, Fournisseur local..."
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Contact</Label>
                        <Input
                          value={newPrice.contact_name}
                          onChange={(e) => setNewPrice({ ...newPrice, contact_name: e.target.value })}
                          placeholder="Nom du contact"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Téléphone</Label>
                        <Input
                          value={newPrice.phone}
                          onChange={(e) => setNewPrice({ ...newPrice, phone: e.target.value })}
                          placeholder="+237..."
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">WhatsApp</Label>
                        <Input
                          value={newPrice.whatsapp}
                          onChange={(e) => setNewPrice({ ...newPrice, whatsapp: e.target.value })}
                          placeholder="+237..."
                          className="h-9"
                        />
                      </div>
                      {newPrice.country === 'Chine' && (
                        <div>
                          <Label className="text-xs">WeChat</Label>
                          <Input
                            value={newPrice.wechat}
                            onChange={(e) => setNewPrice({ ...newPrice, wechat: e.target.value })}
                            placeholder="ID WeChat"
                            className="h-9"
                          />
                        </div>
                      )}
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          value={newPrice.email}
                          onChange={(e) => setNewPrice({ ...newPrice, email: e.target.value })}
                          placeholder="email@exemple.com"
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      value={newPrice.notes}
                      onChange={(e) => setNewPrice({ ...newPrice, notes: e.target.value })}
                      placeholder="Conditions, délais de livraison, MOQ..."
                      className="h-20 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddPrice(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleAddPrice}
                      disabled={!newPrice.amount || isSaving}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSaving ? 'Ajout...' : 'Ajouter'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Price list by country */}
              {Object.entries(pricesByCountry).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(pricesByCountry).map(([country, countryPrices]) => (
                    <div key={country} className="space-y-2">
                      <h3 className="font-semibold text-base flex items-center gap-2 text-slate-700">
                        <MapPin className="h-4 w-4" />
                        {country}
                        <Badge variant="secondary" className="text-xs">{countryPrices.length}</Badge>
                      </h3>
                      
                      {countryPrices.map((price) => (
                        <div 
                          key={price.id} 
                          className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-emerald-300 transition-colors"
                        >
                          {/* Price header - clickable to expand */}
                          <div 
                            className="p-4 cursor-pointer"
                            onClick={() => setExpandedPriceId(expandedPriceId === price.id ? null : price.id)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xl font-bold text-slate-900">
                                    {price.amount.toLocaleString()} {price.currency}
                                  </p>
                                  {price.photos && price.photos.length > 0 && (
                                    <Badge className="bg-violet-100 text-violet-700 border-0 text-xs">
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      {price.photos.length}
                                    </Badge>
                                  )}
                                </div>
                                {price.converted_amount && price.currency !== 'FCFA' && (
                                  <p className="text-sm text-slate-500">
                                    ≈ {Math.round(price.converted_amount).toLocaleString()} FCFA
                                  </p>
                                )}
                                
                                {price.supplier && (
                                  <div className="mt-2 space-y-1">
                                    <p className="font-medium text-sm text-slate-700">{price.supplier.name}</p>
                                    {price.supplier.contact_name && (
                                      <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <User className="h-3 w-3" /> {price.supplier.contact_name}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                      {price.supplier.phone && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="h-3 w-3" /> {price.supplier.phone}
                                        </span>
                                      )}
                                      {price.supplier.whatsapp && (
                                        <span>💬 {price.supplier.whatsapp}</span>
                                      )}
                                      {price.supplier.wechat && (
                                        <span>WeChat: {price.supplier.wechat}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {price.notes && (
                                  <p className="text-sm text-slate-500 mt-2 italic bg-slate-50 p-2 rounded">
                                    {price.notes}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {new Date(price.created_at).toLocaleDateString('fr-FR')}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  {onDeletePrice && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeletePrice(price.id);
                                      }}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <ChevronRight className={cn(
                                    "h-5 w-5 text-slate-400 transition-transform",
                                    expandedPriceId === price.id && "rotate-90"
                                  )} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded section with photos */}
                          {expandedPriceId === price.id && (
                            <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-3">
                              {/* Photos grid */}
                              {price.photos && price.photos.length > 0 && (
                                <div>
                                  <Label className="text-xs text-slate-500 mb-2 block">Photos du fournisseur</Label>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {price.photos.map((photo, index) => (
                                      <div 
                                        key={photo.id || index}
                                        className="relative aspect-square rounded-lg overflow-hidden bg-slate-200 cursor-pointer group"
                                        onClick={() => {
                                          setLightboxImages(price.photos!.map(p => p.url));
                                          setSelectedImageIndex(index);
                                          setShowLightbox(true);
                                        }}
                                      >
                                        <img 
                                          src={photo.url} 
                                          alt={`Photo ${index + 1}`}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                        />
                                        {onDeletePricePhoto && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeletePricePhoto(price.id, photo.url);
                                            }}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Upload photo button */}
                              {onUploadPricePhoto && (
                                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
                                  <Camera className="h-4 w-4 text-slate-400" />
                                  <span className="text-xs text-slate-600">Ajouter une photo</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={async (e) => {
                                      if (e.target.files?.[0]) {
                                        await onUploadPricePhoto(price.id, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>
                              )}

                              {/* No photos message */}
                              {(!price.photos || price.photos.length === 0) && !onUploadPricePhoto && (
                                <p className="text-xs text-slate-400 text-center py-2">
                                  Aucune photo pour ce prix
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : !showAddPrice && (
                <div className="text-center py-8 text-slate-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>Aucun prix enregistré</p>
                  <p className="text-sm">Ajoutez votre premier prix</p>
                </div>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Comment input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ajouter une note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 h-20 resize-none"
                />
                <Button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSaving}
                  className="self-end bg-blue-600 hover:bg-blue-700 h-10 w-10 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments list */}
              {comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-blue-900">{comment.user_name}</span>
                        <span className="text-xs text-blue-600">
                          {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>Aucune note</p>
                </div>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              {/* Upload button */}
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors">
                <Camera className="h-5 w-5 text-slate-400" />
                <span className="text-sm text-slate-600">Ajouter une photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      await onUploadImage(e.target.files[0]);
                    }
                  }}
                />
              </label>

              {/* Photo grid */}
              {material.images && material.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {material.images.map((img, index) => (
                    <div 
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer group"
                      onClick={() => {
                        setLightboxImages(material.images || []);
                        setSelectedImageIndex(index);
                        setShowLightbox(true);
                      }}
                    >
                      <img 
                        src={img} 
                        alt={`${material.name} ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {onDeleteImage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteImage(img);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>Aucune photo</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex gap-2 justify-between">
            <Button 
              variant="outline" 
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Supprimer</span>
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox - supports both material images and price photos */}
      {showLightbox && (lightboxImages.length > 0 || (material.images && material.images.length > 0)) && (
        <div 
          className="fixed inset-0 bg-black z-[60] flex items-center justify-center touch-none"
          onClick={() => {
            setShowLightbox(false);
            setLightboxImages([]);
          }}
        >
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:bg-white/20 h-10 w-10 z-10"
            onClick={() => {
              setShowLightbox(false);
              setLightboxImages([]);
            }}
          >
            <X className="h-5 w-5" />
          </Button>

          {(() => {
            const images = lightboxImages.length > 0 ? lightboxImages : (material.images || []);
            return images.length > 1 && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full">
                {selectedImageIndex + 1} / {images.length}
              </div>
            );
          })()}

          {(() => {
            const images = lightboxImages.length > 0 ? lightboxImages : (material.images || []);
            return (
              <>
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  {images.length > 1 && (
                    <>
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-1/4 sm:hidden z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
                        }}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="absolute left-4 text-white hover:bg-white/20 hidden sm:flex"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
                        }}
                      >
                        <ChevronLeft className="h-8 w-8" />
                      </Button>
                    </>
                  )}
                  
                  <img 
                    src={images[selectedImageIndex]} 
                    alt={material.name}
                    className="max-w-full max-h-full object-contain select-none"
                    onClick={(e) => e.stopPropagation()}
                    draggable={false}
                  />

                  {images.length > 1 && (
                    <>
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1/4 sm:hidden z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex((prev) => (prev + 1) % images.length);
                        }}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="absolute right-4 text-white hover:bg-white/20 hidden sm:flex"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex((prev) => (prev + 1) % images.length);
                        }}
                      >
                        <ChevronRight className="h-8 w-8" />
                      </Button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          index === selectedImageIndex ? "bg-white scale-110" : "bg-white/40"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(index);
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </>
  );
}
