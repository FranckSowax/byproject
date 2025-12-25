/**
 * Translation utility using Google Translate API
 * Free tier: 500,000 characters/month
 */

export type SupportedLanguage = 'fr' | 'en' | 'zh';

interface TranslationResponse {
  translatedText: string;
}

/**
 * Translate text using Google Translate API
 * @param text - Text to translate
 * @param targetLang - Target language code (en, zh)
 * @param sourceLang - Source language code (default: fr)
 */
export async function translateText(
  text: string,
  targetLang: SupportedLanguage,
  sourceLang: SupportedLanguage = 'fr'
): Promise<string> {
  // If source and target are the same, return original
  if (sourceLang === targetLang) {
    return text;
  }

  // If text is empty, return empty
  if (!text || text.trim() === '') {
    return text;
  }

  try {
    // Use DeepSeek API via our API route
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLanguage: targetLang,
        sourceLanguage: sourceLang,
      }),
    });

    if (!response.ok) {
      console.error('Translation API error:', response.statusText);
      return text; // Return original text on error
    }

    const data: TranslationResponse = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
}

/**
 * Translate multiple texts in batch
 * @param texts - Array of texts to translate
 * @param targetLang - Target language code
 * @param sourceLang - Source language code (default: fr)
 */
export async function translateBatch(
  texts: string[],
  targetLang: SupportedLanguage,
  sourceLang: SupportedLanguage = 'fr'
): Promise<string[]> {
  // If source and target are the same, return originals
  if (sourceLang === targetLang) {
    return texts;
  }

  try {
    const response = await fetch('/api/translate/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts,
        targetLang,
        sourceLang,
      }),
    });

    if (!response.ok) {
      console.error('Batch translation API error:', response.statusText);
      return texts; // Return original texts on error
    }

    const data: { translations: string[] } = await response.json();
    return data.translations;
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts; // Return original texts on error
  }
}

/**
 * Translate an object with specific fields
 * @param obj - Object to translate
 * @param fields - Fields to translate
 * @param targetLang - Target language code
 */
export async function translateObject<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[],
  targetLang: SupportedLanguage
): Promise<T> {
  const translated = { ...obj };

  for (const field of fields) {
    const value = obj[field];
    if (typeof value === 'string' && value) {
      translated[field] = await translateText(value, targetLang) as any;
    }
  }

  return translated;
}

/**
 * Get language name in native script
 */
export function getLanguageName(lang: SupportedLanguage): string {
  const names: Record<SupportedLanguage, string> = {
    fr: 'Français',
    en: 'English',
    zh: '中文',
  };
  return names[lang];
}

/**
 * Detect if text contains Chinese characters
 */
export function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Detect if text contains Arabic characters
 */
export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}
