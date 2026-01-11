/**
 * Service pour la recherche de produits sur 1688.com via RapidAPI
 *
 * Ce service utilise l'API RapidAPI 1688-product2 directement
 * pour rechercher des produits sur la marketplace B2B chinoise 1688.com
 */

import {
  Product1688,
  SearchResult1688,
  ProductListSearchResult,
  ProductDetails1688,
  Search1688Options,
  Search1688Error,
  CNY_TO_FCFA_RATE,
  convertCNYtoFCFA,
  FRENCH_TO_CHINESE_TERMS,
} from '@/lib/types/1688';
import { completeText } from '@/lib/ai/clients';

// Configuration RapidAPI 1688-product2
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'c681296a52mshc2c73586baf893bp135671jsn76eb375db9e7';
const RAPIDAPI_HOST = '1688-product2.p.rapidapi.com';
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}`;

// Rate limiting
const RATE_LIMIT_DELAY_MS = 1000; // 1 seconde entre chaque requête

/**
 * Délai utilitaire pour le rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Traduit un terme français en chinois si disponible
 */
export function translateToChines(text: string): string {
  const lowerText = text.toLowerCase().trim();

  // Vérifier si le terme existe dans notre mapping
  if (FRENCH_TO_CHINESE_TERMS[lowerText]) {
    return FRENCH_TO_CHINESE_TERMS[lowerText];
  }

  // Sinon, essayer de trouver des correspondances partielles
  for (const [french, chinese] of Object.entries(FRENCH_TO_CHINESE_TERMS)) {
    if (lowerText.includes(french)) {
      return lowerText.replace(french, chinese);
    }
  }

  // Si aucune traduction trouvée, retourner le texte original
  return text;
}

/**
 * Traduit un texte chinois en français en utilisant l'IA
 */
async function translateChineseToFrench(text: string): Promise<string> {
  if (!text || text.trim() === '') return text;

  // Vérifier si le texte contient des caractères chinois
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
    console.error('[1688] Translation error:', error);
    return text; // Retourner le texte original en cas d'erreur
  }
}

/**
 * Traduit plusieurs titres chinois en français en batch
 */
async function translateTitlesBatch(titles: string[]): Promise<string[]> {
  if (titles.length === 0) return [];

  // Filtrer les titres avec des caractères chinois
  const chineseTitles = titles.filter(t => /[\u4e00-\u9fa5]/.test(t));
  if (chineseTitles.length === 0) return titles;

  try {
    // Créer un prompt batch pour économiser les appels API
    const numberedTitles = chineseTitles.map((t, i) => `${i + 1}. ${t}`).join('\n');

    const translated = await completeText(
      numberedTitles,
      `You are a professional translator specializing in product names. Translate each Chinese product title to French.
Keep each translation on a separate line with the same numbering format.
Be concise and accurate. Return ONLY the numbered translations, nothing else.
Example format:
1. French translation 1
2. French translation 2`,
      { temperature: 0.2, maxTokens: 2000 }
    );

    // Parser les résultats
    const lines = translated.trim().split('\n');
    const translationMap = new Map<number, string>();

    for (const line of lines) {
      const match = line.match(/^(\d+)\.\s*(.+)$/);
      if (match) {
        translationMap.set(parseInt(match[1]) - 1, match[2].trim());
      }
    }

    // Reconstruire le tableau avec les traductions
    let chineseIndex = 0;
    return titles.map(title => {
      if (/[\u4e00-\u9fa5]/.test(title)) {
        const translation = translationMap.get(chineseIndex);
        chineseIndex++;
        return translation || title;
      }
      return title;
    });
  } catch (error) {
    console.error('[1688] Batch translation error:', error);
    return titles; // Retourner les titres originaux en cas d'erreur
  }
}

/**
 * Recherche des produits sur 1688.com via RapidAPI 1688-product2
 */
async function searchRapidAPI(keyword: string, pageSize: number = 20): Promise<any[]> {
  // Endpoint: /1688/search/items?page=1&keyword=xxx&sort=default
  const url = `${RAPIDAPI_BASE_URL}/1688/search/items?page=1&keyword=${encodeURIComponent(keyword)}&sort=default`;

  console.log(`[1688] RapidAPI search: "${keyword}"`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[1688] RapidAPI error:`, errorText);
      throw new Error(`RapidAPI failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`[1688] RapidAPI response received`);

    // L'API 1688-product2 retourne les items dans data.data.items
    if (data.code !== 200) {
      console.error(`[1688] API error:`, data.msg);
      throw new Error(`API error: ${data.msg}`);
    }

    const items = data?.data?.items || [];
    console.log(`[1688] Found ${items.length} items`);

    // Limiter au nombre demandé
    return items.slice(0, pageSize);
  } catch (error: any) {
    console.error(`[1688] RapidAPI error:`, error.message);
    throw error;
  }
}


/**
 * Parse les résultats bruts de l'API RapidAPI 1688-product2 en Product1688
 */
function parseRapidAPIResults(rawResults: any[]): Product1688[] {
  return rawResults
    .filter(item => item && item.item_id && item.title) // Filtrer les items null/invalides
    .map((item, index) => {
      // Format 1688-product2:
      // item_id, title, img, price, price_info (wholesale_price, drop_ship_price, sale_price, origin_price),
      // quantity_begin, sale_info (sale_quantity, gmv_30days, booked_count),
      // delivery_info, shop_info, item_repurchase_rate, etc.

      // Prix - utiliser sale_price, wholesale_price ou price
      const price = parseFloat(
        item.price_info?.sale_price ||
        item.price_info?.wholesale_price ||
        item.price_info?.origin_price ||
        item.price ||
        '0'
      );

      // MOQ - utiliser quantity_begin
      const moq = parseInt(item.quantity_begin || '1', 10);

      // Ventes - parser sale_quantity (peut être "215617" ou "1万+")
      let sold = 0;
      if (item.sale_info?.sale_quantity) {
        const saleStr = String(item.sale_info.sale_quantity);
        if (saleStr.includes('万')) {
          sold = parseFloat(saleStr.replace('万+', '').replace('万', '')) * 10000;
        } else {
          sold = parseInt(saleStr.replace(/[^\d]/g, ''), 10) || 0;
        }
      }

      // Taux de retour de commande (item_repurchase_rate: "17%", "39%", etc.)
      let repurchaseRate: number | undefined;
      if (item.item_repurchase_rate) {
        const rateStr = String(item.item_repurchase_rate).replace('%', '');
        const rateNum = parseFloat(rateStr);
        if (!isNaN(rateNum)) {
          repurchaseRate = rateNum;
        }
      }

      // Info fournisseur
      const shopInfo = item.shop_info || {};
      const scoreInfo = shopInfo.sore_info || shopInfo.score_info || {};
      const deliveryInfo = item.delivery_info || {};

      // Location
      const location = deliveryInfo.area_from
        ? deliveryInfo.area_from.filter((s: string) => s).join(', ')
        : 'China';

      // Image - améliorer l'URL si nécessaire
      let imageUrl = item.img || '';
      // S'assurer que l'URL de l'image est en HTTPS
      if (imageUrl && imageUrl.startsWith('http://')) {
        imageUrl = imageUrl.replace('http://', 'https://');
      }

      return {
        id: String(item.item_id || `1688-${index}-${Date.now()}`),
        title: item.title || 'Unknown',
        titleChinese: item.title || '',
        price: {
          min: price,
          max: price,
          currency: 'CNY' as const,
        },
        priceInFCFA: {
          min: convertCNYtoFCFA(price),
          max: convertCNYtoFCFA(price),
          currency: 'FCFA' as const,
        },
        moq: moq,
        sold: sold,
        repurchaseRate: repurchaseRate,
        supplier: {
          name: shopInfo.company_name || shopInfo.login_id || 'Unknown',
          location: location,
          yearsOnPlatform: shopInfo.tp_year ? parseInt(shopInfo.tp_year, 10) : undefined,
          rating: scoreInfo.composite_new_score ? parseFloat(scoreInfo.composite_new_score) : undefined,
          isVerified: shopInfo.tp_member === true || shopInfo.tp_member === 'true' || shopInfo.factory_inspection === true,
        },
        imageUrl: imageUrl,
        productUrl: `https://detail.1688.com/offer/${item.item_id}.html`,
      };
    });
}

/**
 * Trie les produits par qualité (note + taux de retour)
 */
function sortByQuality(products: Product1688[]): Product1688[] {
  return [...products].sort((a, b) => {
    // Score combiné: note du fournisseur + taux de retour
    const scoreA = (a.supplier.rating || 0) + (a.repurchaseRate || 0) / 10;
    const scoreB = (b.supplier.rating || 0) + (b.repurchaseRate || 0) / 10;
    return scoreB - scoreA; // Tri décroissant
  });
}

/**
 * Recherche des produits par image sur 1688.com via RapidAPI 1688-product2
 */
async function searchByImageRapidAPI(imageUrl: string, pageSize: number = 5): Promise<any[]> {
  // Endpoint: /1688/search/image?page=1&sort=default
  const url = `${RAPIDAPI_BASE_URL}/1688/search/image?page=1&sort=default&img_url=${encodeURIComponent(imageUrl)}`;

  console.log(`[1688] RapidAPI image search URL: ${url.substring(0, 150)}...`);
  console.log(`[1688] Image URL being searched: ${imageUrl}`);

  try {
    // Ajouter un timeout de 15 secondes pour la recherche par image
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[1688] RapidAPI image search error (${response.status}):`, errorText);
      throw new Error(`RapidAPI image search failed: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log(`[1688] RapidAPI image search response code: ${data.code}`);

    if (data.code !== 200) {
      console.error(`[1688] API error code ${data.code}:`, data.msg);
      throw new Error(`API error (${data.code}): ${data.msg || 'Unknown error'}`);
    }

    const items = data?.data?.items || [];
    console.log(`[1688] Found ${items.length} items by image search`);

    // Limiter au nombre demandé
    return items.slice(0, pageSize);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[1688] Image search timeout after 15s`);
      throw new Error('Image search timeout - the image URL may not be accessible');
    }
    console.error(`[1688] RapidAPI image search error:`, error.message);
    throw error;
  }
}

/**
 * Recherche un produit par image sur 1688.com
 * Retourne une erreur si aucun résultat n'est trouvé pour déclencher le fallback
 */
export async function search1688ProductByImage(
  imageUrl: string,
  options: Search1688Options = {}
): Promise<SearchResult1688> {
  const { maxResults = 5 } = options;

  console.log(`[1688] Searching by image: "${imageUrl.substring(0, 50)}..."`);

  try {
    const rawResults = await searchByImageRapidAPI(imageUrl, maxResults);

    // Si aucun résultat, lancer une erreur pour déclencher le fallback vers la recherche par mot-clé
    if (!rawResults || rawResults.length === 0) {
      console.log(`[1688] Image search returned 0 results, triggering fallback`);
      throw new Error('Image search returned no results - fallback to keyword search');
    }

    let products = parseRapidAPIResults(rawResults);

    // Trier par qualité (note + taux de retour)
    products = sortByQuality(products);

    // Traduire les titres chinois en français
    if (products.length > 0) {
      console.log(`[1688] Translating ${products.length} product titles to French...`);
      const chineseTitles = products.map(p => p.titleChinese);
      const frenchTitles = await translateTitlesBatch(chineseTitles);

      products = products.map((product, index) => ({
        ...product,
        title: frenchTitles[index] || product.title,
        titleChinese: product.titleChinese,
      }));
      console.log(`[1688] Translation complete`);
    }

    // Appliquer les filtres
    if (options.minPrice !== undefined) {
      products = products.filter(p => p.price.min >= options.minPrice!);
    }
    if (options.maxPrice !== undefined) {
      products = products.filter(p => p.price.max <= options.maxPrice!);
    }
    if (options.minMOQ !== undefined) {
      products = products.filter(p => p.moq >= options.minMOQ!);
    }
    if (options.maxMOQ !== undefined) {
      products = products.filter(p => p.moq <= options.maxMOQ!);
    }
    if (options.minRating !== undefined) {
      products = products.filter(p => (p.supplier.rating || 0) >= options.minRating!);
    }

    return {
      searchQuery: 'Image search',
      results: products,
      searchedAt: new Date(),
      totalFound: products.length,
    };
  } catch (error: any) {
    console.error(`[1688] Image search error:`, error);
    throw {
      code: 'IMAGE_SEARCH_ERROR',
      message: error.message || 'Unknown image search error',
    } as Search1688Error;
  }
}

/**
 * Recherche un produit sur 1688.com
 */
export async function search1688Product(
  keyword: string,
  options: Search1688Options = {}
): Promise<SearchResult1688> {
  const { maxResults = 5, translateToChines: shouldTranslate = true } = options;

  // Traduire si nécessaire
  const searchKeyword = shouldTranslate ? translateToChines(keyword) : keyword;

  console.log(`[1688] Searching for: "${keyword}" (Chinese: "${searchKeyword}")`);

  try {
    const rawResults = await searchRapidAPI(searchKeyword, maxResults * 2); // Récupérer plus pour le tri
    let products = parseRapidAPIResults(rawResults);

    // Trier par qualité (note + taux de retour)
    products = sortByQuality(products);

    // Limiter au nombre demandé après le tri
    products = products.slice(0, maxResults);

    // Traduire les titres chinois en français
    if (products.length > 0) {
      console.log(`[1688] Translating ${products.length} product titles to French...`);
      const chineseTitles = products.map(p => p.titleChinese);
      const frenchTitles = await translateTitlesBatch(chineseTitles);

      // Mettre à jour les produits avec les titres traduits
      products = products.map((product, index) => ({
        ...product,
        title: frenchTitles[index] || product.title,
        titleChinese: product.titleChinese, // Garder le titre chinois original
      }));
      console.log(`[1688] Translation complete`);
    }

    // Appliquer les filtres
    if (options.minPrice !== undefined) {
      products = products.filter(p => p.price.min >= options.minPrice!);
    }
    if (options.maxPrice !== undefined) {
      products = products.filter(p => p.price.max <= options.maxPrice!);
    }
    if (options.minMOQ !== undefined) {
      products = products.filter(p => p.moq >= options.minMOQ!);
    }
    if (options.maxMOQ !== undefined) {
      products = products.filter(p => p.moq <= options.maxMOQ!);
    }
    if (options.minRating !== undefined) {
      products = products.filter(p => (p.supplier.rating || 0) >= options.minRating!);
    }

    return {
      searchQuery: keyword,
      searchQueryChinese: searchKeyword !== keyword ? searchKeyword : undefined,
      results: products,
      searchedAt: new Date(),
      totalFound: products.length,
    };
  } catch (error: any) {
    console.error(`[1688] Search error for "${keyword}":`, error);
    throw {
      code: 'SEARCH_ERROR',
      message: error.message || 'Unknown search error',
      searchQuery: keyword,
    } as Search1688Error;
  }
}

/**
 * Récupère les détails d'un produit sur 1688.com via RapidAPI 1688-product2
 */
export async function get1688ProductDetails(productUrl: string): Promise<ProductDetails1688> {
  console.log(`[1688] Getting details for: ${productUrl}`);

  try {
    // Extraire l'ID du produit de l'URL
    const match = productUrl.match(/offer\/(\d+)\.html/) || productUrl.match(/(\d{10,})/);
    const productId = match ? match[1] : null;

    if (!productId) {
      throw new Error('Could not extract product ID from URL');
    }

    // Utiliser l'endpoint /1688/item/detail de RapidAPI 1688-product2
    const url = `${RAPIDAPI_BASE_URL}/1688/item/detail?item_id=${productId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`RapidAPI details failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error(`API error: ${data.msg}`);
    }

    const item = data?.data;

    if (!item) {
      throw new Error('No details found for this product');
    }

    // Parser les prix par paliers
    const priceTiers = item.price_info?.price_range?.map((tier: any) => ({
      minQuantity: parseInt(tier.begin_amount || '1', 10),
      maxQuantity: tier.end_amount ? parseInt(tier.end_amount, 10) : undefined,
      pricePerUnit: parseFloat(tier.price || '0'),
      currency: 'CNY' as const,
    }));

    const price = parseFloat(item.price_info?.price || '0');
    const shopInfo = item.shop_info || {};
    const scoreInfo = shopInfo.score_info || {};

    return {
      id: String(item.item_id),
      title: item.title || 'Unknown',
      titleChinese: item.title || '',
      price: {
        min: price,
        max: price,
        currency: 'CNY' as const,
      },
      priceInFCFA: {
        min: convertCNYtoFCFA(price),
        max: convertCNYtoFCFA(price),
        currency: 'FCFA' as const,
      },
      moq: item.min_order_quantity || 1,
      sold: item.sale_info?.sale_quantity_int || 0,
      supplier: {
        name: shopInfo.company_name || shopInfo.login_id || 'Unknown',
        location: shopInfo.location ? shopInfo.location.join(', ') : 'China',
        yearsOnPlatform: shopInfo.shop_years,
        rating: scoreInfo.composite_new_score ? parseFloat(scoreInfo.composite_new_score) : undefined,
        isVerified: shopInfo.is_factory || false,
      },
      imageUrl: item.main_imgs?.[0] || '',
      productUrl: item.product_url || productUrl,
      description: item.description || '',
      priceTiers,
      stock: item.quantity,
      attributes: item.sku_props || {},
      images: item.main_imgs || [],
    };
  } catch (error: any) {
    console.error(`[1688] Details error for "${productUrl}":`, error);
    throw {
      code: 'DETAILS_ERROR',
      message: error.message || 'Unknown details error',
    } as Search1688Error;
  }
}

/**
 * Recherche une liste de produits avec rate limiting
 */
export async function searchProductList(
  products: string[],
  options: Search1688Options = {},
  onProgress?: (completed: number, total: number, current: string) => void
): Promise<ProductListSearchResult> {
  const startedAt = new Date();
  const results: SearchResult1688[] = [];
  let failedSearches = 0;

  console.log(`[1688] Starting batch search for ${products.length} products`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    // Callback de progression
    if (onProgress) {
      onProgress(i, products.length, product);
    }

    try {
      const result = await search1688Product(product, options);
      results.push(result);
      console.log(`[1688] Completed ${i + 1}/${products.length}: "${product}" - ${result.totalFound} results`);
    } catch (error) {
      console.error(`[1688] Failed ${i + 1}/${products.length}: "${product}"`, error);
      failedSearches++;
      // Ajouter un résultat vide pour ce produit
      results.push({
        searchQuery: product,
        results: [],
        searchedAt: new Date(),
        totalFound: 0,
      });
    }

    // Rate limiting: attendre avant la prochaine requête (sauf pour la dernière)
    if (i < products.length - 1) {
      await delay(RATE_LIMIT_DELAY_MS);
    }
  }

  // Callback final
  if (onProgress) {
    onProgress(products.length, products.length, 'Completed');
  }

  return {
    totalProducts: products.length,
    completedSearches: products.length - failedSearches,
    failedSearches,
    results,
    startedAt,
    completedAt: new Date(),
  };
}

/**
 * Recherche des produits pour une demande de cotation
 * Prend les matériaux d'un projet et recherche sur 1688
 * Privilégie la recherche par image si une image est disponible
 */
export async function searchQuoteRequestProducts(
  materials: Array<{ name: string; description?: string; quantity?: number; images?: string[] }>,
  options: Search1688Options = {}
): Promise<ProductListSearchResult> {
  const startedAt = new Date();
  const results: SearchResult1688[] = [];
  let failedSearches = 0;

  console.log(`[1688] Starting quote request search for ${materials.length} materials`);

  for (let i = 0; i < materials.length; i++) {
    const material = materials[i];
    const imageUrl = material.images && material.images.length > 0 ? material.images[0] : null;
    const searchTerm = material.description
      ? `${material.name} ${material.description}`.trim()
      : material.name;

    try {
      let result: SearchResult1688;

      // Privilégier la recherche par image si disponible
      if (imageUrl) {
        console.log(`[1688] Using image search for "${material.name}": ${imageUrl.substring(0, 50)}...`);
        try {
          result = await search1688ProductByImage(imageUrl, options);
          result.searchQuery = searchTerm; // Garder le nom du matériau comme query
        } catch (imageError: any) {
          console.warn(`[1688] Image search failed for "${material.name}", falling back to keyword: ${imageError.message}`);
          result = await search1688Product(searchTerm, options);
        }
      } else {
        result = await search1688Product(searchTerm, options);
      }

      results.push(result);
      console.log(`[1688] Completed ${i + 1}/${materials.length}: "${material.name}" - ${result.totalFound} results`);
    } catch (error) {
      console.error(`[1688] Failed ${i + 1}/${materials.length}: "${material.name}"`, error);
      failedSearches++;
      results.push({
        searchQuery: searchTerm,
        results: [],
        searchedAt: new Date(),
        totalFound: 0,
      });
    }

    // Rate limiting
    if (i < materials.length - 1) {
      await delay(RATE_LIMIT_DELAY_MS);
    }
  }

  return {
    totalProducts: materials.length,
    completedSearches: materials.length - failedSearches,
    failedSearches,
    results,
    startedAt,
    completedAt: new Date(),
  };
}
