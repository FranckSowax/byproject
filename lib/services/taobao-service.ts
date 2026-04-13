/**
 * Service pour la recherche de produits sur Taobao via RapidAPI
 * Inspiré du système Twinsk avec recherche par image et par mot-clé
 */

import { MarketplaceProduct, type MarketplaceSearchResult } from '@/lib/types/marketplace';
import {
  translateFrenchToChinese,
  convertToProxyUrl,
  convertToDisplayProxyUrl,
  delay,
} from '@/lib/services/translation-utils';

// Configuration RapidAPI Taobao
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_TAOBAO_HOST = process.env.RAPIDAPI_TAOBAO_HOST || 'taobao-datahub.p.rapidapi.com';
const RAPIDAPI_TAOBAO_BASE_URL = `https://${RAPIDAPI_TAOBAO_HOST}`;

// Rate limiting
const RATE_LIMIT_DELAY_MS = 1000;

// ============================================================================
// Search by Keyword
// ============================================================================

/**
 * Recherche de produits Taobao par mot-clé
 */
export async function searchTaobaoByKeyword(
  keyword: string,
  options: { maxResults?: number; translateQuery?: boolean } = {}
): Promise<MarketplaceSearchResult> {
  const { maxResults = 10, translateQuery = true } = options;

  const searchKeyword = translateQuery ? await translateFrenchToChinese(keyword) : keyword;
  console.log(`[Taobao] Keyword search: "${keyword}" -> "${searchKeyword}"`);

  try {
    const url = `${RAPIDAPI_TAOBAO_BASE_URL}/item_search?q=${encodeURIComponent(searchKeyword)}&page=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_TAOBAO_HOST,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Taobao] API error (${response.status}):`, errorText);
      throw new Error(`Taobao API failed: ${response.status}`);
    }

    const data = await response.json();

    // Parse results - Taobao DataHub format
    const items = data?.result?.items || data?.items || data?.data?.items || [];
    console.log(`[Taobao] Found ${items.length} items`);

    const products = parseTaobaoResults(items.slice(0, maxResults));

    return {
      source: 'taobao',
      query: keyword,
      queryZh: searchKeyword !== keyword ? searchKeyword : undefined,
      products,
      totalFound: items.length,
      searchedAt: new Date(),
    };
  } catch (error: any) {
    console.error(`[Taobao] Keyword search error:`, error.message);
    return {
      source: 'taobao',
      query: keyword,
      products: [],
      totalFound: 0,
      searchedAt: new Date(),
      error: error.message,
    };
  }
}

// ============================================================================
// Search by Image
// ============================================================================

/**
 * Recherche de produits Taobao par image (recherche inversée)
 */
export async function searchTaobaoByImage(
  imageUrl: string,
  options: { maxResults?: number } = {}
): Promise<MarketplaceSearchResult> {
  const { maxResults = 10 } = options;

  const proxyUrl = convertToProxyUrl(imageUrl);
  console.log(`[Taobao] Image search: "${imageUrl.substring(0, 50)}..."`);

  try {
    const url = `${RAPIDAPI_TAOBAO_BASE_URL}/image_search?image_url=${encodeURIComponent(proxyUrl)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_TAOBAO_HOST,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Taobao] Image search error (${response.status}):`, errorText);
      throw new Error(`Taobao image search failed: ${response.status}`);
    }

    const data = await response.json();
    const items = data?.result?.items || data?.items || data?.data?.items || [];
    console.log(`[Taobao] Image search found ${items.length} items`);

    const products = parseTaobaoResults(items.slice(0, maxResults));

    return {
      source: 'taobao',
      query: 'Image search',
      products,
      totalFound: items.length,
      searchedAt: new Date(),
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[Taobao] Image search timeout after 15s');
    }
    console.error(`[Taobao] Image search error:`, error.message);
    return {
      source: 'taobao',
      query: 'Image search',
      products: [],
      totalFound: 0,
      searchedAt: new Date(),
      error: error.message,
    };
  }
}

// ============================================================================
// Item Details
// ============================================================================

/**
 * Récupère les détails d'un produit Taobao
 */
export async function getTaobaoItemDetail(
  itemId: string
): Promise<MarketplaceProduct | null> {
  console.log(`[Taobao] Getting details for item: ${itemId}`);

  try {
    const url = `${RAPIDAPI_TAOBAO_BASE_URL}/item_detail?item_id=${itemId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_TAOBAO_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`Taobao item detail failed: ${response.status}`);
    }

    const data = await response.json();
    const item = data?.result || data?.data || data;

    if (!item) return null;

    return parseSingleTaobaoItem(item);
  } catch (error: any) {
    console.error(`[Taobao] Item detail error:`, error.message);
    return null;
  }
}

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse les résultats bruts Taobao en MarketplaceProduct[]
 */
function parseTaobaoResults(rawItems: any[]): MarketplaceProduct[] {
  return rawItems
    .filter(item => item && (item.item_id || item.num_iid || item.nid))
    .map((item) => parseSingleTaobaoItem(item))
    .filter((p): p is MarketplaceProduct => p !== null);
}

function parseSingleTaobaoItem(item: any): MarketplaceProduct | null {
  try {
    const itemId = String(item.item_id || item.num_iid || item.nid || '');
    if (!itemId) return null;

    const price = parseFloat(item.price || item.promotion_price || item.reserve_price || '0');

    let imageUrl = item.pic || item.pic_url || item.main_pic || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https:${imageUrl}`;
    }

    return {
      externalId: itemId,
      source: 'taobao',
      title: item.title || item.raw_title || 'Unknown',
      titleZh: item.title || item.raw_title || undefined,
      priceMin: price,
      priceMax: price,
      currency: 'CNY',
      moq: parseInt(item.min_buy || '1', 10) || 1,
      imageUrl: convertToDisplayProxyUrl(imageUrl),
      mainImageUrl: convertToDisplayProxyUrl(imageUrl),
      extraImages: (item.small_images?.string || item.images || []).map(
        (img: string) => convertToDisplayProxyUrl(img.startsWith('http') ? img : `https:${img}`)
      ),
      productUrl: `https://item.taobao.com/item.htm?id=${itemId}`,
      supplierName: item.nick || item.seller_nick || item.shop_title || undefined,
      supplierLocation: item.item_loc || item.location || undefined,
      supplierRating: item.seller_info?.score ? parseFloat(item.seller_info.score) : undefined,
      rawData: item,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Combined Search (image + keyword fallback)
// ============================================================================

/**
 * Recherche combinée : essaie par image d'abord, fallback sur mot-clé
 */
export async function searchTaobaoForItem(
  name: string,
  imageUrl?: string,
  options: { maxResults?: number } = {}
): Promise<MarketplaceSearchResult> {
  const { maxResults = 10 } = options;

  // Try image search first if image available
  if (imageUrl) {
    const imageResults = await searchTaobaoByImage(imageUrl, { maxResults });
    if (imageResults.products.length > 0) {
      return imageResults;
    }
    console.log('[Taobao] Image search returned no results, falling back to keyword');
    await delay(RATE_LIMIT_DELAY_MS);
  }

  // Fallback to keyword search
  return searchTaobaoByKeyword(name, { maxResults });
}
