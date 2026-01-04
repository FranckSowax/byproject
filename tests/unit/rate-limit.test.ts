import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch for Redis calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
const originalEnv = process.env;

describe('Rate Limit - Configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('RATE_LIMITS configuration', () => {
    it('should have auth:login limit of 5 requests per 15 minutes', async () => {
      const { RATE_LIMITS } = await import('@/lib/security/rate-limit');
      expect(RATE_LIMITS['auth:login']).toEqual({
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
      });
    });

    it('should have auth:signup limit of 3 requests per hour', async () => {
      const { RATE_LIMITS } = await import('@/lib/security/rate-limit');
      expect(RATE_LIMITS['auth:signup']).toEqual({
        windowMs: 60 * 60 * 1000,
        maxRequests: 3,
      });
    });

    it('should have api:general limit of 60 requests per minute', async () => {
      const { RATE_LIMITS } = await import('@/lib/security/rate-limit');
      expect(RATE_LIMITS['api:general']).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 60,
      });
    });

    it('should have api:upload limit of 10 requests per minute', async () => {
      const { RATE_LIMITS } = await import('@/lib/security/rate-limit');
      expect(RATE_LIMITS['api:upload']).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 10,
      });
    });

    it('should have api:translate limit of 20 requests per minute', async () => {
      const { RATE_LIMITS } = await import('@/lib/security/rate-limit');
      expect(RATE_LIMITS['api:translate']).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 20,
      });
    });

    it('should have api:ai limit of 10 requests per minute', async () => {
      const { RATE_LIMITS } = await import('@/lib/security/rate-limit');
      expect(RATE_LIMITS['api:ai']).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 10,
      });
    });
  });
});

describe('Rate Limit - Request Identifier', () => {
  it('should return user identifier when userId is provided', async () => {
    const { getRequestIdentifier } = await import('@/lib/security/rate-limit');
    const mockRequest = new Request('https://example.com', {
      headers: new Headers(),
    });

    const result = getRequestIdentifier(mockRequest, 'user123');
    expect(result).toBe('user:user123');
  });

  it('should extract IP from cf-connecting-ip header (Cloudflare)', async () => {
    const { getRequestIdentifier } = await import('@/lib/security/rate-limit');
    const mockRequest = new Request('https://example.com', {
      headers: new Headers({
        'cf-connecting-ip': '192.168.1.1',
      }),
    });

    const result = getRequestIdentifier(mockRequest);
    expect(result).toBe('ip:192.168.1.1');
  });

  it('should extract IP from x-forwarded-for header', async () => {
    const { getRequestIdentifier } = await import('@/lib/security/rate-limit');
    const mockRequest = new Request('https://example.com', {
      headers: new Headers({
        'x-forwarded-for': '10.0.0.1, 10.0.0.2',
      }),
    });

    const result = getRequestIdentifier(mockRequest);
    expect(result).toBe('ip:10.0.0.1');
  });

  it('should extract IP from x-real-ip header', async () => {
    const { getRequestIdentifier } = await import('@/lib/security/rate-limit');
    const mockRequest = new Request('https://example.com', {
      headers: new Headers({
        'x-real-ip': '172.16.0.1',
      }),
    });

    const result = getRequestIdentifier(mockRequest);
    expect(result).toBe('ip:172.16.0.1');
  });

  it('should return ip:unknown when no IP headers are present', async () => {
    const { getRequestIdentifier } = await import('@/lib/security/rate-limit');
    const mockRequest = new Request('https://example.com', {
      headers: new Headers(),
    });

    const result = getRequestIdentifier(mockRequest);
    expect(result).toBe('ip:unknown');
  });

  it('should prioritize cf-connecting-ip over other headers', async () => {
    const { getRequestIdentifier } = await import('@/lib/security/rate-limit');
    const mockRequest = new Request('https://example.com', {
      headers: new Headers({
        'cf-connecting-ip': '1.1.1.1',
        'x-forwarded-for': '2.2.2.2',
        'x-real-ip': '3.3.3.3',
      }),
    });

    const result = getRequestIdentifier(mockRequest);
    expect(result).toBe('ip:1.1.1.1');
  });
});

describe('Rate Limit - Memory Store (Fallback)', () => {
  beforeEach(async () => {
    vi.resetModules();
    // Ensure Redis is not configured
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('should allow first request', async () => {
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    const result = await checkRateLimit('test-user-1', 'api:general');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(59); // 60 - 1
  });

  it('should track multiple requests', async () => {
    const { checkRateLimit } = await import('@/lib/security/rate-limit');

    // First request
    await checkRateLimit('test-user-2', 'api:general');
    // Second request
    const result = await checkRateLimit('test-user-2', 'api:general');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(58); // 60 - 2
  });

  it('should block requests after limit is reached', async () => {
    const { checkRateLimit } = await import('@/lib/security/rate-limit');

    // Use a strict limit type for testing
    const identifier = 'test-user-blocked';

    // Make 5 requests (auth:login limit)
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(identifier, 'auth:login');
    }

    // 6th request should be blocked
    const result = await checkRateLimit(identifier, 'auth:login');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeDefined();
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should throw error for unknown limit type', async () => {
    const { checkRateLimit } = await import('@/lib/security/rate-limit');

    await expect(
      checkRateLimit('test-user', 'unknown:type' as any)
    ).rejects.toThrow('Unknown rate limit type: unknown:type');
  });
});

describe('Rate Limit - Headers', () => {
  it('should generate correct rate limit headers', async () => {
    const { getRateLimitHeaders, RATE_LIMITS } = await import('@/lib/security/rate-limit');

    const result = {
      allowed: true,
      remaining: 55,
      resetTime: Date.now() + 60000,
    };

    const headers = getRateLimitHeaders(result, 'api:general');

    expect(headers['X-RateLimit-Limit']).toBe('60');
    expect(headers['X-RateLimit-Remaining']).toBe('55');
    expect(headers['X-RateLimit-Reset']).toBeDefined();
  });
});

describe('Rate Limit - Middleware', () => {
  beforeEach(async () => {
    vi.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('should return null when request is allowed', async () => {
    const { rateLimitMiddleware } = await import('@/lib/security/rate-limit');
    const mockRequest = new Request('https://example.com', {
      headers: new Headers({
        'x-real-ip': '100.0.0.1',
      }),
    });

    const result = await rateLimitMiddleware(mockRequest, 'api:general');

    expect(result).toBeNull();
  });

  it('should return 429 response when rate limited', async () => {
    const { rateLimitMiddleware } = await import('@/lib/security/rate-limit');
    const mockRequest = new Request('https://example.com', {
      headers: new Headers({
        'x-real-ip': '200.0.0.1',
      }),
    });

    // Exhaust rate limit for auth:login (5 requests)
    for (let i = 0; i < 5; i++) {
      await rateLimitMiddleware(mockRequest, 'auth:login');
    }

    // Next request should be rate limited
    const result = await rateLimitMiddleware(mockRequest, 'auth:login');

    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);

    const body = await result!.json();
    expect(body.error).toBe('Too Many Requests');
    expect(body.retryAfter).toBeDefined();
  });

  it('should include rate limit headers in 429 response', async () => {
    const { rateLimitMiddleware } = await import('@/lib/security/rate-limit');
    const mockRequest = new Request('https://example.com', {
      headers: new Headers({
        'x-real-ip': '201.0.0.1',
      }),
    });

    // Exhaust rate limit
    for (let i = 0; i < 5; i++) {
      await rateLimitMiddleware(mockRequest, 'auth:login');
    }

    const result = await rateLimitMiddleware(mockRequest, 'auth:login');

    expect(result!.headers.get('Content-Type')).toBe('application/json');
    expect(result!.headers.get('Retry-After')).toBeDefined();
    expect(result!.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(result!.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(result!.headers.get('X-RateLimit-Reset')).toBeDefined();
  });
});

describe('Rate Limit - useRateLimit Hook', () => {
  it('should return rate limit info for a given type', async () => {
    const { useRateLimit } = await import('@/lib/security/rate-limit');

    const info = useRateLimit('api:general');

    expect(info.maxRequests).toBe(60);
    expect(info.windowMs).toBe(60000);
    expect(info.windowMinutes).toBe(1);
  });

  it('should return correct window for auth:login', async () => {
    const { useRateLimit } = await import('@/lib/security/rate-limit');

    const info = useRateLimit('auth:login');

    expect(info.maxRequests).toBe(5);
    expect(info.windowMinutes).toBe(15);
  });
});
