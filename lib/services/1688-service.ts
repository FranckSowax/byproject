/**
 * Service pour la recherche de produits sur 1688.com via Apify
 *
 * Ce service utilise l'API Apify directement (pas MCP côté serveur)
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

// Configuration Apify
const APIFY_TOKEN = process.env.APIFY_TOKEN || '';
const APIFY_BASE_URL = 'https://api.apify.com/v2';

// Actor IDs
const SEARCH_ACTOR_ID = 'ecomscrape~1688-product-search-scraper';
const DETAILS_ACTOR_ID = 'ecomscrape~1688-product-details-page-scraper';

// Rate limiting
const RATE_LIMIT_DELAY_MS = 2000; // 2 secondes entre chaque requête

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
 * Appelle un Actor Apify en mode synchrone (attend le résultat directement)
 * Utilise l'endpoint run-sync qui bloque jusqu'à completion
 * Timeout de 20 secondes pour rester sous les limites serverless
 */
async function runApifyActorSync(actorId: string, input: Record<string, any>): Promise<any> {
  if (!APIFY_TOKEN) {
    throw new Error('APIFY_TOKEN is not configured');
  }

  // Utiliser l'endpoint run-sync-get-dataset-items pour obtenir les résultats directement
  // timeout=20 pour rester sous la limite de Netlify (26s)
  const syncUrl = `${APIFY_BASE_URL}/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=20`;

  console.log(`[1688] Starting sync actor ${actorId} with input:`, JSON.stringify(input).substring(0, 200));

  try {
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[1688] Sync actor failed:`, errorText);

      // Si timeout, retourner un tableau vide plutôt que d'échouer
      if (response.status === 408 || errorText.includes('timeout')) {
        console.warn(`[1688] Actor timed out, returning empty results`);
        return [];
      }

      throw new Error(`Apify actor failed: ${errorText}`);
    }

    const results = await response.json();
    console.log(`[1688] Sync actor completed, got ${results.length} results`);
    return results;
  } catch (error: any) {
    // Gérer les erreurs de timeout réseau
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      console.warn(`[1688] Network timeout, returning empty results`);
      return [];
    }
    throw error;
  }
}

/**
 * Appelle un Actor Apify en mode asynchrone (démarre et retourne l'ID)
 * Utile pour les recherches longues qui seront récupérées plus tard
 */
async function startApifyActorAsync(actorId: string, input: Record<string, any>): Promise<{ runId: string; datasetId: string }> {
  if (!APIFY_TOKEN) {
    throw new Error('APIFY_TOKEN is not configured');
  }

  const runUrl = `${APIFY_BASE_URL}/acts/${actorId}/runs?token=${APIFY_TOKEN}`;

  console.log(`[1688] Starting async actor ${actorId}`);

  const runResponse = await fetch(runUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!runResponse.ok) {
    const error = await runResponse.text();
    throw new Error(`Failed to start Apify actor: ${error}`);
  }

  const runData = await runResponse.json();
  return {
    runId: runData.data.id,
    datasetId: runData.data.defaultDatasetId,
  };
}

/**
 * Vérifie le statut d'un run Apify et récupère les résultats si terminé
 */
export async function checkApifyRunStatus(actorId: string, runId: string): Promise<{
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED';
  results?: any[];
}> {
  if (!APIFY_TOKEN) {
    throw new Error('APIFY_TOKEN is not configured');
  }

  const statusUrl = `${APIFY_BASE_URL}/acts/${actorId}/runs/${runId}?token=${APIFY_TOKEN}`;
  const statusResponse = await fetch(statusUrl);
  const statusData = await statusResponse.json();

  const status = statusData.data.status;

  if (status === 'SUCCEEDED') {
    const datasetId = statusData.data.defaultDatasetId;
    const datasetUrl = `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${APIFY_TOKEN}`;
    const datasetResponse = await fetch(datasetUrl);
    const results = await datasetResponse.json();
    return { status, results };
  }

  return { status };
}

/**
 * Parse les résultats bruts de l'API Apify en Product1688
 */
function parseApifyResults(rawResults: any[]): Product1688[] {
  return rawResults.map((item, index) => {
    const priceMin = parseFloat(item.priceMin || item.price || 0);
    const priceMax = parseFloat(item.priceMax || item.price || priceMin);

    return {
      id: item.id || item.offerId || `1688-${index}-${Date.now()}`,
      title: item.title || item.name || 'Unknown',
      titleChinese: item.titleChinese || item.title || '',
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
      moq: parseInt(item.moq || item.minOrder || '1', 10),
      sold: parseInt(item.sold || item.salesCount || '0', 10),
      supplier: {
        name: item.supplierName || item.companyName || 'Unknown',
        location: item.supplierLocation || item.location || 'China',
        yearsOnPlatform: item.yearsOnPlatform ? parseInt(item.yearsOnPlatform, 10) : undefined,
        rating: item.supplierRating ? parseFloat(item.supplierRating) : undefined,
        isVerified: item.isVerified || false,
      },
      imageUrl: item.imageUrl || item.image || item.mainImage || '',
      productUrl: item.productUrl || item.url || item.detailUrl || '',
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
    const input = {
      keyword: searchKeyword,
      maxItems: maxResults,
      // Options supplémentaires si supportées par l'actor
    };

    const rawResults = await runApifyActorSync(SEARCH_ACTOR_ID, input);
    let products = parseApifyResults(rawResults);

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
 * Récupère les détails d'un produit sur 1688.com
 */
export async function get1688ProductDetails(productUrl: string): Promise<ProductDetails1688> {
  console.log(`[1688] Getting details for: ${productUrl}`);

  try {
    const input = {
      startUrls: [{ url: productUrl }],
    };

    const rawResults = await runApifyActorSync(DETAILS_ACTOR_ID, input);

    if (!rawResults || rawResults.length === 0) {
      throw new Error('No details found for this product');
    }

    const item = rawResults[0];
    const baseProduct = parseApifyResults([item])[0];

    return {
      ...baseProduct,
      description: item.description || '',
      priceTiers: item.priceTiers?.map((tier: any) => ({
        minQuantity: parseInt(tier.minQty || '1', 10),
        maxQuantity: tier.maxQty ? parseInt(tier.maxQty, 10) : undefined,
        pricePerUnit: parseFloat(tier.price || '0'),
        currency: 'CNY' as const,
      })),
      stock: item.stock ? parseInt(item.stock, 10) : undefined,
      shippingInfo: item.shippingWeight ? {
        weight: parseFloat(item.shippingWeight),
        dimensions: item.dimensions,
        shippingCost: item.shippingCost ? parseFloat(item.shippingCost) : undefined,
      } : undefined,
      attributes: item.attributes || {},
      images: item.images || [item.imageUrl],
      reviews: item.reviewCount ? {
        count: parseInt(item.reviewCount, 10),
        rating: parseFloat(item.rating || '0'),
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
