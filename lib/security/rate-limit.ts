/**
 * Rate Limiting pour protéger l'API contre les abus
 * Utilise une stratégie de sliding window avec Redis (ou Map en mémoire pour dev)
 */

interface RateLimitConfig {
  windowMs: number; // Fenêtre de temps en millisecondes
  maxRequests: number; // Nombre maximum de requêtes dans la fenêtre
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Stockage en mémoire (à remplacer par Redis en production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Configurations de rate limiting par endpoint
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentification - très restrictif
  'auth:login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 tentatives max
  },
  'auth:signup': {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 3, // 3 inscriptions max par heure
  },
  'auth:reset-password': {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 3, // 3 demandes max par heure
  },
  
  // API générale - modéré
  'api:general': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requêtes par minute
  },
  
  // Upload de fichiers - restrictif
  'api:upload': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads par minute
  },
  
  // Export - restrictif
  'api:export': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 exports par minute
  },
  
  // Création de ressources - modéré
  'api:create': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 créations par minute
  },
};

/**
 * Nettoie les entrées expirées du store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Nettoyage périodique toutes les 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Vérifie si une requête est autorisée selon le rate limit
 * @param identifier - Identifiant unique (IP, user ID, etc.)
 * @param limitType - Type de limite à appliquer
 * @returns Object avec allowed (boolean) et informations de limite
 */
export function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS = 'api:general'
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const config = RATE_LIMITS[limitType];
  if (!config) {
    throw new Error(`Unknown rate limit type: ${limitType}`);
  }

  const key = `${limitType}:${identifier}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Première requête ou fenêtre expirée
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Fenêtre en cours
  if (entry.count < config.maxRequests) {
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // Limite atteinte
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
    retryAfter: Math.ceil((entry.resetTime - now) / 1000), // en secondes
  };
}

/**
 * Réinitialise le compteur pour un identifiant
 * Utile pour les tests ou après une action admin
 */
export function resetRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
): void {
  const key = `${limitType}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Obtient l'identifiant de la requête (IP ou user ID)
 * @param request - Request object
 * @param userId - ID utilisateur optionnel
 * @returns Identifiant unique
 */
export function getRequestIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Essayer d'obtenir l'IP depuis les headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }
  
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback sur un identifiant générique (pas idéal)
  return 'ip:unknown';
}

/**
 * Middleware Next.js pour le rate limiting
 * Utilisation dans les API routes
 */
export async function rateLimitMiddleware(
  request: Request,
  limitType: keyof typeof RATE_LIMITS = 'api:general',
  userId?: string
): Promise<Response | null> {
  const identifier = getRequestIdentifier(request, userId);
  const result = checkRateLimit(identifier, limitType);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': result.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': RATE_LIMITS[limitType].maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        },
      }
    );
  }

  // Requête autorisée - retourner null pour continuer
  return null;
}

/**
 * Hook React pour vérifier le rate limit côté client
 * Utile pour désactiver les boutons avant d'atteindre la limite
 */
export function useRateLimit(limitType: keyof typeof RATE_LIMITS) {
  const config = RATE_LIMITS[limitType];
  
  return {
    maxRequests: config.maxRequests,
    windowMs: config.windowMs,
    windowMinutes: Math.floor(config.windowMs / 60000),
  };
}

/**
 * Statistiques de rate limiting (pour monitoring)
 */
export function getRateLimitStats(): {
  totalKeys: number;
  keysByType: Record<string, number>;
} {
  const stats = {
    totalKeys: rateLimitStore.size,
    keysByType: {} as Record<string, number>,
  };

  for (const key of rateLimitStore.keys()) {
    const type = key.split(':')[0];
    stats.keysByType[type] = (stats.keysByType[type] || 0) + 1;
  }

  return stats;
}
