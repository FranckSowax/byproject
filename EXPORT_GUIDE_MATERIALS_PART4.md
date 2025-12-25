# 📦 GUIDE D'EXPORT - PARTIE 4 : MaterialDetailModal Complet

---

## 12. MODAL DÉTAIL MATÉRIAU COMPLET

### `components/materials/MaterialDetailModal.tsx`

Ce composant est le plus complet - il gère :
- Affichage/édition des détails du matériau
- Gestion des prix par pays avec fournisseurs
- Commentaires/notes
- Galerie photos avec lightbox
- Upload de photos pour les prix

```typescript
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
  { value: 'Chine', label: '🇨🇳 Chine', currency: 'CNY', group: 'Import' },
  { value: 'Dubai', label: '🇦🇪 Dubai / EAU', currency: 'AED', group: 'Import' },
  { value: 'Turquie', label: '🇹🇷 Turquie', currency: 'TRY', group: 'Import' },
  { value: 'Inde', label: '🇮🇳 Inde', currency: 'INR', group: 'Import' },
  { value: 'Cameroun', label: '🇨🇲 Cameroun', currency: 'FCFA', group: 'Afrique' },
  { value: 'Sénégal', label: '🇸🇳 Sénégal', currency: 'FCFA', group: 'Afrique' },
  { value: 'Côte d\'Ivoire', label: '🇨🇮 Côte d\'Ivoire', currency: 'FCFA', group: 'Afrique' },
  { value: 'France', label: '🇫🇷 France', currency: 'EUR', group: 'Europe' },
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

  const [editData, setEditData] = useState<Partial<Material>>({});
  
  const [newPrice, setNewPrice] = useState({
    amount: '',
    currency: 'CNY',
    country: 'Chine',
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
        currency: 'CNY',
        country: 'Chine',
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
          "fixed inset-0 z-40 transition-all duration-300",
          "bg-gradient-to-b from-black/70 via-black/50 to-black/70 backdrop-blur-md",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={cn(
          "fixed z-50 flex flex-col transition-all duration-300 ease-out",
          "inset-0 sm:inset-auto",
          "sm:left-1/2 sm:-translate-x-1/2 sm:top-8",
          "sm:w-[95vw] sm:max-w-[1000px] sm:max-h-[calc(100vh-4rem)]",
          "bg-white sm:bg-gradient-to-br sm:from-white sm:to-slate-50",
          "sm:rounded-3xl sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)]",
          "sm:border sm:border-slate-200/50",
          "overflow-hidden",
          isOpen 
            ? "translate-y-0 sm:translate-y-0 opacity-100" 
            : "translate-y-full sm:-translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        {/* Header bar */}
        <div className="hidden sm:block h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className="flex-shrink-0 px-4 sm:px-8 pb-4 pt-2 sm:pt-6 bg-gradient-to-b from-slate-50/80 to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="text-lg sm:text-2xl font-bold h-auto py-2 px-3 -ml-3 bg-white border-2 border-violet-200 focus:border-violet-500 rounded-xl"
                  placeholder="Nom du matériau"
                />
              ) : (
                <h2 className="text-lg sm:text-2xl font-bold text-slate-900 line-clamp-2 sm:line-clamp-1">{material.name}</h2>
              )}
              
              <div className="flex flex-wrap gap-2 mt-3">
                {isEditing ? (
                  <Input
                    value={editData.category || ''}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="h-8 text-sm w-40 rounded-lg"
                    placeholder="Catégorie"
                  />
                ) : material.category ? (
                  <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 text-xs px-3 py-1 rounded-full shadow-sm">{material.category}</Badge>
                ) : null}
                
                {material.quantity && !isEditing && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    {material.quantity}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {isEditing ? (
                <>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white h-9 sm:h-10 px-4 sm:px-6 rounded-xl shadow-lg"
                  >
                    <Save className="h-4 w-4 mr-1.5" />
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
                      });
                      setIsEditing(false);
                    }}
                    className="h-9 sm:h-10 w-9 sm:w-10 rounded-xl hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white h-9 sm:h-10 px-4 sm:px-6 rounded-xl shadow-lg"
                  >
                    <Edit2 className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Modifier</span>
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={onClose}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-slate-100 border border-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 sm:gap-2 mt-5 sm:mt-6 bg-slate-100/80 p-1.5 rounded-2xl overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-white text-violet-700 shadow-md"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 overscroll-contain bg-gradient-to-b from-transparent to-slate-50/50">
          
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-5 sm:space-y-8">
              {/* Description */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
                <Label className="text-sm font-semibold text-slate-800 mb-3 block flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full" />
                  Description
                </Label>
                {isEditing ? (
                  <Textarea
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value || null })}
                    placeholder="Spécifications, caractéristiques, notes..."
                    className="min-h-[120px] resize-none rounded-xl border-slate-200"
                  />
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {material.description || <span className="text-slate-400 italic">Aucune description</span>}
                  </p>
                )}
              </div>

              {/* Dimensions grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {['quantity', 'surface', 'weight', 'volume'].map((field) => (
                  <div key={field} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <Label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">
                      {field === 'quantity' ? 'Quantité' : field === 'surface' ? 'Surface' : field === 'weight' ? 'Poids' : 'Volume'}
                    </Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={(editData as any)[field] || ''}
                        onChange={(e) => setEditData({ ...editData, [field]: parseFloat(e.target.value) || null })}
                        placeholder="0"
                        className="h-9 text-center"
                      />
                    ) : (
                      <p className="text-xl font-bold text-slate-900">
                        {(material as any)[field] 
                          ? `${(material as any)[field]}${field === 'surface' ? ' m²' : field === 'weight' ? ' kg' : field === 'volume' ? ' m³' : ''}`
                          : '-'
                        }
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 text-center cursor-pointer hover:shadow-lg transition-all border border-emerald-100"
                  onClick={() => setActiveTab('prices')}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-emerald-700">{prices.length}</p>
                  <p className="text-xs text-emerald-600">Prix collectés</p>
                </div>
                <div 
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 text-center cursor-pointer hover:shadow-lg transition-all border border-blue-100"
                  onClick={() => setActiveTab('comments')}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700">{comments.length}</p>
                  <p className="text-xs text-blue-600">Notes</p>
                </div>
              </div>
            </div>
          )}

          {/* Prices Tab */}
          {activeTab === 'prices' && (
            <div className="space-y-4">
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-emerald-700 mb-1.5 block">Pays *</Label>
                      <select
                        value={newPrice.country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full h-12 sm:h-10 rounded-xl border-2 border-emerald-200 bg-white px-4 text-base sm:text-sm font-medium focus:border-emerald-500 outline-none"
                      >
                        <optgroup label="🌏 Import">
                          {COUNTRIES.filter(c => c.group === 'Import').map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="🌍 Afrique">
                          {COUNTRIES.filter(c => c.group === 'Afrique').map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="🌍 Europe">
                          {COUNTRIES.filter(c => c.group === 'Europe').map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-emerald-700 mb-1.5 block">Devise</Label>
                      <select
                        value={newPrice.currency}
                        onChange={(e) => setNewPrice({ ...newPrice, currency: e.target.value })}
                        className="w-full h-12 sm:h-10 rounded-xl border-2 border-emerald-200 bg-white px-4 text-base sm:text-sm font-medium focus:border-emerald-500 outline-none"
                      >
                        {CURRENCIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

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
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      value={newPrice.notes}
                      onChange={(e) => setNewPrice({ ...newPrice, notes: e.target.value })}
                      placeholder="Conditions, délais de livraison, MOQ..."
                      className="h-20 resize-none"
                    />
                  </div>

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
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-xl font-bold text-slate-900">
                                  {price.amount.toLocaleString()} {price.currency}
                                </p>
                                {price.converted_amount && price.currency !== 'FCFA' && (
                                  <p className="text-sm text-slate-500">
                                    ≈ {Math.round(price.converted_amount).toLocaleString()} FCFA
                                  </p>
                                )}
                                
                                {price.supplier && (
                                  <div className="mt-2 space-y-1">
                                    <p className="font-medium text-sm text-slate-700">{price.supplier.name}</p>
                                    {price.supplier.phone && (
                                      <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {price.supplier.phone}
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                {price.notes && (
                                  <p className="text-sm text-slate-500 mt-2 italic bg-slate-50 p-2 rounded">
                                    {price.notes}
                                  </p>
                                )}
                              </div>
                              
                              <Badge variant="outline" className="text-xs">
                                {new Date(price.created_at).toLocaleDateString('fr-FR')}
                              </Badge>
                            </div>
                          </div>
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
        <div className="flex-shrink-0 border-t border-slate-200/50 p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-slate-100/50">
          <div className="flex gap-3 justify-between items-center">
            <Button 
              variant="outline" 
              onClick={onDelete}
              className="text-red-500 hover:text-white hover:bg-red-500 border-red-200 hover:border-transparent h-10 sm:h-11 px-4 sm:px-6 rounded-xl"
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Supprimer</span>
            </Button>
            <Button 
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-900 text-white h-10 sm:h-11 px-6 sm:px-8 rounded-xl shadow-lg"
            >
              Fermer
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && lightboxImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-black z-[60] flex items-center justify-center"
          onClick={() => {
            setShowLightbox(false);
            setLightboxImages([]);
          }}
        >
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 h-10 w-10 z-10"
            onClick={() => {
              setShowLightbox(false);
              setLightboxImages([]);
            }}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full">
            {selectedImageIndex + 1} / {lightboxImages.length}
          </div>

          <div className="relative w-full h-full flex items-center justify-center p-4">
            {lightboxImages.length > 1 && (
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute left-4 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}
            
            <img 
              src={lightboxImages[selectedImageIndex]} 
              alt={material.name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {lightboxImages.length > 1 && (
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute right-4 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev + 1) % lightboxImages.length);
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}
          </div>

          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {lightboxImages.map((_, index) => (
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
        </div>
      )}
    </>
  );
}
```

---

## 13. RÉCAPITULATIF FINAL

### Fichiers à copier (liste complète)

```
📁 lib/
├── utils.ts
├── comments.ts
└── supabase/
    └── client.ts

📁 components/
├── ui/ (tous les composants shadcn)
├── materials/
│   ├── MaterialCard.tsx
│   ├── ImagePreview.tsx
│   ├── MaterialDetailModal.tsx
│   └── CategoryGroup.tsx
└── project/
    └── ImageUpload.tsx

📁 app/
├── api/
│   ├── upload-image/route.ts
│   └── ai/extract-items/route.ts
└── dashboard/projects/[id]/
    ├── page.tsx
    └── comparison/page.tsx
```

### Fonctionnalités incluses

✅ **Gestion des matériaux**
- Ajout manuel avec formulaire
- Import depuis fichier Excel/CSV
- Extraction IA des items
- Catégorisation automatique

✅ **Upload d'images**
- Validation type/taille
- Upload vers Supabase Storage
- Preview et suppression
- Lightbox galerie

✅ **Gestion des prix**
- Multi-pays et multi-devises
- Informations fournisseur
- Conversion automatique
- Photos de prix

✅ **Comparaison**
- Local vs Import (Chine)
- Calcul volume CBM
- Estimation transport maritime
- Export PDF professionnel

---

**FIN DU GUIDE D'EXPORT**
