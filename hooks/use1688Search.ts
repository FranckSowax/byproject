'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Product1688,
  SearchResult1688,
  ProductListSearchResult,
  Search1688Options,
} from '@/lib/types/1688';

interface Use1688SearchState {
  isLoading: boolean;
  progress: {
    completed: number;
    total: number;
    currentProduct: string;
    percentage: number;
  };
  results: ProductListSearchResult | null;
  singleResult: SearchResult1688 | null;
  error: string | null;
  jobId: string | null;
  jobStatus: 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

interface Use1688SearchActions {
  searchProducts: (products: string[], options?: Search1688Options) => Promise<ProductListSearchResult | null>;
  searchProjectProducts: (projectId: string, options?: Search1688Options) => Promise<ProductListSearchResult | null>;
  startBackgroundSearch: (projectId: string, options?: Search1688Options) => Promise<string | null>;
  searchSingle: (keyword: string, maxResults?: number) => Promise<SearchResult1688 | null>;
  clearResults: () => void;
  cancelSearch: () => void;
  checkJobStatus: (jobId: string) => Promise<void>;
}

// Cache des résultats de recherche
const searchCache = new Map<string, SearchResult1688>();

export function use1688Search(): Use1688SearchState & Use1688SearchActions {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({
    completed: 0,
    total: 0,
    currentProduct: '',
    percentage: 0,
  });
  const [results, setResults] = useState<ProductListSearchResult | null>(null);
  const [singleResult, setSingleResult] = useState<SearchResult1688 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'>('idle');

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  /**
   * Check job status and update state
   */
  const checkJobStatus = useCallback(async (checkJobId: string) => {
    try {
      const response = await fetch(`/api/1688/jobs/${checkJobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error checking job status');
      }

      const job = data.job;
      setJobStatus(job.status);
      setProgress({
        completed: job.completedTerms || 0,
        total: job.totalTerms || 0,
        currentProduct: job.currentTerm || '',
        percentage: job.progress || 0,
      });

      if (job.status === 'completed' && job.results) {
        // Convert results to ProductListSearchResult format
        const finalResult: ProductListSearchResult = {
          totalProducts: job.totalTerms,
          completedSearches: job.completedTerms - job.failedTerms,
          failedSearches: job.failedTerms,
          results: job.results.map((r: any) => ({
            ...r,
            searchedAt: new Date(r.searchedAt),
          })),
          startedAt: new Date(job.startedAt),
          completedAt: new Date(job.completedAt),
        };
        setResults(finalResult);
        setIsLoading(false);

        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else if (job.status === 'failed' || job.status === 'cancelled') {
        setError(job.errorMessage || `Job ${job.status}`);
        setIsLoading(false);

        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err: any) {
      console.error('Error checking job status:', err);
    }
  }, []);

  /**
   * Start a background search job (recommended for many products)
   */
  const startBackgroundSearch = useCallback(async (
    projectId: string,
    options: Search1688Options = {}
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    setJobStatus('pending');
    setProgress({
      completed: 0,
      total: 0,
      currentProduct: 'Création du job...',
      percentage: 0,
    });

    try {
      const response = await fetch('/api/1688/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, options }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creating job');
      }

      const newJobId = data.job.id;
      setJobId(newJobId);
      setProgress({
        completed: 0,
        total: data.job.totalTerms,
        currentProduct: 'Job créé, recherche en cours...',
        percentage: 0,
      });

      // Start polling for job status
      pollingIntervalRef.current = setInterval(() => {
        checkJobStatus(newJobId);
      }, 3000); // Poll every 3 seconds

      return newJobId;
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      setIsLoading(false);
      setJobStatus('failed');
      return null;
    }
  }, [checkJobStatus]);

  /**
   * Recherche une liste de produits un par un (évite les timeouts)
   * Use this for small lists (<5 products)
   */
  const searchProducts = useCallback(async (
    products: string[],
    options: Search1688Options = {}
  ): Promise<ProductListSearchResult | null> => {
    setIsLoading(true);
    setError(null);
    setJobStatus('running');

    const startedAt = new Date();
    const searchResults: SearchResult1688[] = [];
    let failedSearches = 0;
    let cancelled = false;

    abortControllerRef.current = new AbortController();

    setProgress({
      completed: 0,
      total: products.length,
      currentProduct: products[0] || '',
      percentage: 0,
    });

    try {
      for (let i = 0; i < products.length; i++) {
        if (abortControllerRef.current.signal.aborted) {
          cancelled = true;
          break;
        }

        const product = products[i];

        setProgress({
          completed: i,
          total: products.length,
          currentProduct: product,
          percentage: Math.round((i / products.length) * 100),
        });

        try {
          const response = await fetch(
            `/api/1688/search?q=${encodeURIComponent(product)}&maxResults=${options.maxResults || 5}`,
            { signal: abortControllerRef.current.signal }
          );

          const data = await response.json();

          if (response.ok) {
            const result: SearchResult1688 = {
              searchQuery: product,
              searchQueryChinese: data.searchQueryChinese,
              results: data.results || [],
              searchedAt: new Date(data.searchedAt || Date.now()),
              totalFound: data.totalFound || 0,
            };
            searchResults.push(result);

            const cacheKey = product.toLowerCase();
            searchCache.set(cacheKey, result);
          } else {
            failedSearches++;
            searchResults.push({
              searchQuery: product,
              results: [],
              searchedAt: new Date(),
              totalFound: 0,
            });
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            cancelled = true;
            break;
          }
          failedSearches++;
          searchResults.push({
            searchQuery: product,
            results: [],
            searchedAt: new Date(),
            totalFound: 0,
          });
        }

        if (i < products.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (cancelled) {
        setError('Recherche annulée');
        setJobStatus('cancelled');
        return null;
      }

      const finalResult: ProductListSearchResult = {
        totalProducts: products.length,
        completedSearches: products.length - failedSearches,
        failedSearches,
        results: searchResults,
        startedAt,
        completedAt: new Date(),
      };

      setResults(finalResult);
      setJobStatus('completed');
      setProgress({
        completed: products.length,
        total: products.length,
        currentProduct: 'Terminé',
        percentage: 100,
      });

      return finalResult;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Recherche annulée');
        setJobStatus('cancelled');
        return null;
      }
      setError(err.message || 'Erreur inconnue');
      setJobStatus('failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Recherche les produits d'un projet
   * Automatically uses background job for >5 products
   */
  const searchProjectProducts = useCallback(async (
    projectId: string,
    options: Search1688Options = {}
  ): Promise<ProductListSearchResult | null> => {
    setIsLoading(true);
    setError(null);
    setProgress({
      completed: 0,
      total: 0,
      currentProduct: 'Chargement des matériaux...',
      percentage: 0,
    });

    abortControllerRef.current = new AbortController();

    try {
      // 1. Fetch materials first
      const materialsResponse = await fetch(`/api/projects/${projectId}/materials`, {
        signal: abortControllerRef.current.signal,
      });

      if (!materialsResponse.ok) {
        throw new Error('Erreur lors de la récupération des matériaux');
      }

      const { data: materials } = await materialsResponse.json();

      if (!materials || materials.length === 0) {
        setError('Aucun matériau trouvé pour ce projet');
        setIsLoading(false);
        return null;
      }

      // 2. For more than 5 products, use background job
      if (materials.length > 5) {
        console.log(`[1688] ${materials.length} materials, using background job`);
        setIsLoading(false);
        await startBackgroundSearch(projectId, options);
        return null; // Results will come via polling
      }

      // 3. For small lists, search directly
      const searchTerms = materials.map((m: any) => {
        if (m.description) {
          return `${m.name} ${m.description}`.trim();
        }
        return m.name;
      });

      setIsLoading(false);
      return await searchProducts(searchTerms, options);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Recherche annulée');
        return null;
      }
      setError(err.message || 'Erreur inconnue');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [searchProducts, startBackgroundSearch]);

  /**
   * Recherche un seul produit (par mot-clé ou par image)
   */
  const searchSingle = useCallback(async (
    keyword: string,
    maxResults: number = 5,
    imageUrl?: string
  ): Promise<SearchResult1688 | null> => {
    const cacheKey = imageUrl ? `img:${imageUrl.substring(0, 50)}` : keyword.toLowerCase();
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey)!;
      setSingleResult(cached);
      return cached;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construire l'URL avec priorité sur la recherche par image
      let url = `/api/1688/search?maxResults=${maxResults}`;
      if (imageUrl) {
        url += `&imageUrl=${encodeURIComponent(imageUrl)}`;
      }
      if (keyword) {
        url += `&q=${encodeURIComponent(keyword)}`;
      }

      const response = await fetch(url);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la recherche');
      }

      searchCache.set(cacheKey, data);
      setSingleResult(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Effacer les résultats
   */
  const clearResults = useCallback(() => {
    setResults(null);
    setSingleResult(null);
    setError(null);
    setJobId(null);
    setJobStatus('idle');
    setProgress({
      completed: 0,
      total: 0,
      currentProduct: '',
      percentage: 0,
    });
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Annuler la recherche en cours
   */
  const cancelSearch = useCallback(async () => {
    // Cancel client-side search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Cancel background job if exists
    if (jobId && (jobStatus === 'pending' || jobStatus === 'running')) {
      try {
        await fetch(`/api/1688/jobs/${jobId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Error cancelling job:', err);
      }
    }

    // Stop polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setJobStatus('cancelled');
  }, [jobId, jobStatus]);

  return {
    isLoading,
    progress,
    results,
    singleResult,
    error,
    jobId,
    jobStatus,
    searchProducts,
    searchProjectProducts,
    startBackgroundSearch,
    searchSingle,
    clearResults,
    cancelSearch,
    checkJobStatus,
  };
}

/**
 * Hook pour filtrer les résultats 1688
 */
export function use1688Filters(products: Product1688[]) {
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: Infinity,
    minMOQ: 0,
    maxMOQ: Infinity,
    minRating: 0,
    searchText: '',
  });

  const filteredProducts = products.filter(product => {
    if (product.price.min < filters.minPrice) return false;
    if (product.price.max > filters.maxPrice && filters.maxPrice !== Infinity) return false;
    if (product.moq < filters.minMOQ) return false;
    if (product.moq > filters.maxMOQ && filters.maxMOQ !== Infinity) return false;
    if ((product.supplier.rating || 0) < filters.minRating) return false;

    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      const inTitle = product.title.toLowerCase().includes(search);
      const inSupplier = product.supplier.name.toLowerCase().includes(search);
      if (!inTitle && !inSupplier) return false;
    }

    return true;
  });

  return {
    filters,
    setFilters,
    filteredProducts,
  };
}
