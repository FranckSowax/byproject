'use client';

import { useState, useCallback, useRef } from 'react';
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
}

interface Use1688SearchActions {
  searchProducts: (products: string[], options?: Search1688Options) => Promise<ProductListSearchResult | null>;
  searchProjectProducts: (projectId: string, options?: Search1688Options) => Promise<ProductListSearchResult | null>;
  searchSingle: (keyword: string, maxResults?: number) => Promise<SearchResult1688 | null>;
  clearResults: () => void;
  cancelSearch: () => void;
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

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Recherche une liste de produits un par un (évite les timeouts)
   */
  const searchProducts = useCallback(async (
    products: string[],
    options: Search1688Options = {}
  ): Promise<ProductListSearchResult | null> => {
    setIsLoading(true);
    setError(null);

    const startedAt = new Date();
    const searchResults: SearchResult1688[] = [];
    let failedSearches = 0;
    let cancelled = false;

    // Créer un nouveau AbortController
    abortControllerRef.current = new AbortController();

    setProgress({
      completed: 0,
      total: products.length,
      currentProduct: products[0] || '',
      percentage: 0,
    });

    try {
      // Rechercher chaque produit individuellement via GET
      for (let i = 0; i < products.length; i++) {
        // Vérifier si annulé
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
            `/api/1688/search?q=${encodeURIComponent(product)}&maxResults=${options.maxResults || 10}`,
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

            // Mettre en cache
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

        // Petit délai entre les requêtes pour ne pas surcharger
        if (i < products.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (cancelled) {
        setError('Recherche annulée');
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
        return null;
      }
      setError(err.message || 'Erreur inconnue');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Recherche les produits d'un projet (récupère d'abord les matériaux puis cherche un par un)
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
      // 1. Récupérer les matériaux du projet
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

      // 2. Construire la liste des termes de recherche
      const searchTerms = materials.map((m: any) => {
        if (m.description) {
          return `${m.name} ${m.description}`.trim();
        }
        return m.name;
      });

      // 3. Utiliser searchProducts pour chercher un par un
      setIsLoading(false); // searchProducts va le remettre à true
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
  }, [searchProducts]);

  /**
   * Recherche un seul produit
   */
  const searchSingle = useCallback(async (
    keyword: string,
    maxResults: number = 10
  ): Promise<SearchResult1688 | null> => {
    // Vérifier le cache
    const cacheKey = keyword.toLowerCase();
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey)!;
      setSingleResult(cached);
      return cached;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/1688/search?q=${encodeURIComponent(keyword)}&maxResults=${maxResults}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la recherche');
      }

      // Mettre en cache
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
    setProgress({
      completed: 0,
      total: 0,
      currentProduct: '',
      percentage: 0,
    });
  }, []);

  /**
   * Annuler la recherche en cours
   */
  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    isLoading,
    progress,
    results,
    singleResult,
    error,
    searchProducts,
    searchProjectProducts,
    searchSingle,
    clearResults,
    cancelSearch,
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
    // Filtre par prix
    if (product.price.min < filters.minPrice) return false;
    if (product.price.max > filters.maxPrice && filters.maxPrice !== Infinity) return false;

    // Filtre par MOQ
    if (product.moq < filters.minMOQ) return false;
    if (product.moq > filters.maxMOQ && filters.maxMOQ !== Infinity) return false;

    // Filtre par rating
    if ((product.supplier.rating || 0) < filters.minRating) return false;

    // Filtre par texte
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
