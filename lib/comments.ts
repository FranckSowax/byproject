import { createClient } from '@/lib/supabase/client';
import { translateText, SupportedLanguage } from './translation';

export interface MaterialComment {
  id: string;
  user_name: string;
  user_email: string;
  comment: string;
  created_at: string;
}

export interface TranslatedMaterialComment extends MaterialComment {
  translatedComment?: string;
}

/**
 * Get all non-deleted comments for a material
 * @param materialId - Material ID
 * @returns Array of comments
 */
export async function getMaterialComments(materialId: string): Promise<MaterialComment[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('material_comments')
    .select('id, user_name, user_email, comment, created_at')
    .eq('material_id', materialId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return data || [];
}

/**
 * Translate comments to target language
 * @param comments - Array of comments
 * @param targetLang - Target language
 * @returns Array of translated comments
 */
export async function translateComments(
  comments: MaterialComment[],
  targetLang: SupportedLanguage
): Promise<TranslatedMaterialComment[]> {
  if (targetLang === 'fr') {
    // No translation needed for French
    return comments;
  }

  try {
    const translatedComments = await Promise.all(
      comments.map(async (comment) => {
        try {
          const translatedComment = await translateText(comment.comment, targetLang, 'fr');
          return {
            ...comment,
            translatedComment,
          };
        } catch (error) {
          console.error(`Error translating comment ${comment.id}:`, error);
          return {
            ...comment,
            translatedComment: comment.comment, // Fallback to original
          };
        }
      })
    );

    return translatedComments;
  } catch (error) {
    console.error('Error in batch translation:', error);
    return comments; // Return original comments on error
  }
}

/**
 * Get and translate comments for a material
 * @param materialId - Material ID
 * @param targetLang - Target language (default: fr)
 * @returns Array of translated comments
 */
export async function getMaterialCommentsTranslated(
  materialId: string,
  targetLang: SupportedLanguage = 'fr'
): Promise<TranslatedMaterialComment[]> {
  const comments = await getMaterialComments(materialId);
  
  if (comments.length === 0) {
    return [];
  }

  return await translateComments(comments, targetLang);
}

/**
 * Get comments for multiple materials
 * @param materialIds - Array of material IDs
 * @returns Map of material ID to comments array
 */
export async function getBatchMaterialComments(
  materialIds: string[]
): Promise<Record<string, MaterialComment[]>> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('material_comments')
    .select('id, material_id, user_name, user_email, comment, created_at')
    .in('material_id', materialIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching batch comments:', error);
    return {};
  }

  // Group comments by material_id
  const commentsByMaterial: Record<string, MaterialComment[]> = {};
  
  data?.forEach((comment: any) => {
    const materialId = comment.material_id;
    if (!commentsByMaterial[materialId]) {
      commentsByMaterial[materialId] = [];
    }
    commentsByMaterial[materialId].push({
      id: comment.id,
      user_name: comment.user_name,
      user_email: comment.user_email,
      comment: comment.comment,
      created_at: comment.created_at,
    });
  });

  return commentsByMaterial;
}

/**
 * Format comment date for display
 * @param dateString - ISO date string
 * @param locale - Locale for formatting (default: fr-FR)
 * @returns Formatted date string
 */
export function formatCommentDate(dateString: string, locale: string = 'fr-FR'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
