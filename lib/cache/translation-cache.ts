/**
 * Cache pour les traductions
 * Utilise Redis (Upstash) en production et Map en mémoire pour le développement
 * Évite les appels API répétés pour les mêmes textes
 */

// Configuration Redis (Upstash)
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const isRedisConfigured = !!(UPSTASH_REDIS_URL && UPSTASH_REDIS_TOKEN);

// Cache en mémoire (fallback)
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

// Durée de vie du cache (24 heures par défaut)
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

// Préfixe pour les clés de cache
const CACHE_PREFIX = 'translation:';

/**
 * Génère une clé de cache unique basée sur le texte et les langues
 */
export function generateCacheKey(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): string {
  // Créer un hash simple du texte pour éviter les clés trop longues
  const textHash = simpleHash(text);
  return `${CACHE_PREFIX}${sourceLanguage}:${targetLanguage}:${textHash}`;
}

/**
 * Hash simple pour créer des clés de cache plus courtes
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Récupère une traduction depuis le cache
 */
export async function getCachedTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string | null> {
  const key = generateCacheKey(text, sourceLanguage, targetLanguage);

  // Essayer Redis d'abord
  if (isRedisConfigured) {
    const result = await redisGet(key);
    if (result) return result;
  }

  // Fallback sur le cache mémoire
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // Nettoyer si expiré
  if (cached) {
    memoryCache.delete(key);
  }

  return null;
}

/**
 * Stocke une traduction dans le cache
 */
export async function setCachedTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  translation: string,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<void> {
  const key = generateCacheKey(text, sourceLanguage, targetLanguage);

  // Stocker dans Redis si configuré
  if (isRedisConfigured) {
    await redisSet(key, translation, ttlMs);
  }

  // Toujours stocker en mémoire aussi (pour les lectures rapides)
  memoryCache.set(key, {
    value: translation,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Invalide une traduction dans le cache
 */
export async function invalidateCachedTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<void> {
  const key = generateCacheKey(text, sourceLanguage, targetLanguage);

  if (isRedisConfigured) {
    await redisDelete(key);
  }

  memoryCache.delete(key);
}

/**
 * Récupère plusieurs traductions en batch
 */
export async function getCachedTranslationsBatch(
  items: Array<{ text: string; sourceLanguage: string; targetLanguage: string }>
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  // Pour l'instant, on fait des appels séquentiels
  // TODO: Optimiser avec MGET Redis si nécessaire
  for (const item of items) {
    const key = generateCacheKey(item.text, item.sourceLanguage, item.targetLanguage);
    const cached = await getCachedTranslation(item.text, item.sourceLanguage, item.targetLanguage);
    results.set(key, cached);
  }

  return results;
}

/**
 * Stocke plusieurs traductions en batch
 */
export async function setCachedTranslationsBatch(
  items: Array<{
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    translation: string;
  }>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<void> {
  // Pour l'instant, on fait des appels séquentiels
  // TODO: Optimiser avec pipeline Redis si nécessaire
  for (const item of items) {
    await setCachedTranslation(
      item.text,
      item.sourceLanguage,
      item.targetLanguage,
      item.translation,
      ttlMs
    );
  }
}

/**
 * Statistiques du cache
 */
export function getCacheStats(): {
  memorySize: number;
  storageType: 'redis' | 'memory';
  isRedisConfigured: boolean;
} {
  return {
    memorySize: memoryCache.size,
    storageType: isRedisConfigured ? 'redis' : 'memory',
    isRedisConfigured,
  };
}

/**
 * Nettoie les entrées expirées du cache mémoire
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

// Nettoyage périodique (toutes les 10 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredEntries();
  }, 10 * 60 * 1000);
}

// =============================================================================
// FONCTIONS REDIS (Upstash REST API)
// =============================================================================

async function redisGet(key: string): Promise<string | null> {
  if (!isRedisConfigured) return null;

  try {
    const response = await fetch(`${UPSTASH_REDIS_URL}/get/${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error('Redis GET error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.result || null;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

async function redisSet(key: string, value: string, ttlMs: number): Promise<boolean> {
  if (!isRedisConfigured) return false;

  try {
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    const response = await fetch(
      `${UPSTASH_REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}/ex/${ttlSeconds}`,
      {
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Redis SET error:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
}

async function redisDelete(key: string): Promise<boolean> {
  if (!isRedisConfigured) return false;

  try {
    const response = await fetch(`${UPSTASH_REDIS_URL}/del/${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_TOKEN}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Redis DELETE error:', error);
    return false;
  }
}
