"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Globe, CheckCircle, AlertCircle, Building2, Package, Save } from 'lucide-react';
import { toast } from 'sonner';
import { MaterialCard } from '@/components/supplier/MaterialCard';
import { DescriptionModal } from '@/components/supplier/DescriptionModal';
import { PriceModal } from '@/components/supplier/PriceModal';
import { EditMaterialModal } from '@/components/supplier/EditMaterialModal';
import { createClient } from '@/lib/supabase/client';

type Language = 'fr' | 'en' | 'zh';

interface PriceVariation {
  id: string;
  label: string;
  labelFr?: string;
  amount: string;
  notes: string;
  notesFr?: string;
}

interface Price {
  id: number;
  amount: number;
  currency: string;
  supplier_name: string;
  country: string;
  variations: PriceVariation[];
}

interface MaterialComment {
  id: string;
  user_name: string;
  user_email: string;
  comment: string;
  created_at: string;
  translatedComment?: string;
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
  unavailable?: boolean;
  comments?: MaterialComment[];
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
  whatsapp: string;
  wechat: string;
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
    whatsapp: 'WhatsApp',
    wechat: 'WeChat',
    country: 'Pays',
    submit: 'Soumettre la Cotation',
    submitted: 'Cotation Soumise',
    notFound: 'Demande non trouvée',
    expired: 'Cette demande a expiré',
    saveDraft: 'Enregistrer le brouillon',
    draftSaved: 'Brouillon enregistré',
    saveError: 'Erreur lors de l\'enregistrement',
    loading: 'Chargement...',
    thankYou: 'Merci pour votre cotation !',
    part1Title: '📋 PARTIE 1 : Vos Informations',
    part1Subtitle: 'Remplissez vos coordonnées une seule fois. Elles seront sauvegardées automatiquement.',
    part2Title: '📦 PARTIE 2 : Cotation des Matériaux',
    part2Subtitle: 'Ajoutez vos prix pour chaque matériau. Vos données sont sauvegardées automatiquement à chaque ajout.',
    fillInfoFirst: 'Veuillez d\'abord remplir vos informations (Partie 1)',
    fillAllInfo: 'Veuillez remplir toutes les informations',
    atLeastEmail: 'Veuillez au moins renseigner votre email',
    addPriceOrUnavailable: 'Veuillez ajouter au moins un prix ou marquer des matériaux comme indisponibles',
    priceAdded: 'Prix ajouté',
    materialUpdated: 'Matériau mis à jour',
    markedUnavailable: 'Matériau marqué comme non disponible',
    markedAvailable: 'Matériau marqué comme disponible',
    submissionError: 'Erreur lors de la soumission',
    error: 'Erreur',
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
    whatsapp: 'WhatsApp',
    wechat: 'WeChat',
    country: 'Country',
    submit: 'Submit Quotation',
    submitted: 'Quotation Submitted',
    notFound: 'Request not found',
    expired: 'This request has expired',
    saveDraft: 'Save Draft',
    draftSaved: 'Draft saved',
    saveError: 'Error saving draft',
    loading: 'Loading...',
    thankYou: 'Thank you for your quotation!',
    part1Title: '📋 PART 1: Your Information',
    part1Subtitle: 'Fill in your contact details once. They will be saved automatically.',
    part2Title: '📦 PART 2: Materials Quotation',
    part2Subtitle: 'Add your prices for each material. Your data is saved automatically with each addition.',
    fillInfoFirst: 'Please fill in your information first (Part 1)',
    fillAllInfo: 'Please fill all information',
    atLeastEmail: 'Please provide at least your email',
    addPriceOrUnavailable: 'Please add at least one price or mark materials as unavailable',
    priceAdded: 'Price added',
    materialUpdated: 'Material updated',
    markedUnavailable: 'Material marked as unavailable',
    markedAvailable: 'Material marked as available',
    submissionError: 'Submission error',
    error: 'Error',
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
    contactName: '联系人',
    email: '电子邮件',
    whatsapp: 'WhatsApp',
    wechat: '微信',
    country: '国家',
    submit: '提交报价',
    submitted: '报价已提交',
    notFound: '未找到请求',
    expired: '此请求已过期',
    saveDraft: '保存草稿',
    draftSaved: '草稿已保存',
    saveError: '保存草稿时出错',
    loading: '加载中...',
    thankYou: '感谢您的报价！',
    part1Title: '📋 第一部分：您的信息',
    part1Subtitle: '填写一次您的联系方式。它们将自动保存。',
    part2Title: '📦 第二部分：材料报价',
    part2Subtitle: '为每种材料添加价格。每次添加时数据会自动保存。',
    fillInfoFirst: '请先填写您的信息（第一部分）',
    fillAllInfo: '请填写所有信息',
    atLeastEmail: '请至少提供您的电子邮件',
    addPriceOrUnavailable: '请至少添加一个价格或标记材料为不可用',
    priceAdded: '价格已添加',
    materialUpdated: '材料已更新',
    markedUnavailable: '材料标记为不可用',
    markedAvailable: '材料标记为可用',
    submissionError: '提交错误',
    error: '错误',
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
    whatsapp: '',
    wechat: '',
    country: 'China',
  });
  const [submitted, setSubmitted] = useState(false);
  const [currentSupplierId, setCurrentSupplierId] = useState<string | null>(null);

  // Modal states
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const t = translations[language];

  // Load supplier ID and info from localStorage on mount
  useEffect(() => {
    const storedSupplierId = localStorage.getItem(`supplier_id_${token}`);
    if (storedSupplierId) {
      setCurrentSupplierId(storedSupplierId);
    }
    
    // Load supplier info from localStorage
    const storedSupplierInfo = localStorage.getItem(`supplier_info_${token}`);
    if (storedSupplierInfo) {
      try {
        const parsedInfo = JSON.parse(storedSupplierInfo);
        setSupplierInfo(parsedInfo);
      } catch (error) {
        console.error('Error parsing stored supplier info:', error);
      }
    }
  }, [token]);

  useEffect(() => {
    loadRequest();
  }, [token, language, currentSupplierId]);

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

      // Load prices and availability for each material (only for current supplier)
      const materialsWithPrices = await Promise.all(
        (materialsData || []).map(async (material: Material) => {
          // Only load prices if we have a current supplier ID
          if (!currentSupplierId) {
            return {
              ...material,
              prices: [],
              unavailable: false,
            };
          }

          // Load material photos
          // @ts-ignore - Photos table not in generated types yet
          const { data: materialPhotos } = await supabase
            .from('photos' as any)
            .select('url')
            .eq('material_id', material.id)
            .eq('photo_type', 'material');

          // Load prices
          const { data: prices } = await supabase
            .from('prices')
            .select(`
              id,
              amount,
              currency,
              country,
              variations,
              suppliers (
                name
              )
            `)
            .eq('material_id', material.id)
            .eq('supplier_id', currentSupplierId); // Filter by current supplier

          // Load photos for each price
          const pricesWithPhotos = await Promise.all(
            (prices || []).map(async (price: any) => {
              // @ts-ignore - Photos table not in generated types yet
              const { data: pricePhotos } = await supabase
                .from('photos' as any)
                .select('url')
                .eq('price_id', price.id)
                .eq('photo_type', 'price');

              return {
                ...price,
                productImages: pricePhotos?.map((p: any) => p.url) || [],
              };
            })
          );

          // Load availability status
          // @ts-ignore - Table not in generated types yet
          const { data: availability, error: availError } = await supabase
            .from('supplier_material_availability' as any)
            .select('is_available')
            .eq('material_id', material.id)
            .eq('supplier_id', currentSupplierId)
            .maybeSingle();

          // Ignore 406 errors - table might not be accessible yet
          if (availError && availError.code !== 'PGRST116') {
            console.warn('Error loading availability:', availError);
          }

          // Debug log
          if (availability) {
            console.log(`Material ${material.name}: is_available=${availability.is_available}, unavailable=${availability.is_available === false}`);
          }

          return {
            ...material,
            supplierImages: materialPhotos?.map((p: any) => p.url) || [],
            prices: pricesWithPhotos.map((p: any) => ({
              id: p.id,
              amount: p.amount,
              currency: p.currency,
              country: p.country,
              supplier_name: p.suppliers?.name || '',
              variations: p.variations || [],
              productImages: p.productImages || [],
            })),
            unavailable: availability ? availability.is_available === false : false,
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

  const isSupplierInfoComplete = !!(
    supplierInfo.companyName && 
    supplierInfo.contactName && 
    supplierInfo.email
  );

  const handleOpenDescription = (material: Material) => {
    setSelectedMaterial(material);
    setIsDescriptionModalOpen(true);
  };

  const handleOpenPrice = (material: Material) => {
    if (!isSupplierInfoComplete) {
      toast.error(t.fillInfoFirst);
      const element = document.getElementById('supplier-info-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        // Highlight the section temporarily
        element.classList.add('ring-2', 'ring-red-500');
        setTimeout(() => element.classList.remove('ring-2', 'ring-red-500'), 2000);
      }
      return;
    }
    setSelectedMaterial(material);
    setIsPriceModalOpen(true);
  };

  const handleOpenEdit = (material: Material) => {
    setSelectedMaterial(material);
    setIsEditModalOpen(true);
  };

  const handleSubmitPrice = async (priceData: any) => {
    try {
      // Translate notes to French if needed
      let notesFr = priceData.notes;
      if (language !== 'fr' && priceData.notes) {
        try {
          const translateResponse = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: priceData.notes,
              sourceLanguage: language,
              targetLanguage: 'fr',
              context: 'Price notes and conditions',
            }),
          });
          if (translateResponse.ok) {
            const translateData = await translateResponse.json();
            notesFr = translateData.translatedText;
          }
        } catch (err) {
          console.warn('Translation failed, using original notes:', err);
        }
      }

      // Translate variation labels to French if needed
      let variationsFr = priceData.variations || [];
      if (language !== 'fr' && priceData.variations && priceData.variations.length > 0) {
        variationsFr = await Promise.all(
          priceData.variations.map(async (variation: any) => {
            let labelFr = variation.label;
            let notesFrVar = variation.notes;
            
            if (variation.label) {
              try {
                const response = await fetch('/api/translate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: variation.label,
                    sourceLanguage: language,
                    targetLanguage: 'fr',
                  }),
                });
                if (response.ok) {
                  const data = await response.json();
                  labelFr = data.translatedText;
                }
              } catch (err) {
                console.warn('Label translation failed:', err);
              }
            }

            if (variation.notes) {
              try {
                const response = await fetch('/api/translate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: variation.notes,
                    sourceLanguage: language,
                    targetLanguage: 'fr',
                  }),
                });
                if (response.ok) {
                  const data = await response.json();
                  notesFrVar = data.translatedText;
                }
              } catch (err) {
                console.warn('Variation notes translation failed:', err);
              }
            }

            return {
              ...variation,
              labelFr,
              notesFr: notesFrVar,
            };
          })
        );
      }

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

      // Store current supplier ID for filtering prices (only if it's new)
      if (!currentSupplierId) {
        setCurrentSupplierId(supplier.id);
        localStorage.setItem(`supplier_id_${token}`, supplier.id);
      }
      
      // Store supplier info for auto-fill on next visit
      const supplierInfoToSave = {
        companyName: priceData.supplierName,
        contactName: priceData.contactName,
        email: priceData.email,
        whatsapp: priceData.whatsapp,
        wechat: priceData.wechat,
        country: priceData.country,
      };
      localStorage.setItem(`supplier_info_${token}`, JSON.stringify(supplierInfoToSave));
      setSupplierInfo(supplierInfoToSave);

      // Create main price with French translation
      const { data: priceInserted, error: priceError } = await supabase
        .from('prices')
        .insert({
          material_id: selectedMaterial?.id,
          supplier_id: supplier.id,
          country: priceData.country,
          amount: parseFloat(priceData.amount),
          currency: priceData.currency,
          notes: priceData.notes,
          notes_fr: notesFr,
          variations: variationsFr,
        })
        .select()
        .single();

      if (priceError) throw priceError;

      // Save product images if any
      if (priceData.productImages && priceData.productImages.length > 0 && priceInserted?.id) {
        const photoInserts = priceData.productImages.map((url: string) => ({
          price_id: priceInserted.id,
          url,
          photo_type: 'price'
        }));

        // @ts-ignore - Photos table not in generated types yet
        const { error: photoError } = await supabase
          .from('photos' as any)
          .insert(photoInserts);

        if (photoError) {
          console.error('Error saving price photos:', photoError);
        }
      }

      toast.success(t.priceAdded);
      
      // Reload prices for this material to get the latest from database
      if (selectedMaterial?.id) {
        const { data: updatedPrices } = await supabase
          .from('prices')
          .select(`
            id,
            amount,
            currency,
            country,
            variations,
            suppliers (
              name
            )
          `)
          .eq('material_id', selectedMaterial.id)
          .eq('supplier_id', supplier.id);
        
        // Update local state with all prices from database
        setMaterials(prevMaterials => 
          prevMaterials.map(m => 
            m.id === selectedMaterial.id 
              ? { 
                  ...m,
                  unavailable: m.unavailable,
                  prices: updatedPrices?.map((p: any) => ({
                    id: p.id,
                    amount: p.amount,
                    currency: p.currency,
                    country: p.country,
                    supplier_name: p.suppliers?.name || '',
                    variations: p.variations || [],
                  })) || []
                }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Error submitting price:', error);
      toast.error(t.error);
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

      // Save supplier images if any
      if (data.supplierImages && data.supplierImages.length > 0 && selectedMaterial?.id) {
        // Get existing photos
        // @ts-ignore - Photos table not in generated types yet
        const { data: existingPhotos } = await supabase
          .from('photos' as any)
          .select('url')
          .eq('material_id', selectedMaterial.id)
          .eq('photo_type', 'material');

        const existingUrls = existingPhotos?.map((p: any) => p.url) || [];
        
        // Find new photos to insert (photos that don't exist yet)
        const newPhotos = data.supplierImages.filter((url: string) => !existingUrls.includes(url));
        
        // Insert only new photos
        if (newPhotos.length > 0) {
          const photoInserts = newPhotos.map((url: string) => ({
            material_id: selectedMaterial.id,
            url,
            photo_type: 'material'
          }));

          // @ts-ignore - Photos table not in generated types yet
          const { error: photoError } = await supabase
            .from('photos' as any)
            .insert(photoInserts);

          if (photoError) {
            console.error('Error saving photos:', photoError);
          }
        }
      }

      toast.success(t.materialUpdated);
      
      // Update local state without reload
      setMaterials(prevMaterials => 
        prevMaterials.map(m => 
          m.id === selectedMaterial?.id 
            ? { 
                ...m,
                name: data.name || m.name,
                description: data.description !== undefined ? data.description : m.description,
                category: data.category !== undefined ? data.category : m.category,
                quantity: data.quantity !== undefined ? data.quantity : m.quantity,
                surface: data.surface !== undefined ? data.surface : m.surface,
                weight: data.weight !== undefined ? data.weight : m.weight,
                volume: data.volume !== undefined ? data.volume : m.volume,
                supplierImages: data.supplierImages || m.supplierImages,
              }
            : m
        )
      );
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error(t.error);
    }
  };

  const handleMarkUnavailable = async (material: Material) => {
    try {
      const newUnavailableStatus = !material.unavailable;
      
      // If no supplier ID yet, create supplier first
      let supplierId = currentSupplierId;
      if (!supplierId) {
        // Create a minimal supplier record
        const { data: supplier, error: supplierError } = await supabase
          .from('suppliers')
          .upsert({
            name: 'Supplier', // Placeholder, will be updated when they add a price
            email: '',
            country: 'China',
          })
          .select()
          .single();

        if (supplierError) throw supplierError;
        
        supplierId = supplier.id;
        setCurrentSupplierId(supplierId);
        localStorage.setItem(`supplier_id_${token}`, supplierId);
      }
      
      // @ts-ignore - Table not in generated types yet
      const { error } = await supabase
        .from('supplier_material_availability' as any)
        .upsert({
          material_id: material.id,
          supplier_id: supplierId,
          is_available: !newUnavailableStatus,
        });

      if (error) throw error;

      const message = newUnavailableStatus ? t.markedUnavailable : t.markedAvailable;
      
      console.log(`Marked ${material.name} as ${newUnavailableStatus ? 'unavailable' : 'available'}`);
      
      // Update local state immediately without reload
      setMaterials(prevMaterials => 
        prevMaterials.map(m => 
          m.id === material.id 
            ? { ...m, unavailable: newUnavailableStatus }
            : m
        )
      );
      
      toast.success(message);
    } catch (error) {
      console.error('Error marking material unavailable:', error);
      toast.error(t.error);
    }
  };

  const handleSaveDraft = async () => {
    // Basic validation - at least email should be there
    if (!supplierInfo.email) {
      toast.error(t.atLeastEmail);
      const element = document.getElementById('supplier-info-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.classList.add('ring-2', 'ring-red-500');
        setTimeout(() => element.classList.remove('ring-2', 'ring-red-500'), 2000);
      }
      return;
    }

    try {
      setIsSaving(true);
      
      // Filter materials: only those with prices OR marked as unavailable
      const quotedMaterials = materials.filter(m =>
        (m.prices && m.prices.length > 0) || m.unavailable
      );

      // Prepare payload - must match API expected structure
      const payload = {
        supplierInfo: {
          contactName: supplierInfo.contactName,
          email: supplierInfo.email,
          companyName: supplierInfo.companyName,
          country: supplierInfo.country,
        },
        materials: quotedMaterials,
        status: 'draft',
        currency: materials.find(m => m.prices?.length)?.prices?.[0]?.currency || 'CNY',
        notes: '',
      };

      const response = await fetch(`/api/supplier-quote/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save draft');

      toast.success(t.draftSaved);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error(t.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitQuotation = async () => {
    if (!supplierInfo.companyName || !supplierInfo.contactName || !supplierInfo.email) {
      toast.error(t.fillAllInfo);
      return;
    }

    try {
      // Filter materials: only those with prices OR marked as unavailable
      const quotedMaterials = materials.filter(m => 
        (m.prices && m.prices.length > 0) || m.unavailable
      );

      // Check if there are any materials to quote
      if (quotedMaterials.length === 0) {
        toast.error(t.addPriceOrUnavailable);
        return;
      }

      // Create supplier quote
      // @ts-ignore - Table not in generated types yet
      const { error } = await supabase
        .from('supplier_quotes' as any)
        .insert({
          supplier_request_id: request?.id,
          supplier_name: supplierInfo.contactName,
          supplier_email: supplierInfo.email,
          supplier_company: supplierInfo.companyName,
          supplier_country: supplierInfo.country,
          quoted_materials: quotedMaterials,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success(t.submitted);
    } catch (error) {
      console.error('Error submitting quotation:', error);
      toast.error(t.submissionError);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.loading}</p>
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
              {t.thankYou}
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

        {/* PARTIE 1: Informations Fournisseur */}
        <div className="mb-8" id="supplier-info-section">
          <div className="mb-4 px-1 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                {t.part1Title}
                {isSupplierInfoComplete && (
                  <CheckCircle className="h-6 w-6 text-green-500 animate-in zoom-in duration-300" />
                )}
              </h2>
              <p className="text-sm text-gray-600">
                {t.part1Subtitle}
              </p>
            </div>
          </div>
          
          <Card className={`border-2 shadow-lg transition-colors duration-300 ${isSupplierInfoComplete ? 'border-green-200' : 'border-blue-200'}`}>
            <CardHeader className={`transition-colors duration-300 ${isSupplierInfoComplete ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
              <CardTitle className="flex items-center gap-2">
                <Building2 className={`h-5 w-5 ${isSupplierInfoComplete ? 'text-green-600' : 'text-blue-600'}`} />
                <span className={isSupplierInfoComplete ? 'text-green-900' : 'text-blue-900'}>{t.supplierInfo}</span>
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
                <Label htmlFor="whatsapp">{t.whatsapp}</Label>
                <Input
                  id="whatsapp"
                  value={supplierInfo.whatsapp}
                  onChange={(e) => setSupplierInfo({ ...supplierInfo, whatsapp: e.target.value })}
                  className="mt-1"
                  placeholder="+86 138 xxxx xxxx"
                />
              </div>
              <div>
                <Label htmlFor="wechat">{t.wechat}</Label>
                <Input
                  id="wechat"
                  value={supplierInfo.wechat}
                  onChange={(e) => setSupplierInfo({ ...supplierInfo, wechat: e.target.value })}
                  className="mt-1"
                  placeholder="WeChat ID"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* PARTIE 2: Liste des Matériaux */}
        <div className="mb-8">
          <div className="mb-4 px-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {t.part2Title}
            </h2>
            <p className="text-sm text-gray-600">
              {t.part2Subtitle}
            </p>
          </div>
          
          <Card className="border-2 border-green-200 shadow-lg">
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
                  onMarkUnavailable={() => handleMarkUnavailable(material)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
            size="lg"
            className="border-2"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? '...' : t.saveDraft}
          </Button>
          <Button
            onClick={handleSubmitQuotation}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {t.submit}
          </Button>
        </div>
      </div>

      {/* Floating Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        <Button
          variant="secondary"
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="shadow-lg rounded-full px-4 py-4 h-auto font-medium transition-all hover:scale-105 border-2 border-gray-200 bg-white"
          title={t.saveDraft}
        >
          <Save className="h-5 w-5" />
        </Button>
        <Button
          onClick={handleSubmitQuotation}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl rounded-full px-6 py-6 h-auto text-lg font-semibold transition-all hover:scale-105 animate-in slide-in-from-bottom-10"
        >
          {t.submit}
        </Button>
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
        supplierInfo={supplierInfo}
        existingPrice={selectedMaterial?.prices && selectedMaterial.prices.length > 0 ? {
          amount: selectedMaterial.prices[0].amount,
          currency: selectedMaterial.prices[0].currency,
          country: selectedMaterial.prices[0].country,
          notes: '',
          variations: selectedMaterial.prices[0].variations,
        } : undefined}
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
