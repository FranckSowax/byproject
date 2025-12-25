import { createClient } from '@/lib/supabase/client';
import { getBatchMaterialComments, translateComments } from './comments';
import { translateText } from './translation';
import { nanoid } from 'nanoid';

export interface QuotationMaterial {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number | null;
  surface: number | null;
  weight: number | null;
  volume: number | null;
  specs: any;
  images: string[];
  comments?: any[];
}

export interface CreateQuotationParams {
  projectId: string;
  country?: string;
  numSuppliers?: number;
  shippingType?: string;
  notes?: string;
}

export interface CreateQuotationResult {
  success: boolean;
  requestNumber?: string;
  publicToken?: string;
  supplierLink?: string;
  error?: string;
}

/**
 * Create a complete quotation request with materials, comments and translations
 */
export async function createQuotationRequest(
  params: CreateQuotationParams
): Promise<CreateQuotationResult> {
  const supabase = createClient();

  try {
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    // 2. Get project materials
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .eq('project_id', params.projectId);

    if (materialsError) throw materialsError;

    if (!materials || materials.length === 0) {
      return { success: false, error: 'Aucun matériau trouvé dans ce projet' };
    }

    // 3. Extract images from materials (stored in specs or as array)
    const imagesByMaterial: Record<string, string[]> = {};
    materials.forEach(material => {
      // Images can be in specs.images or material.images
      const images = material.specs?.images || material.images || [];
      imagesByMaterial[material.id] = Array.isArray(images) ? images : [];
    });

    // 4. Get comments for all materials
    const materialIds = materials.map(m => m.id);
    const commentsByMaterial = await getBatchMaterialComments(materialIds);

    // 5. Combine materials with images and comments
    const materialsWithComments: QuotationMaterial[] = materials.map(material => ({
      id: material.id,
      name: material.name,
      description: material.description,
      category: material.category,
      quantity: material.quantity,
      surface: material.surface,
      weight: material.weight,
      volume: material.volume,
      specs: material.specs,
      images: imagesByMaterial[material.id] || [],
      comments: commentsByMaterial[material.id] || []
    }));

    // 6. Translate materials and comments to EN and ZH
    async function translateMaterial(material: QuotationMaterial, targetLang: 'en' | 'zh') {
      const [translatedName, translatedDescription, translatedComments] = await Promise.all([
        translateText(material.name, targetLang, 'fr'),
        material.description ? translateText(material.description, targetLang, 'fr') : Promise.resolve(null),
        translateComments(material.comments || [], targetLang)
      ]);

      return {
        ...material,
        translatedName,
        translatedDescription,
        comments: translatedComments.map(c => ({
          id: c.id,
          user_name: c.user_name,
          user_email: c.user_email,
          comment: c.translatedComment || c.comment,
          translatedComment: c.translatedComment,
          created_at: c.created_at
        }))
      };
    }

    // Translate in parallel
    const [materialsEN, materialsZH] = await Promise.all([
      Promise.all(materialsWithComments.map(m => translateMaterial(m, 'en'))),
      Promise.all(materialsWithComments.map(m => translateMaterial(m, 'zh')))
    ]);

    // 7. Generate request number and token
    const requestNumber = `REQ-${Date.now()}-${nanoid(6).toUpperCase()}`;
    const publicToken = nanoid(32);

    // 8. Create supplier request
    const { error: requestError } = await supabase
      .from('supplier_requests' as any)
      .insert({
        project_id: params.projectId,
        user_id: user.id,
        request_number: requestNumber,
        public_token: publicToken,
        status: 'pending_admin',
        num_suppliers: params.numSuppliers || 3,
        materials_data: materialsWithComments,
        materials_translated_en: materialsEN,
        materials_translated_zh: materialsZH,
        total_materials: materialsWithComments.length,
        filled_materials: 0,
        progress_percentage: 0,
        metadata: {
          country: params.country || 'China',
          shipping_type: params.shippingType || 'sea',
          notes: params.notes || '',
        }
      });

    if (requestError) throw requestError;

    // 9. Return success with link
    const supplierLink = `${window.location.origin}/supplier-quote/${publicToken}`;

    return {
      success: true,
      requestNumber,
      publicToken,
      supplierLink
    };

  } catch (error: any) {
    console.error('Error creating quotation:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la création de la demande'
    };
  }
}
