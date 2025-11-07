"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Globe, CheckCircle, AlertCircle, Building2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { MaterialCard } from '@/components/supplier/MaterialCard';
import { DescriptionModal } from '@/components/supplier/DescriptionModal';
import { PriceModal } from '@/components/supplier/PriceModal';
import { EditMaterialModal } from '@/components/supplier/EditMaterialModal';
import { createClient } from '@/lib/supabase/client';

type Language = 'fr' | 'en' | 'zh';

interface Price {
  id: number;
  amount: number;
  currency: string;
  supplier_name: string;
  country: string;
}

interface Material {
  id: string;
  name: string;
  translatedName?: string;
  description: string | null;
  translatedDescription?: string;
  category: string | null;
  quantity: number | null;
  surface: number | null;
  weight: number | null;
  volume: number | null;
  images: string[];
  supplierImages?: string[];
  prices?: Price[];
}

interface SupplierRequest {
  id: string;
  request_number: string;
  project_name: string;
  status: string;
  expires_at: string | null;
  materials_data: Material[];
  materials_translated_en: Material[];
  materials_translated_zh: Material[];
}

interface SupplierInfo {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
}

const translations = {
  fr: {
    title: 'Demande de Cotation',
    subtitle: 'Veuillez remplir les prix pour chaque matériau',
    requestNumber: 'Numéro de demande',
    project: 'Projet',
    progress: 'Progression',
    materials: 'Liste des Matériaux',
    supplierInfo: 'Informations Fournisseur',
    companyName: 'Nom de l\'entreprise',
    contactName: 'Nom du contact',
    email: 'Email',
    phone: 'Téléphone',
    country: 'Pays',
    submit: 'Soumettre la Cotation',
    submitted: 'Cotation Soumise',
    notFound: 'Demande non trouvée',
    expired: 'Cette demande a expiré',
  },
  en: {
    title: 'Quotation Request',
    subtitle: 'Please fill in prices for each material',
    requestNumber: 'Request number',
    project: 'Project',
    progress: 'Progress',
    materials: 'Materials List',
    supplierInfo: 'Supplier Information',
    companyName: 'Company name',
    contactName: 'Contact name',
    email: 'Email',
    phone: 'Phone',
    country: 'Country',
    submit: 'Submit Quotation',
    submitted: 'Quotation Submitted',
    notFound: 'Request not found',
    expired: 'This request has expired',
  },
  zh: {
    title: '报价请求',
    subtitle: '请为每种材料填写价格',
    requestNumber: '请求编号',
    project: '项目',
    progress: '进度',
    materials: '材料清单',
    supplierInfo: '供应商信息',
    companyName: '公司名称',
    contactName: '联系人姓名',
    email: '电子邮件',
    phone: '电话',
    country: '国家',
    submit: '提交报价',
    submitted: '报价已提交',
    notFound: '未找到请求',
    expired: '此请求已过期',
  },
};

export default function SupplierQuotePage() {
  const params = useParams();
  const token = params.token as string;
  const supabase = createClient();

  const [language, setLanguage] = useState<Language>('fr');
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<SupplierRequest | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    country: 'China',
  });
  const [submitted, setSubmitted] = useState(false);

  // Modal states
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const t = translations[language];

  useEffect(() => {
    loadRequest();
  }, [token, language]);

  const loadRequest = async () => {
    try {
      setLoading(true);
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

      // Load prices for each material
      const materialsWithPrices = await Promise.all(
        (materialsData || []).map(async (material: Material) => {
          const { data: prices } = await supabase
            .from('prices')
            .select(`
              id,
              amount,
              currency,
              country,
              suppliers (
                name
              )
            `)
            .eq('material_id', material.id);

          return {
            ...material,
            prices: prices?.map((p: any) => ({
              id: p.id,
              amount: p.amount,
              currency: p.currency,
              country: p.country,
              supplier_name: p.suppliers?.name || '',
            })) || [],
          };
        })
      );

      setMaterials(materialsWithPrices);
    } catch (error) {
      console.error('Error loading request:', error);
      toast.error(t.notFound);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDescription = (material: Material) => {
    setSelectedMaterial(material);
    setIsDescriptionModalOpen(true);
  };

  const handleOpenPrice = (material: Material) => {
    setSelectedMaterial(material);
    setIsPriceModalOpen(true);
  };

  const handleOpenEdit = (material: Material) => {
    setSelectedMaterial(material);
    setIsEditModalOpen(true);
  };

  const handleSubmitPrice = async (priceData: any) => {
    try {
      // Create or get supplier
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .upsert({
          name: priceData.supplierName,
          contact_name: priceData.contactName,
          phone: priceData.phone,
          whatsapp: priceData.whatsapp,
          email: priceData.email,
          wechat: priceData.wechat,
          country: priceData.country,
        })
        .select()
        .single();

      if (supplierError) throw supplierError;

      // Create price
      const { error: priceError } = await supabase
        .from('prices')
        .insert({
          material_id: selectedMaterial?.id,
          supplier_id: supplier.id,
          country: priceData.country,
          amount: parseFloat(priceData.amount),
          currency: priceData.currency,
          notes: priceData.notes,
        });

      if (priceError) throw priceError;

      // Save product images if any
      if (priceData.productImages && priceData.productImages.length > 0) {
        // TODO: Save images to photos table
      }

      toast.success(language === 'fr' ? 'Prix ajouté' : language === 'en' ? 'Price added' : '价格已添加');
      loadRequest(); // Reload to update
    } catch (error) {
      console.error('Error submitting price:', error);
      toast.error(language === 'fr' ? 'Erreur' : language === 'en' ? 'Error' : '错误');
    }
  };

  const handleEditMaterial = async (data: Partial<Material>) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({
          name: data.name,
          description: data.description,
          category: data.category,
          quantity: data.quantity,
          surface: data.surface,
          weight: data.weight,
          volume: data.volume,
        })
        .eq('id', selectedMaterial?.id);

      if (error) throw error;

      toast.success(language === 'fr' ? 'Matériau mis à jour' : language === 'en' ? 'Material updated' : '材料已更新');
      loadRequest(); // Reload to update
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error(language === 'fr' ? 'Erreur' : language === 'en' ? 'Error' : '错误');
    }
  };

  const handleSubmitQuotation = async () => {
    if (!supplierInfo.companyName || !supplierInfo.contactName || !supplierInfo.email) {
      toast.error(language === 'fr' ? 'Veuillez remplir toutes les informations' : language === 'en' ? 'Please fill all information' : '请填写所有信息');
      return;
    }

    try {
      // Create supplier quote
      const { error } = await supabase
        .from('supplier_quotes')
        .insert({
          supplier_request_id: request?.id,
          supplier_name: supplierInfo.contactName,
          supplier_email: supplierInfo.email,
          supplier_company: supplierInfo.companyName,
          supplier_country: supplierInfo.country,
          quoted_materials: materials,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success(t.submitted);
    } catch (error) {
      console.error('Error submitting quotation:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la soumission' : language === 'en' ? 'Submission error' : '提交错误');
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
        </Card>
      </div>
    );
  }

  const progress = 0; // TODO: Calculate based on filled prices

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
              <p className="text-sm text-gray-600">{t.project}</p>
              <p className="font-semibold text-gray-900">{request.project_name}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t.progress}</span>
              <span className="text-sm font-medium text-blue-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Supplier Info */}
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
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contactName">{t.contactName} *</Label>
                <Input
                  id="contactName"
                  value={supplierInfo.contactName}
                  onChange={(e) => setSupplierInfo({ ...supplierInfo, contactName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">{t.email} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={supplierInfo.email}
                  onChange={(e) => setSupplierInfo({ ...supplierInfo, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">{t.phone}</Label>
                <Input
                  id="phone"
                  value={supplierInfo.phone}
                  onChange={(e) => setSupplierInfo({ ...supplierInfo, phone: e.target.value })}
                  className="mt-1"
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
              <Badge variant="secondary" className="ml-auto">
                {materials.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {materials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  language={language}
                  onOpenDescription={() => handleOpenDescription(material)}
                  onOpenPrice={() => handleOpenPrice(material)}
                  onOpenEdit={() => handleOpenEdit(material)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitQuotation}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {t.submit}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <DescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        material={selectedMaterial}
        language={language}
      />

      <PriceModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        materialName={selectedMaterial?.name || ''}
        onSubmit={handleSubmitPrice}
        language={language}
      />

      <EditMaterialModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        material={selectedMaterial}
        onSubmit={handleEditMaterial}
        language={language}
      />
    </div>
  );
}
