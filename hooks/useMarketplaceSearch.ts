'use client';

import { useState, useCallback, useRef } from 'react';
import type { MarketplaceSource, SearchProgress } from '@/lib/types/marketplace';

interface UseMarketplaceSearchState {
  isSearching: boolean;
  progress: SearchProgress;
  totalResults: number;
  errors: Array<{ itemId: string; source: string; error: string }>;
}

interface UseMarketplaceSearchActions {
  startSearch: (
    requestId: string,
    options?: {
      sources?: MarketplaceSource[];
      maxResultsPerSource?: number;
    }
  ) => Promise<{ totalResults: number; errors: any[] } | null>;
  cancelSearch: () => void;
}

export function useMarketplaceSearch(): UseMarketplaceSearchState & UseMarketplaceSearchActions {
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState<SearchProgress>({
    totalItems: 0,
    completedItems: 0,
    errors: [],
    startedAt: new Date(),
    status: 'idle',
  });
  const [totalResults, setTotalResults] = useState(0);
  const [errors, setErrors] = useState<Array<{ itemId: string; source: string; error: string }>>([]);
  const abortRef = useRef<AbortController | null>(null);

  const startSearch = useCallback(async (
    requestId: string,
    options?: {
      sources?: MarketplaceSource[];
      maxResultsPerSource?: number;
    }
  ) => {
    setIsSearching(true);
    setErrors([]);
    setTotalResults(0);
    setProgress({
      totalItems: 0,
      completedItems: 0,
      errors: [],
      startedAt: new Date(),
      status: 'searching',
    });

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/admin/client-requests/${requestId}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
        signal: abortRef.current.signal,
      });

      const json = await res.json();

      if (!res.ok) {
        setErrors([{ itemId: '', source: '', error: json.error }]);
        setProgress(prev => ({ ...prev, status: 'error' }));
        return null;
      }

      setTotalResults(json.totalResults || 0);
      setErrors(json.errors || []);
      setProgress(prev => ({
        ...prev,
        completedItems: prev.totalItems,
        status: 'completed',
      }));

      return {
        totalResults: json.totalResults || 0,
        errors: json.errors || [],
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setProgress(prev => ({ ...prev, status: 'idle' }));
        return null;
      }
      setErrors([{ itemId: '', source: '', error: err.message }]);
      setProgress(prev => ({ ...prev, status: 'error' }));
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const cancelSearch = useCallback(() => {
    abortRef.current?.abort();
    setIsSearching(false);
    setProgress(prev => ({ ...prev, status: 'idle' }));
  }, []);

  return {
    isSearching,
    progress,
    totalResults,
    errors,
    startSearch,
    cancelSearch,
  };
}
