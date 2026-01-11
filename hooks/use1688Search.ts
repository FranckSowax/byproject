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
   * Recherche une liste de produits
   */
  const searchProducts = useCallback(async (
    products: string[],
    options: Search1688Options = {}
  ): Promise<ProductListSearchResult | null> => {
    setIsLoading(true);
    setError(null);
    setProgress({
      completed: 0,
      total: products.length,
      currentProduct: products[0] || '',
      percentage: 0,
    });

    // Créer un nouveau AbortController
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/1688/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products, options }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la recherche');
      }

      // Mettre en cache les résultats individuels
      data.results?.forEach((result: SearchResult1688) => {
        const cacheKey = result.searchQuery.toLowerCase();
        searchCache.set(cacheKey, result);
      });

      setResults(data);
      setProgress({
        completed: products.length,
        total: products.length,
        currentProduct: 'Terminé',
        percentage: 100,
      });

      return data;
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
   * Recherche les produits d'un projet
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
      const response = await fetch('/api/1688/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, options }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la recherche');
      }

      setResults(data);
      setProgress({
        completed: data.totalProducts,
        total: data.totalProducts,
        currentProduct: 'Terminé',
        percentage: 100,
      });

      return data;
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
