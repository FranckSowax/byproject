"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Truck, Plus, X } from 'lucide-react';
import { SupplierImageUpload } from './SupplierImageUpload';

interface PriceVariation {
  id: string;
  label: string; // Ex: "Petite taille", "Grande taille", "Standard"
  amount: string;
  notes: string;
}

interface PriceFormData {
  country: string;
  supplierType: 'new' | 'existing';
  supplierName: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  email: string;
  wechat: string;
  amount: string;
  currency: string;
  notes: string;
  variations: PriceVariation[];
  shippingLength: string;
  shippingWidth: string;
  shippingHeight: string;
  shippingWeight: string;
  unitsPerPackage: string;
  productImages: string[];
}

interface PriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialName: string;
  onSubmit: (data: PriceFormData) => Promise<void>;
  language: 'fr' | 'en' | 'zh';
  existingPrice?: {
    amount: number;
    currency: string;
    country: string;
    notes?: string;
    variations?: PriceVariation[];
  };
}

const translations = {
  fr: {
    title: 'Ajouter un Prix',
    subtitle: 'Ajoutez un nouveau prix pour',
    country: 'Pays',
    selectCountry: 'Sélectionner un pays',
    supplier: 'Fournisseur',
    newSupplier: 'Nouveau fournisseur',
    existingSupplier: 'Fournisseur existant',
    supplierName: 'Nom du fournisseur',
    contactName: 'Nom du contact',
    phone: 'Téléphone',
    whatsapp: 'WhatsApp',
    email: 'Email',
    wechat: 'WeChat',
    amount: 'Montant',
    currency: 'Devise',
    notes: 'Notes',
    notesPlaceholder: 'MOQ, délais, conditions, etc.',
    shipping: 'Colisage & Logistique',
    shippingInfo: 'Ces informations permettent d\'estimer les coûts de transport maritime ou aérien',
    length: 'Longueur (cm)',
    width: 'Largeur (cm)',
    height: 'Hauteur (cm)',
    weight: 'Poids unitaire (kg)',
    unitsPerPackage: 'Unités par colis',
    productPhotos: 'Photos du Produit',
    variations: 'Variations de Prix',
    variationsInfo: 'Ajoutez différents prix pour différentes tailles/quantités',
    addVariation: 'Ajouter une variation',
    variationLabel: 'Label',
    variationLabelPlaceholder: 'Ex: Petite taille, Grande taille...',
    variationAmount: 'Prix',
    variationNotes: 'Notes',
    removeVariation: 'Supprimer',
    cancel: 'Annuler',
    add: 'Ajouter',
    required: '*',
  },
  en: {
    title: 'Add Price',
    subtitle: 'Add a new price for',
    country: 'Country',
    selectCountry: 'Select a country',
    supplier: 'Supplier',
    newSupplier: 'New supplier',
    existingSupplier: 'Existing supplier',
    supplierName: 'Supplier name',
    contactName: 'Contact name',
    phone: 'Phone',
    whatsapp: 'WhatsApp',
    email: 'Email',
    wechat: 'WeChat',
    amount: 'Amount',
    currency: 'Currency',
    notes: 'Notes',
    notesPlaceholder: 'MOQ, lead time, conditions, etc.',
    shipping: 'Packaging & Logistics',
    shippingInfo: 'This information helps estimate sea or air freight costs',
    length: 'Length (cm)',
    width: 'Width (cm)',
    height: 'Height (cm)',
    weight: 'Unit weight (kg)',
    unitsPerPackage: 'Units per package',
    productPhotos: 'Product Photos',
    variations: 'Price Variations',
    variationsInfo: 'Add different prices for different sizes/quantities',
    addVariation: 'Add variation',
    variationLabel: 'Label',
    variationLabelPlaceholder: 'Ex: Small size, Large size...',
    variationAmount: 'Price',
    variationNotes: 'Notes',
    removeVariation: 'Remove',
    cancel: 'Cancel',
    add: 'Add',
    required: '*',
  },
  zh: {
    title: '添加价格',
    subtitle: '为以下产品添加新价格',
    country: '国家',
    selectCountry: '选择国家',
    supplier: '供应商',
    newSupplier: '新供应商',
    existingSupplier: '现有供应商',
    supplierName: '供应商名称',
    contactName: '联系人姓名',
    phone: '电话',
    whatsapp: 'WhatsApp',
    email: '电子邮件',
    wechat: '微信',
    amount: '金额',
    currency: '货币',
    notes: '备注',
    notesPlaceholder: '最小起订量、交货时间、条件等',
    shipping: '包装与物流',
    shippingInfo: '此信息有助于估算海运或空运成本',
    length: '长度（厘米）',
    width: '宽度（厘米）',
    height: '高度（厘米）',
    weight: '单位重量（公斤）',
    unitsPerPackage: '每包装单位数',
    productPhotos: '产品照片',
    variations: '价格变化',
    variationsInfo: '为不同尺寸/数量添加不同价格',
    addVariation: '添加变化',
    variationLabel: '标签',
    variationLabelPlaceholder: '例如：小尺寸、大尺寸...',
    variationAmount: '价格',
    variationNotes: '备注',
    removeVariation: '删除',
    cancel: '取消',
    add: '添加',
    required: '*',
  },
};

const countries = [
  { value: 'China', label: { fr: 'Chine', en: 'China', zh: '中国' } },
  { value: 'USA', label: { fr: 'États-Unis', en: 'USA', zh: '美国' } },
  { value: 'France', label: { fr: 'France', en: 'France', zh: '法国' } },
  { value: 'Germany', label: { fr: 'Allemagne', en: 'Germany', zh: '德国' } },
  { value: 'Italy', label: { fr: 'Italie', en: 'Italy', zh: '意大利' } },
  { value: 'Spain', label: { fr: 'Espagne', en: 'Spain', zh: '西班牙' } },
];

const currencies = ['CNY', 'USD', 'EUR', 'GBP', 'JPY'];

export function PriceModal({
  isOpen,
  onClose,
  materialName,
  onSubmit,
  language,
  existingPrice,
}: PriceModalProps) {
  const t = translations[language];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PriceFormData>({
    country: 'China',
    supplierType: 'new',
    supplierName: '',
    contactName: '',
    phone: '',
    whatsapp: '',
    email: '',
    wechat: '',
    amount: '',
    currency: 'CNY',
    notes: '',
    variations: [],
    shippingLength: '',
    shippingWidth: '',
    shippingHeight: '',
    shippingWeight: '',
    unitsPerPackage: '1',
    productImages: [],
  });

  // Update form when modal opens with existing price
  useEffect(() => {
    if (isOpen && existingPrice) {
      setFormData(prev => ({
        ...prev,
        country: existingPrice.country || 'China',
        amount: existingPrice.amount?.toString() || '',
        currency: existingPrice.currency || 'CNY',
        notes: existingPrice.notes || '',
        variations: existingPrice.variations || [],
      }));
    } else if (isOpen && !existingPrice) {
      // Reset form for new price
      setFormData({
        country: 'China',
        supplierType: 'new',
        supplierName: '',
        contactName: '',
        phone: '',
        whatsapp: '',
        email: '',
        wechat: '',
        amount: '',
        currency: 'CNY',
        notes: '',
        variations: [],
        shippingLength: '',
        shippingWidth: '',
        shippingHeight: '',
        shippingWeight: '',
        unitsPerPackage: '1',
        productImages: [],
      });
    }
  }, [isOpen, existingPrice]);

  const handleSubmit = async () => {
    // Only require amount - supplier info already exists
    if (!formData.amount) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        country: 'China',
        supplierType: 'new',
        supplierName: '',
        contactName: '',
        phone: '',
        whatsapp: '',
        email: '',
        wechat: '',
        amount: '',
        currency: 'CNY',
        notes: '',
        variations: [],
        shippingLength: '',
        shippingWidth: '',
        shippingHeight: '',
        shippingWeight: '',
        unitsPerPackage: '1',
        productImages: [],
      });
    } catch (error) {
      console.error('Error submitting price:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t.title}</DialogTitle>
          <DialogDescription>
            {t.subtitle} <span className="font-semibold">{materialName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Country */}
          <div>
            <Label htmlFor="country">{t.country} {t.required}</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => setFormData({ ...formData, country: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t.selectCountry} />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label[language]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supplier Type */}
          <div>
            <Label>{t.supplier} {t.required}</Label>
            <RadioGroup
              value={formData.supplierType}
              onValueChange={(value: 'new' | 'existing') =>
                setFormData({ ...formData, supplierType: value })
              }
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="font-normal cursor-pointer">
                  {t.newSupplier}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing" className="font-normal cursor-pointer">
                  {t.existingSupplier}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Supplier Info - Hidden, already created */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplierName">{t.supplierName} {t.required}</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contactName">{t.contactName} {t.required}</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="mt-1"
              />
            </div>
          </div> */}

          {/* Contact Info - Hidden */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">{t.whatsapp}</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="mt-1"
              />
            </div>
          </div> */}

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="wechat">{t.wechat}</Label>
              <Input
                id="wechat"
                value={formData.wechat}
                onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                className="mt-1"
              />
            </div>
          </div> */}

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">{t.amount} {t.required}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="currency">{t.currency}</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">{t.notes}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t.notesPlaceholder}
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Shipping */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <Label className="text-base font-semibold">{t.shipping}</Label>
            </div>
            <p className="text-xs text-gray-500 mb-4">{t.shippingInfo}</p>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="length">{t.length}</Label>
                <Input
                  id="length"
                  type="number"
                  value={formData.shippingLength}
                  onChange={(e) => setFormData({ ...formData, shippingLength: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="width">{t.width}</Label>
                <Input
                  id="width"
                  type="number"
                  value={formData.shippingWidth}
                  onChange={(e) => setFormData({ ...formData, shippingWidth: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="height">{t.height}</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.shippingHeight}
                  onChange={(e) => setFormData({ ...formData, shippingHeight: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="weight">{t.weight}</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.shippingWeight}
                  onChange={(e) => setFormData({ ...formData, shippingWeight: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="units">{t.unitsPerPackage}</Label>
                <Input
                  id="units"
                  type="number"
                  value={formData.unitsPerPackage}
                  onChange={(e) => setFormData({ ...formData, unitsPerPackage: e.target.value })}
                  placeholder="1"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Price Variations */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label className="text-base font-semibold">{t.variations}</Label>
                <p className="text-xs text-gray-500 mt-1">{t.variationsInfo}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newVariation: PriceVariation = {
                    id: Date.now().toString(),
                    label: '',
                    amount: '',
                    notes: '',
                  };
                  setFormData({ ...formData, variations: [...formData.variations, newVariation] });
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.addVariation}
              </Button>
            </div>

            {formData.variations.length > 0 && (
              <div className="space-y-3 mt-4">
                {formData.variations.map((variation, index) => (
                  <div key={variation.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        {language === 'fr' ? 'Variation' : language === 'en' ? 'Variation' : '变化'} {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            variations: formData.variations.filter((_, i) => i !== index),
                          });
                        }}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`var-label-${index}`} className="text-xs">
                          {t.variationLabel}
                        </Label>
                        <Input
                          id={`var-label-${index}`}
                          value={variation.label}
                          onChange={(e) => {
                            const newVariations = [...formData.variations];
                            newVariations[index].label = e.target.value;
                            setFormData({ ...formData, variations: newVariations });
                          }}
                          placeholder={t.variationLabelPlaceholder}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`var-amount-${index}`} className="text-xs">
                          {t.variationAmount}
                        </Label>
                        <Input
                          id={`var-amount-${index}`}
                          type="number"
                          step="0.01"
                          value={variation.amount}
                          onChange={(e) => {
                            const newVariations = [...formData.variations];
                            newVariations[index].amount = e.target.value;
                            setFormData({ ...formData, variations: newVariations });
                          }}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label htmlFor={`var-notes-${index}`} className="text-xs">
                        {t.variationNotes}
                      </Label>
                      <Input
                        id={`var-notes-${index}`}
                        value={variation.notes}
                        onChange={(e) => {
                          const newVariations = [...formData.variations];
                          newVariations[index].notes = e.target.value;
                          setFormData({ ...formData, variations: newVariations });
                        }}
                        placeholder={t.notesPlaceholder}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Images */}
          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">{t.productPhotos}</Label>
            <SupplierImageUpload
              supplierImages={formData.productImages}
              onSupplierImagesChange={(images) =>
                setFormData({ ...formData, productImages: images })
              }
              maxImages={5}
              bucket="project-materials"
              path="supplier-products"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.amount}
          >
            {isSubmitting ? '...' : t.add}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
