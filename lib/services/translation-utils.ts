/**
 * Utilitaires de traduction partagés entre les services marketplace
 * Extrait de 1688-service.ts pour réutilisation par Taobao, Kimi, et l'agrégateur
 */

import { completeText } from '@/lib/ai/clients';
import { FRENCH_TO_CHINESE_TERMS } from '@/lib/types/1688';

// ============================================================================
// Image URL Proxy
// ============================================================================

/**
 * Convertit une URL Supabase en URL proxy accessible depuis la Chine
 * Utilise wsrv.nl (basé sur Cloudflare) accessible mondialement
 */
export function convertToProxyUrl(imageUrl: string): string {
  if (
    imageUrl.includes('wsrv.nl') ||
    imageUrl.includes('weserv.nl') ||
    imageUrl.includes('alicdn.com') ||
    imageUrl.includes('1688.com') ||
    imageUrl.includes('taobao.com')
  ) {
    return imageUrl;
  }

  const encodedUrl = encodeURIComponent(imageUrl);
  return `https://wsrv.nl/?url=${encodedUrl}`;
}

/**
 * Convertit une URL d'image alicdn/taobao en URL proxy pour éviter les problèmes CORS
 */
export function convertToDisplayProxyUrl(imageUrl: string): string {
  if (!imageUrl) return '';

  if (imageUrl.includes('wsrv.nl') || imageUrl.includes('weserv.nl')) {
    return imageUrl;
  }

  if (
    imageUrl.includes('alicdn.com') ||
    imageUrl.includes('1688.com') ||
    imageUrl.includes('taobaocdn.com') ||
    imageUrl.includes('tbcdn.cn')
  ) {
    const encodedUrl = encodeURIComponent(imageUrl);
    return `https://wsrv.nl/?url=${encodedUrl}&output=jpg&q=85`;
  }

  return imageUrl;
}

// ============================================================================
// French ↔ Chinese Translation
// ============================================================================

/**
 * Traduit un terme français en chinois (mapping statique - fallback rapide)
 */
export function translateToChineseStatic(text: string): string {
  const lowerText = text.toLowerCase().trim();

  if (FRENCH_TO_CHINESE_TERMS[lowerText]) {
    return FRENCH_TO_CHINESE_TERMS[lowerText];
  }

  for (const [french, chinese] of Object.entries(FRENCH_TO_CHINESE_TERMS)) {
    if (lowerText.includes(french)) {
      return lowerText.replace(french, chinese);
    }
  }

  return text;
}

/**
 * Traduit un terme de recherche français en chinois via AI
 * Utilisé pour les requêtes de recherche sur les marketplaces chinois
 */
export async function translateFrenchToChinese(text: string): Promise<string> {
  if (!text || text.trim() === '') return text;

  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  if (hasChinese) return text;

  // Pour les termes simples, essayer le mapping statique
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount <= 2) {
    const staticTranslation = translateToChineseStatic(text);
    if (staticTranslation !== text && /^[\u4e00-\u9fa5]+$/.test(staticTranslation)) {
      console.log(`[Translation] Static FR->ZH: "${text}" -> "${staticTranslation}"`);
      return staticTranslation;
    }
  }

  try {
    console.log(`[Translation] AI FR->ZH for: "${text}"`);
    const translated = await completeText(
      text,
      `You are a professional translator specializing in product names and B2B commerce.
Translate the following French product search term to Chinese (Simplified).
The translation should be optimized for searching on Chinese marketplaces (1688, Taobao).
Use common Chinese product terminology that would yield good search results.
IMPORTANT: Translate ALL words including colors (rouge=红色, bleu=蓝色, noir=黑色, blanc=白色),
brand names (keep iPhone as iPhone or 苹果手机), and product types.
Return ONLY the Chinese translation, nothing else.`,
      { temperature: 0.2, maxTokens: 100 }
    );
    const result = translated.trim();
    if (result && /[\u4e00-\u9fa5]/.test(result)) {
      console.log(`[Translation] AI translated FR->ZH: "${text}" -> "${result}"`);
      return result;
    }
    return text;
  } catch (error) {
    console.error('[Translation] FR->ZH error:', error);
    return text;
  }
}

/**
 * Traduit un texte chinois en français via AI
 */
export async function translateChineseToFrench(text: string): Promise<string> {
  if (!text || text.trim() === '') return text;

  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  if (!hasChinese) return text;

  try {
    const translated = await completeText(
      text,
      'You are a professional translator. Translate the following Chinese product title to French. Keep it concise and accurate. Return ONLY the French translation, nothing else.',
      { temperature: 0.2, maxTokens: 200 }
    );
    return translated.trim() || text;
  } catch (error) {
    console.error('[Translation] ZH->FR error:', error);
    return text;
  }
}

/**
 * Traduit un texte chinois en anglais via AI
 */
export async function translateChineseToEnglish(text: string): Promise<string> {
  if (!text || text.trim() === '') return text;

  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  if (!hasChinese) return text;

  try {
    const translated = await completeText(
      text,
      'You are a professional translator. Translate the following Chinese text to English. Keep it concise and accurate for e-commerce product listing. Return ONLY the English translation, nothing else.',
      { temperature: 0.2, maxTokens: 200 }
    );
    return translated.trim() || text;
  } catch (error) {
    console.error('[Translation] ZH->EN error:', error);
    return text;
  }
}

/**
 * Traduit plusieurs textes chinois en français en batch
 */
export async function translateTextsBatch(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];

  const chineseTexts = texts.filter(t => /[\u4e00-\u9fa5]/.test(t));
  if (chineseTexts.length === 0) return texts;

  try {
    const numberedTexts = chineseTexts.map((t, i) => `${i + 1}. ${t}`).join('\n');

    const translated = await completeText(
      numberedTexts,
      `You are a professional translator. Translate each Chinese text to French.
Keep each translation on a separate line with the same numbering format.
Be concise and accurate. Return ONLY the numbered translations, nothing else.
For product titles, company names, and location names, provide natural French translations.
Example format:
1. French translation 1
2. French translation 2`,
      { temperature: 0.2, maxTokens: 2000 }
    );

    const lines = translated.trim().split('\n');
    const translationMap = new Map<number, string>();

    for (const line of lines) {
      const match = line.match(/^(\d+)\.\s*(.+)$/);
      if (match) {
        translationMap.set(parseInt(match[1]) - 1, match[2].trim());
      }
    }

    let chineseIndex = 0;
    return texts.map(text => {
      if (/[\u4e00-\u9fa5]/.test(text)) {
        const translation = translationMap.get(chineseIndex);
        chineseIndex++;
        return translation || text;
      }
      return text;
    });
  } catch (error) {
    console.error('[Translation] Batch error:', error);
    return texts;
  }
}

/**
 * Traduit un texte français en anglais via AI
 */
export async function translateFrenchToEnglish(text: string): Promise<string> {
  if (!text || text.trim() === '') return text;

  try {
    const translated = await completeText(
      text,
      'Translate the following French text to English. Return ONLY the English translation.',
      { temperature: 0.2, maxTokens: 200 }
    );
    return translated.trim() || text;
  } catch (error) {
    console.error('[Translation] FR->EN error:', error);
    return text;
  }
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Délai utilitaire pour le rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Vérifie si un texte contient des caractères chinois
 */
export function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}
