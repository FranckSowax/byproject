/**
 * Tests unitaires pour le cache des taux de change
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock fetch for Redis tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Import after mocks are set up
import {
  getExchangeRates,
  getExchangeRate,
  convertToFCFA,
  invalidateCache,
  refreshRates,
  getCacheStats,
  isCacheValid,
  FALLBACK_RATES,
} from '@/lib/cache/exchange-rates-cache';

describe('Exchange Rates Cache', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.clear();
    // Reset environment variables (no Supabase = use fallback)
    process.env.UPSTASH_REDIS_REST_URL = '';
    process.env.UPSTASH_REDIS_REST_TOKEN = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    // Invalidate any existing cache
    await invalidateCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('FALLBACK_RATES', () => {
    it('should have FCFA rate of 1', () => {
      expect(FALLBACK_RATES['FCFA']).toBe(1);
    });

    it('should include common currencies', () => {
      expect(FALLBACK_RATES).toHaveProperty('USD');
      expect(FALLBACK_RATES).toHaveProperty('EUR');
      expect(FALLBACK_RATES).toHaveProperty('CNY');
      expect(FALLBACK_RATES).toHaveProperty('GBP');
    });

    it('should have positive rates for all currencies', () => {
      Object.values(FALLBACK_RATES).forEach(rate => {
        expect(rate).toBeGreaterThan(0);
      });
    });
  });

  describe('getExchangeRate', () => {
    it('should return 1 for FCFA', async () => {
      const rate = await getExchangeRate('FCFA');
      expect(rate).toBe(1);
    });

    it('should return fallback rate for USD when Supabase not configured', async () => {
      const rate = await getExchangeRate('USD');
      expect(rate).toBe(FALLBACK_RATES['USD']);
    });

    it('should return 1 for unknown currency', async () => {
      const rate = await getExchangeRate('UNKNOWN');
      expect(rate).toBe(1);
    });
  });

  describe('getExchangeRates', () => {
    it('should return fallback rates when Supabase not configured', async () => {
      const rates = await getExchangeRates();
      expect(rates['FCFA']).toBe(1);
      expect(rates['USD']).toBe(FALLBACK_RATES['USD']);
    });

    it('should return same rates on subsequent calls (cached)', async () => {
      const rates1 = await getExchangeRates();
      const rates2 = await getExchangeRates();
      expect(rates1).toEqual(rates2);
    });

    it('should be fast on cache hit', async () => {
      // First call populates cache
      await getExchangeRates();

      // Second call should be very fast
      const start = Date.now();
      await getExchangeRates();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('convertToFCFA', () => {
    it('should return same amount for FCFA', async () => {
      const result = await convertToFCFA(1000, 'FCFA');
      expect(result).toBe(1000);
    });

    it('should convert USD using fallback rate', async () => {
      const amount = 100;
      const result = await convertToFCFA(amount, 'USD');
      expect(result).toBe(amount * FALLBACK_RATES['USD']);
    });

    it('should convert EUR using fallback rate', async () => {
      const amount = 50;
      const result = await convertToFCFA(amount, 'EUR');
      expect(result).toBe(amount * FALLBACK_RATES['EUR']);
    });

    it('should handle zero amounts', async () => {
      const result = await convertToFCFA(0, 'USD');
      expect(result).toBe(0);
    });

    it('should handle negative amounts', async () => {
      const result = await convertToFCFA(-100, 'USD');
      expect(result).toBe(-100 * FALLBACK_RATES['USD']);
    });

    it('should handle decimal amounts', async () => {
      const result = await convertToFCFA(10.5, 'FCFA');
      expect(result).toBe(10.5);
    });

    it('should handle large amounts', async () => {
      const largeAmount = 1000000000;
      const result = await convertToFCFA(largeAmount, 'FCFA');
      expect(result).toBe(largeAmount);
    });
  });

  describe('getCacheStats', () => {
    it('should return stats object', () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty('isCached');
      expect(stats).toHaveProperty('cacheAge');
      expect(stats).toHaveProperty('expiresIn');
      expect(stats).toHaveProperty('storageType');
      expect(stats).toHaveProperty('isRedisConfigured');
    });

    it('should report Redis not configured when env vars missing', () => {
      const stats = getCacheStats();
      expect(stats.isRedisConfigured).toBe(false);
    });

    it('should report cache after fetching rates', async () => {
      await getExchangeRates();
      const stats = getCacheStats();
      expect(stats.isCached).toBe(true);
    });
  });

  describe('isCacheValid', () => {
    it('should return false initially after invalidation', () => {
      const valid = isCacheValid();
      expect(valid).toBe(false);
    });

    it('should return true after fetching rates', async () => {
      await getExchangeRates();
      expect(isCacheValid()).toBe(true);
    });
  });

  describe('invalidateCache', () => {
    it('should clear localStorage', async () => {
      await getExchangeRates(); // Populate cache
      await invalidateCache();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });

    it('should not throw when called multiple times', async () => {
      await expect(invalidateCache()).resolves.toBeUndefined();
      await expect(invalidateCache()).resolves.toBeUndefined();
    });

    it('should make cache invalid', async () => {
      await getExchangeRates(); // Populate
      expect(isCacheValid()).toBe(true);
      await invalidateCache();
      expect(isCacheValid()).toBe(false);
    });
  });

  describe('refreshRates', () => {
    it('should return rates after refresh', async () => {
      const rates = await refreshRates();
      expect(rates).toHaveProperty('FCFA');
      expect(rates['FCFA']).toBe(1);
    });

    it('should invalidate and repopulate cache', async () => {
      await getExchangeRates();
      await refreshRates();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      expect(isCacheValid()).toBe(true);
    });
  });

  describe('LocalStorage Integration', () => {
    it('should save to localStorage when fetching', async () => {
      await getExchangeRates();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      // Should not throw, just log warning
      await expect(getExchangeRates()).resolves.toBeTruthy();
    });
  });

  describe('Memory Cache', () => {
    it('should use memory cache for subsequent calls', async () => {
      const rates1 = await getExchangeRates();

      // Clear localStorage mock calls
      localStorageMock.getItem.mockClear();

      const rates2 = await getExchangeRates();

      // Should not need to check localStorage (memory cache hit)
      expect(rates1).toEqual(rates2);
    });
  });
});

describe('Cache Expiration Logic', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.clear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    await invalidateCache();
  });

  it('should check expiration correctly for expired entries', () => {
    // Set up expired cache in localStorage
    const expiredEntry = {
      data: { FCFA: 1, USD: 600 },
      timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      expiresAt: Date.now() - 60 * 60 * 1000, // 1 hour ago (expired)
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(expiredEntry));

    const valid = isCacheValid();
    expect(valid).toBe(false);
  });

  it('should accept valid cached entries', async () => {
    // Populate with fresh data
    await getExchangeRates();

    // Should be valid
    expect(isCacheValid()).toBe(true);
  });
});
