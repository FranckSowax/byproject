/**
 * Service pour la recherche de produits sur 1688.com via RapidAPI
 *
 * Ce service utilise l'API RapidAPI 1688-datahub directement
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

// Configuration RapidAPI 1688-datahub
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'c681296a52mshc2c73586baf893bp135671jsn76eb375db9e7';
const RAPIDAPI_HOST = '1688-datahub.p.rapidapi.com';
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
 * Recherche des produits sur 1688.com via RapidAPI
 */
async function searchRapidAPI(keyword: string, pageSize: number = 20): Promise<any[]> {
  const url = `${RAPIDAPI_BASE_URL}/item_search?q=${encodeURIComponent(keyword)}&page=1&pageSize=${pageSize}&sort=default`;

  console.log(`[1688] RapidAPI search: "${keyword}" (pageSize: ${pageSize})`);

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

    // L'API retourne les items dans data.result.resultList ou data.items selon la structure
    const items = data?.result?.resultList || data?.items || data?.data || [];
    console.log(`[1688] Found ${items.length} items`);

    return items;
  } catch (error: any) {
    console.error(`[1688] RapidAPI error:`, error.message);
    throw error;
  }
}


/**
 * Parse les résultats bruts de l'API RapidAPI en Product1688
 */
function parseRapidAPIResults(rawResults: any[]): Product1688[] {
  return rawResults.map((item, index) => {
    // RapidAPI 1688-datahub format
    // Essayer différents formats de prix possibles
    let priceMin = 0;
    let priceMax = 0;

    if (item.price) {
      if (typeof item.price === 'string') {
        // Format "10.00-20.00" ou "10.00"
        const priceParts = item.price.split('-');
        priceMin = parseFloat(priceParts[0]) || 0;
        priceMax = parseFloat(priceParts[1] || priceParts[0]) || priceMin;
      } else if (typeof item.price === 'number') {
        priceMin = item.price;
        priceMax = item.price;
      }
    }
    if (item.priceMin) priceMin = parseFloat(item.priceMin);
    if (item.priceMax) priceMax = parseFloat(item.priceMax);
    if (priceMax === 0) priceMax = priceMin;

    // Extraire l'ID du produit
    const productId = item.offerId || item.id || item.itemId || item.productId || `1688-${index}-${Date.now()}`;

    // Construire l'URL du produit
    let productUrl = item.productUrl || item.url || item.detailUrl || item.itemUrl || '';
    if (!productUrl && productId) {
      productUrl = `https://detail.1688.com/offer/${productId}.html`;
    }

    return {
      id: String(productId),
      title: item.title || item.name || item.subject || 'Unknown',
      titleChinese: item.title || item.subject || '',
      price: {
        min: priceMin,
        max: priceMax,
        currency: 'CNY' as const,
      },
      priceInFCFA: {
        min: convertCNYtoFCFA(priceMin),
        max: convertCNYtoFCFA(priceMax),
        currency: 'FCFA' as const,
      },
      moq: parseInt(item.moq || item.minOrder || item.beginAmount || '1', 10),
      sold: parseInt(item.sold || item.salesCount || item.monthSold || item.gmvMonthCount || '0', 10),
      supplier: {
        name: item.supplierName || item.companyName || item.sellerName || item.shopName || 'Unknown',
        location: item.supplierLocation || item.location || item.sellerProvince || 'China',
        yearsOnPlatform: item.yearsOnPlatform ? parseInt(item.yearsOnPlatform, 10) : undefined,
        rating: item.supplierRating || item.sellerReputation ? parseFloat(item.supplierRating || item.sellerReputation) : undefined,
        isVerified: item.isVerified || item.isTp || false,
      },
      imageUrl: item.imageUrl || item.image || item.mainImage || item.imgUrl || item.picUrl || '',
      productUrl: productUrl,
    };
  });
}

/**
 * Recherche un produit sur 1688.com
 */
export async function search1688Product(
  keyword: string,
  options: Search1688Options = {}
): Promise<SearchResult1688> {
  const { maxResults = 10, translateToChines: shouldTranslate = true } = options;

  // Traduire si nécessaire
  const searchKeyword = shouldTranslate ? translateToChines(keyword) : keyword;

  console.log(`[1688] Searching for: "${keyword}" (Chinese: "${searchKeyword}")`);

  try {
    const rawResults = await searchRapidAPI(searchKeyword, maxResults);
    let products = parseRapidAPIResults(rawResults);

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
 * Récupère les détails d'un produit sur 1688.com via RapidAPI
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

    // Utiliser l'endpoint item_detail de RapidAPI
    const url = `${RAPIDAPI_BASE_URL}/item_detail?id=${productId}`;

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
    const item = data?.result || data?.data || data;

    if (!item) {
      throw new Error('No details found for this product');
    }

    const baseProduct = parseRapidAPIResults([item])[0];

    return {
      ...baseProduct,
      description: item.description || item.briefDescription || '',
      priceTiers: item.priceRange?.map((tier: any) => ({
        minQuantity: parseInt(tier.minAmount || tier.beginAmount || '1', 10),
        maxQuantity: tier.maxAmount ? parseInt(tier.maxAmount, 10) : undefined,
        pricePerUnit: parseFloat(tier.price || '0'),
        currency: 'CNY' as const,
      })),
      stock: item.stock || item.quantity ? parseInt(item.stock || item.quantity, 10) : undefined,
      shippingInfo: item.shippingWeight || item.weight ? {
        weight: parseFloat(item.shippingWeight || item.weight || '0'),
        dimensions: item.dimensions,
        shippingCost: item.shippingCost ? parseFloat(item.shippingCost) : undefined,
      } : undefined,
      attributes: item.attributes || item.skuProps || {},
      images: item.images || item.imgList || [item.imageUrl],
      reviews: item.reviewCount || item.rateCount ? {
        count: parseInt(item.reviewCount || item.rateCount, 10),
        rating: parseFloat(item.rating || item.avgScore || '0'),
      } : undefined,
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
 */
export async function searchQuoteRequestProducts(
  materials: Array<{ name: string; description?: string; quantity?: number }>,
  options: Search1688Options = {}
): Promise<ProductListSearchResult> {
  // Construire les termes de recherche à partir des matériaux
  const searchTerms = materials.map(m => {
    if (m.description) {
      return `${m.name} ${m.description}`.trim();
    }
    return m.name;
  });

  return searchProductList(searchTerms, options);
}
