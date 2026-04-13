/**
 * Service Kimi (Moonshot AI) pour la traduction et la recherche d'usines
 * Moonshot API est compatible avec le format OpenAI
 */

import type { KimiFactory, KimiFactorySearchResult, MarketplaceProduct, MarketplaceSearchResult } from '@/lib/types/marketplace';
import { delay } from '@/lib/services/translation-utils';

// Configuration Moonshot Kimi
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY || '';
const MOONSHOT_BASE_URL = 'https://api.moonshot.cn/v1';
const PRIMARY_MODEL = 'moonshot-v1-32k';
const FALLBACK_MODEL = 'moonshot-v1-8k';

// Retry config
const MAX_RETRIES = 4;
const INITIAL_RETRY_DELAY = 1000;

// ============================================================================
// Kimi API Client
// ============================================================================

interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface KimiCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Appel à l'API Moonshot Kimi avec retry et fallback de modèle
 */
async function callKimi(
  messages: KimiMessage[],
  options: KimiCompletionOptions = {}
): Promise<string> {
  const { temperature = 0.3, maxTokens = 4000 } = options;
  let model = options.model || PRIMARY_MODEL;

  if (!MOONSHOT_API_KEY) {
    throw new Error('MOONSHOT_API_KEY is not configured');
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${MOONSHOT_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (response.status === 429) {
        const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.warn(`[Kimi] Rate limited (429), retrying in ${retryDelay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await delay(retryDelay);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Kimi] API error (${response.status}):`, errorText);

        // Fallback to smaller model on server errors
        if (response.status >= 500 && model === PRIMARY_MODEL) {
          console.log(`[Kimi] Falling back to ${FALLBACK_MODEL}`);
          model = FALLBACK_MODEL;
          continue;
        }

        throw new Error(`Kimi API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    } catch (error: any) {
      if (attempt === MAX_RETRIES) {
        throw error;
      }

      // On network errors, try fallback model
      if (model === PRIMARY_MODEL && attempt >= 2) {
        console.log(`[Kimi] Switching to fallback model after ${attempt + 1} failures`);
        model = FALLBACK_MODEL;
      }

      const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
      console.warn(`[Kimi] Error, retrying in ${retryDelay}ms:`, error.message);
      await delay(retryDelay);
    }
  }

  throw new Error('Kimi API: max retries exceeded');
}

// ============================================================================
// Translation Functions
// ============================================================================

/**
 * Traduit un texte français en chinois via Kimi
 */
export async function translateWithKimi(
  text: string,
  sourceLang: 'fr' | 'en' | 'zh',
  targetLang: 'fr' | 'en' | 'zh'
): Promise<string> {
  if (!text || text.trim() === '') return text;
  if (sourceLang === targetLang) return text;

  const langNames: Record<string, string> = {
    fr: 'French',
    en: 'English',
    zh: 'Chinese (Simplified)',
  };

  const result = await callKimi([
    {
      role: 'system',
      content: `You are a professional translator specializing in e-commerce and B2B products. Translate from ${langNames[sourceLang]} to ${langNames[targetLang]}. Return ONLY the translation, nothing else.`,
    },
    { role: 'user', content: text },
  ], { temperature: 0.2, maxTokens: 200 });

  return result || text;
}

/**
 * Traduit un batch de textes (jusqu'à 6 par appel, comme Twinsk)
 */
export async function translateBatchWithKimi(
  items: Array<{ title: string; description?: string; seller?: string }>,
  targetLang: 'fr' | 'en' = 'fr'
): Promise<Array<{ title: string; description?: string; seller?: string }>> {
  if (items.length === 0) return items;

  const CHUNK_SIZE = 6;
  const results: Array<{ title: string; description?: string; seller?: string }> = [];

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);

    const itemsText = chunk.map((item, idx) => {
      let text = `${idx + 1}. Title: ${item.title}`;
      if (item.description) text += ` | Description: ${item.description}`;
      if (item.seller) text += ` | Seller: ${item.seller}`;
      return text;
    }).join('\n');

    try {
      const translated = await callKimi([
        {
          role: 'system',
          content: `You are a professional translator. Translate each Chinese product entry to ${targetLang === 'fr' ? 'French' : 'English'}.
Keep the same numbered format. For each entry, translate the Title, Description (if present), and Seller (if present).
Return ONLY the translations in the same format, nothing else.
Example output:
1. Title: translated title | Description: translated desc | Seller: translated seller
2. Title: translated title`,
        },
        { role: 'user', content: itemsText },
      ], { temperature: 0.2, maxTokens: 3000 });

      // Parse translations
      const lines = translated.split('\n').filter(l => l.trim());
      for (let j = 0; j < chunk.length; j++) {
        const line = lines[j] || '';
        const titleMatch = line.match(/Title:\s*(.+?)(?:\s*\|\s*|$)/);
        const descMatch = line.match(/Description:\s*(.+?)(?:\s*\|\s*|$)/);
        const sellerMatch = line.match(/Seller:\s*(.+?)$/);

        results.push({
          title: titleMatch?.[1]?.trim() || chunk[j].title,
          description: descMatch?.[1]?.trim() || chunk[j].description,
          seller: sellerMatch?.[1]?.trim() || chunk[j].seller,
        });
      }
    } catch (error) {
      console.error('[Kimi] Batch translation error:', error);
      results.push(...chunk);
    }

    if (i + CHUNK_SIZE < items.length) {
      await delay(500);
    }
  }

  return results;
}

// ============================================================================
// Factory Search
// ============================================================================

/**
 * Recherche d'usines spécialisées via Kimi AI
 * Retourne 3-5 usines recommandées avec informations de contact
 */
export async function searchFactories(
  productDescription: string,
  options: { maxResults?: number } = {}
): Promise<KimiFactorySearchResult> {
  const { maxResults = 5 } = options;

  console.log(`[Kimi] Factory search for: "${productDescription.substring(0, 60)}..."`);

  try {
    const result = await callKimi([
      {
        role: 'system',
        content: `You are a senior Chinese sourcing expert with 15 years of experience finding manufacturers in China.

Your task: Find ${maxResults} real, currently operating Chinese factories/manufacturers that produce the described product.

IMPORTANT REQUIREMENTS:
- Factories must be REAL companies that currently operate
- Each factory must have AT LEAST one working contact method (phone, email, WeChat, WhatsApp, or website)
- Include factories from different cities for variety
- Prefer factories with export experience and English/French-speaking staff
- Include both large and medium-sized manufacturers

Respond in VALID JSON format only:
{
  "factories": [
    {
      "companyName": "Company Name in English",
      "city": "City, Province",
      "experienceYears": 10,
      "specialties": ["specialty1", "specialty2"],
      "moq": 100,
      "estimatedPrice": "$5-15 per unit",
      "contact": {
        "phone": "+86-xxx",
        "email": "contact@example.com",
        "wechat": "wechat_id",
        "whatsapp": "+86-xxx",
        "website": "https://www.example.com"
      },
      "whyRecommended": "Brief reason this factory is a good match"
    }
  ]
}`,
      },
      {
        role: 'user',
        content: `Find manufacturers for: ${productDescription}`,
      },
    ], { temperature: 0.7, maxTokens: 4000 });

    // Parse JSON response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[Kimi] Could not parse factory search response as JSON');
      return { query: productDescription, factories: [], searchedAt: new Date() };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const factories: KimiFactory[] = (parsed.factories || [])
      .filter((f: any) => {
        // Must have at least one contact method
        const contact = f.contact || {};
        return contact.phone || contact.email || contact.wechat || contact.whatsapp || contact.website;
      })
      .slice(0, maxResults)
      .map((f: any) => ({
        companyName: f.companyName || 'Unknown',
        city: f.city || 'China',
        experienceYears: f.experienceYears || 0,
        specialties: f.specialties || [],
        moq: f.moq || 0,
        estimatedPrice: f.estimatedPrice || 'N/A',
        contact: {
          phone: f.contact?.phone || undefined,
          email: f.contact?.email || undefined,
          wechat: f.contact?.wechat || undefined,
          whatsapp: f.contact?.whatsapp || undefined,
          website: f.contact?.website || undefined,
        },
        whyRecommended: f.whyRecommended || '',
      }));

    console.log(`[Kimi] Found ${factories.length} factories`);

    return {
      query: productDescription,
      factories,
      searchedAt: new Date(),
    };
  } catch (error: any) {
    console.error('[Kimi] Factory search error:', error.message);
    return {
      query: productDescription,
      factories: [],
      searchedAt: new Date(),
    };
  }
}

/**
 * Convertit les résultats de recherche d'usines Kimi en MarketplaceProduct[]
 */
export function convertFactoriesToProducts(result: KimiFactorySearchResult): MarketplaceProduct[] {
  return result.factories.map((factory, index) => ({
    externalId: `kimi-factory-${index}-${Date.now()}`,
    source: 'kimi_factory' as const,
    title: `${factory.companyName} - ${factory.specialties.join(', ')}`,
    titleFr: `${factory.companyName} - ${factory.specialties.join(', ')}`,
    description: factory.whyRecommended,
    descriptionFr: factory.whyRecommended,
    priceMin: 0,
    priceMax: 0,
    currency: 'CNY',
    moq: factory.moq,
    imageUrl: '',
    productUrl: factory.contact.website || '',
    supplierName: factory.companyName,
    supplierLocation: factory.city,
    supplierYears: factory.experienceYears,
    supplierVerified: false,
    supplierContact: factory.contact,
    rawData: factory as unknown as Record<string, unknown>,
  }));
}

/**
 * Recherche d'usines et conversion en MarketplaceSearchResult
 */
export async function searchKimiFactories(
  query: string,
  options: { maxResults?: number } = {}
): Promise<MarketplaceSearchResult> {
  const result = await searchFactories(query, options);
  const products = convertFactoriesToProducts(result);

  return {
    source: 'kimi_factory',
    query,
    products,
    totalFound: products.length,
    searchedAt: result.searchedAt,
  };
}
