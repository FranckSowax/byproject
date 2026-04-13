/**
 * Agrégateur de recherche marketplace
 * Orchestre les recherches en parallèle sur 1688, Taobao et Kimi
 * et sauvegarde les résultats dans la base de données
 */

import { createClient } from '@supabase/supabase-js';
import type {
  MarketplaceProduct,
  MarketplaceSearchResult,
  MarketplaceSource,
  AggregatedSearchResult,
  SearchProgress,
  ClientRequestItem,
} from '@/lib/types/marketplace';
import { search1688Product, search1688ProductByImage } from '@/lib/services/1688-service';
import { searchTaobaoForItem } from '@/lib/services/taobao-service';
import { searchKimiFactories } from '@/lib/services/kimi-service';
import {
  translateFrenchToChinese,
  translateChineseToFrench,
  translateFrenchToEnglish,
  convertToDisplayProxyUrl,
  delay,
} from '@/lib/services/translation-utils';

// Supabase service client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Config
const RATE_LIMIT_BETWEEN_ITEMS = 1500; // 1.5s entre chaque item
const SEARCH_TIMEOUT_MS = 45000; // 45s hard stop
const MAX_KIMI_FAILURES = 2; // Skip Kimi after N failures

// ============================================================================
// Main Aggregator
// ============================================================================

/**
 * Recherche tous les marketplaces pour un item donné
 * Lance 1688 + Taobao + Kimi en parallèle
 */
export async function searchAllMarketplaces(
  item: ClientRequestItem,
  options: {
    sources?: MarketplaceSource[];
    maxResultsPerSource?: number;
    skipKimi?: boolean;
  } = {}
): Promise<MarketplaceSearchResult[]> {
  const {
    sources = ['1688', 'taobao', 'kimi_factory'],
    maxResultsPerSource = 10,
    skipKimi = false,
  } = options;

  const searchName = item.name_zh || item.name;
  const imageUrl = item.images?.[0] || undefined;
  const results: MarketplaceSearchResult[] = [];

  // Build parallel search promises
  const promises: Promise<MarketplaceSearchResult>[] = [];

  if (sources.includes('1688')) {
    promises.push(search1688ForClientItem(item, maxResultsPerSource));
  }

  if (sources.includes('taobao')) {
    promises.push(searchTaobaoForItem(searchName, imageUrl, { maxResults: maxResultsPerSource }));
  }

  if (sources.includes('kimi_factory') && !skipKimi) {
    promises.push(searchKimiFactories(item.name, { maxResults: 5 }));
  }

  // Run all searches in parallel with timeout
  const settledResults = await Promise.allSettled(
    promises.map(p =>
      Promise.race([
        p,
        new Promise<MarketplaceSearchResult>((_, reject) =>
          setTimeout(() => reject(new Error('Search timeout')), SEARCH_TIMEOUT_MS)
        ),
      ])
    )
  );

  for (const settled of settledResults) {
    if (settled.status === 'fulfilled') {
      results.push(settled.value);
    } else {
      console.error('[Aggregator] Search failed:', settled.reason);
    }
  }

  return results;
}

/**
 * Recherche 1688 pour un item de requête client
 * Combine recherche image + keyword intelligemment
 */
async function search1688ForClientItem(
  item: ClientRequestItem,
  maxResults: number
): Promise<MarketplaceSearchResult> {
  const imageUrl = item.images?.[0];
  const searchQuery = item.name;

  try {
    // Try image search first if image available
    if (imageUrl) {
      try {
        const imageResult = await search1688ProductByImage(imageUrl, { maxResults });
        if (imageResult.results.length > 0) {
          return {
            source: '1688',
            query: searchQuery,
            products: imageResult.results.map(p => convert1688ToMarketplace(p)),
            totalFound: imageResult.totalFound,
            searchedAt: new Date(),
          };
        }
      } catch {
        console.log('[Aggregator] 1688 image search failed, trying keyword');
      }
      await delay(500);
    }

    // Keyword search
    const keywordResult = await search1688Product(searchQuery, { maxResults });
    return {
      source: '1688',
      query: searchQuery,
      queryZh: keywordResult.searchQueryChinese,
      products: keywordResult.results.map(p => convert1688ToMarketplace(p)),
      totalFound: keywordResult.totalFound,
      searchedAt: new Date(),
    };
  } catch (error: any) {
    console.error('[Aggregator] 1688 search error:', error.message);
    return {
      source: '1688',
      query: searchQuery,
      products: [],
      totalFound: 0,
      searchedAt: new Date(),
      error: error.message,
    };
  }
}

/**
 * Convertit un Product1688 en MarketplaceProduct normalisé
 */
function convert1688ToMarketplace(product: any): MarketplaceProduct {
  return {
    externalId: product.id,
    source: '1688',
    title: product.title,
    titleZh: product.titleChinese,
    priceMin: product.price?.min || 0,
    priceMax: product.price?.max || 0,
    currency: 'CNY',
    moq: product.moq || 1,
    imageUrl: product.imageUrl || '',
    productUrl: product.productUrl || '',
    supplierName: product.supplier?.name,
    supplierLocation: product.supplier?.location,
    supplierRating: product.supplier?.rating,
    supplierYears: product.supplier?.yearsOnPlatform,
    supplierVerified: product.supplier?.isVerified,
    rawData: product,
  };
}

// ============================================================================
// Full Request Search
// ============================================================================

/**
 * Recherche tous les items d'une requête client sur tous les marketplaces
 * Met à jour les statuts en temps réel dans la base
 */
export async function searchItemsForRequest(
  clientRequestId: string,
  options: {
    sources?: MarketplaceSource[];
    maxResultsPerSource?: number;
  } = {}
): Promise<{
  totalResults: number;
  errors: Array<{ itemId: string; source: string; error: string }>;
}> {
  const supabase = getServiceClient();
  const startTime = Date.now();
  let totalResults = 0;
  const errors: Array<{ itemId: string; source: string; error: string }> = [];
  let kimiFailures = 0;

  // Update request status to 'searching'
  await supabase
    .from('client_requests')
    .update({ status: 'searching', search_started_at: new Date().toISOString() })
    .eq('id', clientRequestId);

  // Fetch all pending items
  const { data: items, error: fetchError } = await supabase
    .from('client_request_items')
    .select('*')
    .eq('client_request_id', clientRequestId)
    .in('status', ['pending', 'searching'])
    .order('sort_order');

  if (fetchError || !items || items.length === 0) {
    console.error('[Aggregator] Failed to fetch items:', fetchError);
    await supabase
      .from('client_requests')
      .update({ status: 'search_complete' })
      .eq('id', clientRequestId);
    return { totalResults: 0, errors: [] };
  }

  console.log(`[Aggregator] Searching ${items.length} items for request ${clientRequestId}`);

  // Translate items first (batch)
  for (const item of items) {
    if (!item.name_zh) {
      try {
        const nameZh = await translateFrenchToChinese(item.name);
        const nameEn = await translateFrenchToEnglish(item.name);
        await supabase
          .from('client_request_items')
          .update({ name_zh: nameZh, name_en: nameEn })
          .eq('id', item.id);
        item.name_zh = nameZh;
        item.name_en = nameEn;
      } catch (err) {
        console.error('[Aggregator] Translation error for item:', item.name, err);
      }
    }
  }

  // Search each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as ClientRequestItem;

    // Check timeout
    if (Date.now() - startTime > SEARCH_TIMEOUT_MS) {
      console.warn('[Aggregator] Global timeout reached, stopping search');
      break;
    }

    console.log(`[Aggregator] Searching item ${i + 1}/${items.length}: "${item.name}"`);

    // Update item status
    await supabase
      .from('client_request_items')
      .update({ status: 'searching' })
      .eq('id', item.id);

    // Search all sources
    const skipKimi = kimiFailures >= MAX_KIMI_FAILURES;
    const searchResults = await searchAllMarketplaces(item, {
      ...options,
      skipKimi,
    });

    // Track Kimi failures
    const kimiResult = searchResults.find(r => r.source === 'kimi_factory');
    if (kimiResult && (kimiResult.error || kimiResult.products.length === 0)) {
      kimiFailures++;
    }

    // Save results to database
    let itemResultCount = 0;
    for (const result of searchResults) {
      if (result.error) {
        errors.push({ itemId: item.id, source: result.source, error: result.error });
      }

      for (const product of result.products) {
        const { error: insertError } = await supabase
          .from('marketplace_search_results')
          .insert({
            client_request_item_id: item.id,
            source: product.source,
            external_id: product.externalId,
            title: product.title,
            title_zh: product.titleZh || null,
            title_fr: product.titleFr || null,
            description: product.description || null,
            description_zh: product.descriptionZh || null,
            description_fr: product.descriptionFr || null,
            price_min: product.priceMin,
            price_max: product.priceMax,
            currency: product.currency,
            moq: product.moq || null,
            image_url: product.imageUrl || null,
            main_image_url: product.mainImageUrl || null,
            extra_images: product.extraImages || [],
            product_url: product.productUrl || null,
            supplier_name: product.supplierName || null,
            supplier_location: product.supplierLocation || null,
            supplier_rating: product.supplierRating || null,
            supplier_years: product.supplierYears || null,
            supplier_verified: product.supplierVerified || false,
            supplier_contact: product.supplierContact || {},
            weight: product.weight || null,
            volume: product.volume || null,
            dimensions: product.dimensions || null,
            raw_data: product.rawData || {},
          });

        if (insertError) {
          console.error('[Aggregator] Failed to save result:', insertError);
        } else {
          itemResultCount++;
        }
      }
    }

    totalResults += itemResultCount;

    // Update item status
    await supabase
      .from('client_request_items')
      .update({
        status: itemResultCount > 0 ? 'results_available' : 'no_results',
      })
      .eq('id', item.id);

    // Rate limiting between items
    if (i < items.length - 1) {
      await delay(RATE_LIMIT_BETWEEN_ITEMS);
    }
  }

  // Update request status
  await supabase
    .from('client_requests')
    .update({ status: 'search_complete' })
    .eq('id', clientRequestId);

  console.log(`[Aggregator] Search complete: ${totalResults} total results, ${errors.length} errors`);

  return { totalResults, errors };
}

// ============================================================================
// Translate Results
// ============================================================================

/**
 * Retraduit tous les résultats d'une requête (utile si la traduction initiale a échoué)
 */
export async function retranslateResults(clientRequestId: string): Promise<number> {
  const supabase = getServiceClient();

  const { data: results } = await supabase
    .from('marketplace_search_results')
    .select('id, title, title_zh, title_fr, supplier_name, client_request_item_id')
    .eq('client_request_item_id', clientRequestId);

  if (!results || results.length === 0) return 0;

  let translated = 0;
  for (const result of results) {
    if (result.title_zh && !result.title_fr) {
      try {
        const titleFr = await translateChineseToFrench(result.title_zh);
        await supabase
          .from('marketplace_search_results')
          .update({ title_fr: titleFr })
          .eq('id', result.id);
        translated++;
      } catch {
        // Skip on error
      }
    }
  }

  return translated;
}
