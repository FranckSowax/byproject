/**
 * Tests unitaires pour le cache de traductions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  generateCacheKey,
  getCachedTranslation,
  setCachedTranslation,
  invalidateCachedTranslation,
  getCacheStats,
  cleanupExpiredEntries,
  getCachedTranslationsBatch,
  setCachedTranslationsBatch,
} from '@/lib/cache/translation-cache';

// Mock fetch for Redis tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Translation Cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.UPSTASH_REDIS_REST_URL = '';
    process.env.UPSTASH_REDIS_REST_TOKEN = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCacheKey', () => {
    it('should generate consistent keys for same inputs', () => {
      const key1 = generateCacheKey('Ciment Portland', 'fr', 'en');
      const key2 = generateCacheKey('Ciment Portland', 'fr', 'en');
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different texts', () => {
      const key1 = generateCacheKey('Ciment Portland', 'fr', 'en');
      const key2 = generateCacheKey('Sable fin', 'fr', 'en');
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different language pairs', () => {
      const key1 = generateCacheKey('Ciment', 'fr', 'en');
      const key2 = generateCacheKey('Ciment', 'fr', 'zh');
      expect(key1).not.toBe(key2);
    });

    it('should include translation prefix', () => {
      const key = generateCacheKey('Test', 'fr', 'en');
      expect(key).toMatch(/^translation:/);
    });

    it('should include source and target languages', () => {
      const key = generateCacheKey('Test', 'fr', 'en');
      expect(key).toContain('fr:en');
    });

    it('should handle empty strings', () => {
      const key = generateCacheKey('', 'fr', 'en');
      expect(key).toMatch(/^translation:fr:en:/);
    });

    it('should handle special characters', () => {
      const key = generateCacheKey('Béton armé 50m²', 'fr', 'en');
      expect(key).toBeTruthy();
      expect(typeof key).toBe('string');
    });

    it('should handle very long texts', () => {
      const longText = 'a'.repeat(10000);
      const key = generateCacheKey(longText, 'fr', 'en');
      // Key should be reasonably sized due to hashing
      expect(key.length).toBeLessThan(100);
    });
  });

  describe('Memory Cache Operations (no Redis)', () => {
    describe('setCachedTranslation and getCachedTranslation', () => {
      it('should store and retrieve translations', async () => {
        await setCachedTranslation('Ciment', 'fr', 'en', 'Cement');
        const result = await getCachedTranslation('Ciment', 'fr', 'en');
        expect(result).toBe('Cement');
      });

      it('should return null for non-existent translations', async () => {
        const result = await getCachedTranslation('NonExistent', 'fr', 'en');
        expect(result).toBeNull();
      });

      it('should handle different language pairs independently', async () => {
        await setCachedTranslation('Ciment', 'fr', 'en', 'Cement');
        await setCachedTranslation('Ciment', 'fr', 'zh', '水泥');

        const enResult = await getCachedTranslation('Ciment', 'fr', 'en');
        const zhResult = await getCachedTranslation('Ciment', 'fr', 'zh');

        expect(enResult).toBe('Cement');
        expect(zhResult).toBe('水泥');
      });

      it('should overwrite existing translations', async () => {
        await setCachedTranslation('Test', 'fr', 'en', 'First');
        await setCachedTranslation('Test', 'fr', 'en', 'Second');

        const result = await getCachedTranslation('Test', 'fr', 'en');
        expect(result).toBe('Second');
      });

      it('should handle empty translations', async () => {
        await setCachedTranslation('Test', 'fr', 'en', '');
        const result = await getCachedTranslation('Test', 'fr', 'en');
        expect(result).toBe('');
      });
    });

    describe('invalidateCachedTranslation', () => {
      it('should remove cached translations', async () => {
        await setCachedTranslation('ToDelete', 'fr', 'en', 'Deleted');
        await invalidateCachedTranslation('ToDelete', 'fr', 'en');

        const result = await getCachedTranslation('ToDelete', 'fr', 'en');
        expect(result).toBeNull();
      });

      it('should not affect other translations', async () => {
        await setCachedTranslation('Keep', 'fr', 'en', 'Kept');
        await setCachedTranslation('Delete', 'fr', 'en', 'Deleted');
        await invalidateCachedTranslation('Delete', 'fr', 'en');

        const keptResult = await getCachedTranslation('Keep', 'fr', 'en');
        expect(keptResult).toBe('Kept');
      });

      it('should handle non-existent keys gracefully', async () => {
        // Should not throw
        await expect(
          invalidateCachedTranslation('NonExistent', 'fr', 'en')
        ).resolves.toBeUndefined();
      });
    });

    describe('Expiration', () => {
      it('should expire entries after TTL', async () => {
        // Use very short TTL
        await setCachedTranslation('Expiring', 'fr', 'en', 'Will Expire', 1);

        // Should exist immediately
        let result = await getCachedTranslation('Expiring', 'fr', 'en');
        expect(result).toBe('Will Expire');

        // Wait for expiration
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Should be expired now
        result = await getCachedTranslation('Expiring', 'fr', 'en');
        expect(result).toBeNull();
      });
    });

    describe('cleanupExpiredEntries', () => {
      it('should remove expired entries', async () => {
        // Add entries with very short TTL
        await setCachedTranslation('Expire1', 'fr', 'en', 'E1', 1);
        await setCachedTranslation('Expire2', 'fr', 'en', 'E2', 1);
        await setCachedTranslation('Keep', 'fr', 'en', 'K', 60000);

        // Wait for short TTL entries to expire
        await new Promise((resolve) => setTimeout(resolve, 10));

        const cleaned = cleanupExpiredEntries();
        expect(cleaned).toBeGreaterThanOrEqual(2);

        // Keep should still exist
        const kept = await getCachedTranslation('Keep', 'fr', 'en');
        expect(kept).toBe('K');
      });

      it('should return count of cleaned entries', async () => {
        // Add expired entries
        await setCachedTranslation('A', 'fr', 'en', 'a', 1);
        await setCachedTranslation('B', 'fr', 'en', 'b', 1);

        await new Promise((resolve) => setTimeout(resolve, 10));

        const cleaned = cleanupExpiredEntries();
        expect(typeof cleaned).toBe('number');
        expect(cleaned).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getCacheStats', () => {
    it('should return stats object', () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty('memorySize');
      expect(stats).toHaveProperty('storageType');
      expect(stats).toHaveProperty('isRedisConfigured');
    });

    it('should report correct storage type without Redis', () => {
      const stats = getCacheStats();
      expect(stats.storageType).toBe('memory');
      expect(stats.isRedisConfigured).toBe(false);
    });

    it('should report memory size', async () => {
      const initialStats = getCacheStats();
      await setCachedTranslation('Stats1', 'fr', 'en', 'S1');
      await setCachedTranslation('Stats2', 'fr', 'en', 'S2');

      const newStats = getCacheStats();
      expect(newStats.memorySize).toBeGreaterThanOrEqual(initialStats.memorySize);
    });
  });

  describe('Batch Operations', () => {
    describe('getCachedTranslationsBatch', () => {
      it('should retrieve multiple translations', async () => {
        await setCachedTranslation('Batch1', 'fr', 'en', 'B1');
        await setCachedTranslation('Batch2', 'fr', 'en', 'B2');

        const results = await getCachedTranslationsBatch([
          { text: 'Batch1', sourceLanguage: 'fr', targetLanguage: 'en' },
          { text: 'Batch2', sourceLanguage: 'fr', targetLanguage: 'en' },
          { text: 'NonExistent', sourceLanguage: 'fr', targetLanguage: 'en' },
        ]);

        expect(results.size).toBe(3);
        // Find the cached values
        const values = Array.from(results.values());
        expect(values).toContain('B1');
        expect(values).toContain('B2');
        expect(values).toContain(null);
      });

      it('should handle empty batch', async () => {
        const results = await getCachedTranslationsBatch([]);
        expect(results.size).toBe(0);
      });
    });

    describe('setCachedTranslationsBatch', () => {
      it('should store multiple translations', async () => {
        await setCachedTranslationsBatch([
          { text: 'SetBatch1', sourceLanguage: 'fr', targetLanguage: 'en', translation: 'SB1' },
          { text: 'SetBatch2', sourceLanguage: 'fr', targetLanguage: 'en', translation: 'SB2' },
        ]);

        const result1 = await getCachedTranslation('SetBatch1', 'fr', 'en');
        const result2 = await getCachedTranslation('SetBatch2', 'fr', 'en');

        expect(result1).toBe('SB1');
        expect(result2).toBe('SB2');
      });

      it('should handle empty batch', async () => {
        await expect(setCachedTranslationsBatch([])).resolves.toBeUndefined();
      });
    });
  });

  describe('Hash Function', () => {
    it('should produce consistent hashes', () => {
      const key1 = generateCacheKey('Same Text', 'fr', 'en');
      const key2 = generateCacheKey('Same Text', 'fr', 'en');
      expect(key1).toBe(key2);
    });

    it('should produce different hashes for different inputs', () => {
      const key1 = generateCacheKey('Text A', 'fr', 'en');
      const key2 = generateCacheKey('Text B', 'fr', 'en');
      expect(key1).not.toBe(key2);
    });

    it('should handle unicode characters', () => {
      const key = generateCacheKey('Béton armé avec écrous', 'fr', 'en');
      expect(key).toBeTruthy();
      expect(key.length).toBeGreaterThan(0);
    });

    it('should handle Chinese characters', () => {
      const key = generateCacheKey('水泥砂浆', 'zh', 'en');
      expect(key).toBeTruthy();
    });
  });
});
