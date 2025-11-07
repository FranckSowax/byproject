"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Globe, Save, Send, CheckCircle, AlertCircle, Building2, Package, DollarSign, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

type Language = 'fr' | 'en' | 'zh';

interface Material {
  id: string;
  name: string;
  translatedName?: string;
  category: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  description?: string;
  images?: string[];
  supplierComments?: string;
}

interface SupplierRequest {
  id: string;
  request_number: string;
  project_name: string;
  materials_data: Material[];
  materials_translated_en: Material[];
  materials_translated_zh: Material[];
  total_materials: number;
  status: string;
  expires_at: string | null;
}

const translations = {
  fr: {
    title: 'Demande de Cotation',
    subtitle: 'Veuillez remplir les prix pour chaque matériau',
    requestNumber: 'Numéro de demande',
    projectName: 'Projet',
    supplierInfo: 'Informations Fournisseur',
    companyName: 'Nom de l\'entreprise',
    contactName: 'Nom du contact',
    email: 'Email',
    phone: 'Téléphone',
    country: 'Pays',
    materials: 'Liste des Matériaux',
    material: 'Matériau',
    category: 'Catégorie',
    quantity: 'Quantité',
    unit: 'Unité',
    unitPrice: 'Prix unitaire',
    totalPrice: 'Prix total',
    notes: 'Notes',
    progress: 'Progression',
    filled: 'remplis',
    saveDraft: 'Sauvegarder brouillon',
    submit: 'Soumettre la cotation',
    submitted: 'Cotation soumise avec succès !',
    expired: 'Cette demande a expiré',
    notFound: 'Demande introuvable',
    currency: 'Devise',
    optional: 'optionnel',
    description: 'Description',
    images: 'Images',
    addImage: 'Ajouter une image',
    supplierComments: 'Commentaires fournisseur',
  },
  en: {
    title: 'Quotation Request',
    subtitle: 'Please fill in the prices for each material',
    requestNumber: 'Request Number',
    projectName: 'Project',
    supplierInfo: 'Supplier Information',
    companyName: 'Company Name',
    contactName: 'Contact Name',
    email: 'Email',
    phone: 'Phone',
    country: 'Country',
    materials: 'Materials List',
    material: 'Material',
    category: 'Category',
    quantity: 'Quantity',
    unit: 'Unit',
    unitPrice: 'Unit Price',
    totalPrice: 'Total Price',
    notes: 'Notes',
    progress: 'Progress',
    filled: 'filled',
    saveDraft: 'Save Draft',
    submit: 'Submit Quotation',
    submitted: 'Quotation submitted successfully!',
    expired: 'This request has expired',
    notFound: 'Request not found',
    currency: 'Currency',
    optional: 'optional',
    description: 'Description',
    images: 'Images',
    addImage: 'Add image',
    supplierComments: 'Supplier comments',
  },
  zh: {
    title: '报价请求',
    subtitle: '请填写每种材料的价格',
    requestNumber: '请求编号',
    projectName: '项目',
    supplierInfo: '供应商信息',
    companyName: '公司名称',
    contactName: '联系人姓名',
    email: '电子邮件',
    phone: '电话',
    country: '国家',
    materials: '材料清单',
    material: '材料',
    category: '类别',
    quantity: '数量',
    unit: '单位',
    unitPrice: '单价',
    totalPrice: '总价',
    notes: '备注',
    progress: '进度',
    filled: '已填写',
    saveDraft: '保存草稿',
    submit: '提交报价',
    submitted: '报价提交成功！',
    expired: '此请求已过期',
    notFound: '未找到请求',
    currency: '货币',
    optional: '可选',
    description: '描述',
    images: '图片',
    addImage: '添加图片',
    supplierComments: '供应商备注',
  },
};

export default function SupplierQuotePage() {
  const params = useParams();
  const token = params.token as string;
  
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<SupplierRequest | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [supplierInfo, setSupplierInfo] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    country: 'China',
  });
  const [currency, setCurrency] = useState('CNY');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const t = translations[language];

  useEffect(() => {
    loadRequest();
  }, [token]);

  const loadRequest = async () => {
    try {
      const response = await fetch(`/api/supplier-quote/${token}`);
      if (!response.ok) throw new Error('Request not found');
      
      const data = await response.json();
      setRequest(data.request);
      
      // Load materials based on language
      const materialsData = language === 'zh' 
        ? data.request.materials_translated_zh 
        : language === 'en'
        ? data.request.materials_translated_en
        : data.request.materials_data;
      
      setMaterials(materialsData.map((m: any) => ({
        ...m,
        unitPrice: m.unitPrice || '',
        totalPrice: m.totalPrice || '',
        notes: m.notes || '',
      })));

      // Load existing quote if any
      if (data.existingQuote) {
        setSupplierInfo({
          companyName: data.existingQuote.supplier_company || '',
          contactName: data.existingQuote.supplier_name || '',
          email: data.existingQuote.supplier_email || '',
          phone: '',
          country: data.existingQuote.supplier_country || 'China',
        });
        setCurrency(data.existingQuote.currency || 'CNY');
        setNotes(data.existingQuote.notes || '');
        setMaterials(data.existingQuote.quoted_materials || materialsData);
      }
    } catch (error) {
      console.error('Error loading request:', error);
      toast.error(t.notFound);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate total price
    if (field === 'unitPrice' || field === 'quantity') {
      const unitPrice = parseFloat(updated[index].unitPrice as any) || 0;
      const quantity = updated[index].quantity || 0;
      updated[index].totalPrice = unitPrice * quantity;
    }
    
    setMaterials(updated);
  };

  const calculateProgress = () => {
    const filled = materials.filter(m => m.unitPrice && parseFloat(m.unitPrice as any) > 0).length;
    return Math.round((filled / materials.length) * 100);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/supplier-quote/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierInfo,
          materials,
          currency,
          notes,
          status: 'draft',
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!supplierInfo.companyName || !supplierInfo.contactName || !supplierInfo.email) {
      toast.error('Please fill in all supplier information');
      return;
    }

    const filledMaterials = materials.filter(m => m.unitPrice && parseFloat(m.unitPrice as any) > 0);
    if (filledMaterials.length === 0) {
      toast.error('Please fill in at least one material price');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/supplier-quote/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierInfo,
          materials,
          currency,
          notes,
          status: 'submitted',
        }),
      });

      if (!response.ok) throw new Error('Failed to submit');
      
      setSubmitted(true);
      toast.success(t.submitted);
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Failed to submit quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="max-w-md">
          <CardHeader>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-center">{t.notFound}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-center text-2xl">{t.submitted}</CardTitle>
            <CardDescription className="text-center">
              {language === 'zh' ? '感谢您的报价！' : language === 'en' ? 'Thank you for your quotation!' : 'Merci pour votre cotation !'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-green-800">
                {language === 'zh' 
                  ? '项目所有者将收到通知并审核您的报价。'
                  : language === 'en'
                  ? 'The project owner will be notified and review your quotation.'
                  : 'Le propriétaire du projet sera notifié et examinera votre cotation.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = calculateProgress();
  const filledCount = materials.filter(m => m.unitPrice && parseFloat(m.unitPrice as any) > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
              <p className="text-gray-600">{t.subtitle}</p>
            </div>
            
            {/* Language Switcher */}
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-500" />
              <div className="flex gap-1">
                <Button
                  variant={language === 'fr' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLanguage('fr')}
                >
                  FR
                </Button>
                <Button
                  variant={language === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLanguage('en')}
                >
                  EN
                </Button>
                <Button
                  variant={language === 'zh' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLanguage('zh')}
                >
                  中文
                </Button>
              </div>
            </div>
          </div>

          {/* Request Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">{t.requestNumber}</p>
              <p className="font-mono font-bold text-blue-600">{request.request_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t.projectName}</p>
              <p className="font-semibold">{request.project_name || 'Construction Project'}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t.progress}</span>
              <span className="text-sm text-gray-600">
                {filledCount} / {materials.length} {t.filled}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Supplier Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t.supplierInfo}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">{t.companyName} *</Label>
                <Input
                  id="companyName"
                  value={supplierInfo.companyName}
                  onChange={(e) => setSupplierInfo({ ...supplierInfo, companyName: e.target.value })}
                  placeholder={language === 'zh' ? '公司名称' : 'Company Name'}
                />
              </div>
              <div>
                <Label htmlFor="contactName">{t.contactName} *</Label>
                <Input
                  id="contactName"
                  value={supplierInfo.contactName}
                  onChange={(e) => setSupplierInfo({ ...supplierInfo, contactName: e.target.value })}
                  placeholder={language === 'zh' ? '联系人' : 'Contact Name'}
                />
              </div>
              <div>
                <Label htmlFor="email">{t.email} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={supplierInfo.email}
                  onChange={(e) => setSupplierInfo({ ...supplierInfo, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">{t.phone} ({t.optional})</Label>
                <Input
                  id="phone"
                  value={supplierInfo.phone}
                  onChange={(e) => setSupplierInfo({ ...supplierInfo, phone: e.target.value })}
                  placeholder="+86 ..."
                />
              </div>
              <div>
                <Label htmlFor="country">{t.country}</Label>
                <Input
                  id="country"
                  value={supplierInfo.country}
                  onChange={(e) => setSupplierInfo({ ...supplierInfo, country: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="currency">{t.currency}</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="CNY, USD, EUR..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materials List */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t.materials}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {materials.map((material, index) => (
                <div key={material.id} className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                  {/* Material Header with Image */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Image Preview */}
                    {material.images && material.images.length > 0 ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 border-blue-200 shadow-sm">
                        <img 
                          src={material.images[0]} 
                          alt={material.name}
                          className="w-full h-full object-cover"
                        />
                        {material.images.length > 1 && (
                          <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-tl font-medium">
                            +{material.images.length - 1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <ImageIcon className="h-10 w-10 text-blue-400" />
                      </div>
                    )}
                    
                    {/* Material Info */}
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs text-gray-600">{t.material}</Label>
                      <p className="font-bold text-lg mt-1 text-gray-900">
                        {language === 'zh' || language === 'en' ? material.translatedName : material.name}
                      </p>
                      {material.category && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {material.category}
                        </Badge>
                      )}
                      {material.description && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          {material.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Image Gallery (if multiple images) */}
                  {material.images && material.images.length > 1 && (
                    <div className="mb-4 pb-4 border-b">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="h-4 w-4 text-blue-600" />
                        <Label className="text-xs font-semibold text-gray-700">
                          {t.images} ({material.images.length})
                        </Label>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {material.images.map((imageUrl, imgIndex) => (
                          <div 
                            key={imgIndex}
                            className="relative aspect-square rounded-md overflow-hidden border border-gray-200 hover:border-blue-400 transition-all cursor-pointer group"
                            onClick={() => window.open(imageUrl, '_blank')}
                          >
                            <img 
                              src={imageUrl} 
                              alt={`${material.name} - ${imgIndex + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">{t.quantity}</Label>
                      <p className="font-semibold mt-1">{material.quantity}</p>
                    </div>
                    <div>
                      <Label htmlFor={`unitPrice-${index}`} className="text-xs">
                        {t.unitPrice} ({currency}) *
                      </Label>
                      <Input
                        id={`unitPrice-${index}`}
                        type="number"
                        step="0.01"
                        value={material.unitPrice || ''}
                        onChange={(e) => handleMaterialChange(index, 'unitPrice', e.target.value)}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">{t.totalPrice}</Label>
                      <div className="flex items-center h-10 px-3 bg-blue-50 rounded-md mt-1">
                        <DollarSign className="h-4 w-4 text-blue-600 mr-1" />
                        <span className="font-bold text-blue-900">
                          {material.totalPrice ? material.totalPrice.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`notes-${index}`} className="text-xs">
                        {t.notes}
                      </Label>
                      <Input
                        id={`notes-${index}`}
                        value={material.notes || ''}
                        onChange={(e) => handleMaterialChange(index, 'notes', e.target.value)}
                        placeholder={language === 'zh' ? '备注' : 'Notes'}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* General Notes */}
            <div className="mt-6 pt-6 border-t">
              <Label htmlFor="generalNotes">{t.notes} ({t.optional})</Label>
              <Textarea
                id="generalNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder={language === 'zh' ? '添加备注或特殊条件...' : language === 'en' ? 'Add notes or special conditions...' : 'Ajoutez des notes ou conditions spéciales...'}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : t.saveDraft}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : t.submit}
          </Button>
        </div>
      </div>
    </div>
  );
}
