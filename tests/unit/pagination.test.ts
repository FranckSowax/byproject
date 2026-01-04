import { describe, it, expect, vi } from 'vitest';
import {
  getPaginationParams,
  getSortParams,
  getSearchParam,
  getFilterParam,
  buildPaginatedResponse,
  getPaginationHeaders,
  PAGINATION_DEFAULTS,
} from '@/lib/api/pagination';

// Helper to create a mock NextRequest
function createMockRequest(url: string): any {
  return {
    url,
  };
}

describe('Pagination Utils', () => {
  describe('getPaginationParams', () => {
    it('should return default values when no params provided', () => {
      const request = createMockRequest('https://example.com/api/items');
      const params = getPaginationParams(request);

      expect(params.page).toBe(PAGINATION_DEFAULTS.page);
      expect(params.limit).toBe(PAGINATION_DEFAULTS.limit);
      expect(params.offset).toBe(0);
    });

    it('should parse page parameter', () => {
      const request = createMockRequest('https://example.com/api/items?page=3');
      const params = getPaginationParams(request);

      expect(params.page).toBe(3);
      expect(params.offset).toBe(40); // (3-1) * 20
    });

    it('should parse limit parameter', () => {
      const request = createMockRequest('https://example.com/api/items?limit=50');
      const params = getPaginationParams(request);

      expect(params.limit).toBe(50);
    });

    it('should parse pageSize as alias for limit', () => {
      const request = createMockRequest('https://example.com/api/items?pageSize=30');
      const params = getPaginationParams(request);

      expect(params.limit).toBe(30);
    });

    it('should cap limit at maxLimit', () => {
      const request = createMockRequest('https://example.com/api/items?limit=500');
      const params = getPaginationParams(request);

      expect(params.limit).toBe(PAGINATION_DEFAULTS.maxLimit);
    });

    it('should parse offset parameter directly', () => {
      const request = createMockRequest('https://example.com/api/items?offset=60');
      const params = getPaginationParams(request);

      expect(params.offset).toBe(60);
      expect(params.page).toBe(4); // 60/20 + 1
    });

    it('should handle invalid page values', () => {
      const request = createMockRequest('https://example.com/api/items?page=-5');
      const params = getPaginationParams(request);

      expect(params.page).toBe(PAGINATION_DEFAULTS.page);
    });

    it('should handle invalid limit values', () => {
      const request = createMockRequest('https://example.com/api/items?limit=abc');
      const params = getPaginationParams(request);

      expect(params.limit).toBe(PAGINATION_DEFAULTS.limit);
    });

    it('should combine page and limit correctly', () => {
      const request = createMockRequest('https://example.com/api/items?page=2&limit=10');
      const params = getPaginationParams(request);

      expect(params.page).toBe(2);
      expect(params.limit).toBe(10);
      expect(params.offset).toBe(10); // (2-1) * 10
    });
  });

  describe('getSortParams', () => {
    it('should return default sort values', () => {
      const request = createMockRequest('https://example.com/api/items');
      const params = getSortParams(request);

      expect(params.sortBy).toBe('created_at');
      expect(params.sortOrder).toBe('desc');
    });

    it('should parse sortBy parameter', () => {
      const request = createMockRequest('https://example.com/api/items?sortBy=name');
      const params = getSortParams(request, 'created_at', ['name', 'created_at']);

      expect(params.sortBy).toBe('name');
    });

    it('should parse sort as alias for sortBy', () => {
      const request = createMockRequest('https://example.com/api/items?sort=name');
      const params = getSortParams(request, 'created_at', ['name', 'created_at']);

      expect(params.sortBy).toBe('name');
    });

    it('should parse order parameter', () => {
      const request = createMockRequest('https://example.com/api/items?order=asc');
      const params = getSortParams(request);

      expect(params.sortOrder).toBe('asc');
    });

    it('should validate sortBy against allowed fields', () => {
      const request = createMockRequest('https://example.com/api/items?sortBy=invalid_field');
      const params = getSortParams(request, 'created_at', ['name', 'created_at']);

      expect(params.sortBy).toBe('created_at'); // Falls back to default
    });

    it('should default to desc for invalid order values', () => {
      const request = createMockRequest('https://example.com/api/items?order=invalid');
      const params = getSortParams(request);

      expect(params.sortOrder).toBe('desc');
    });
  });

  describe('getSearchParam', () => {
    it('should return null when no search param', () => {
      const request = createMockRequest('https://example.com/api/items');
      const search = getSearchParam(request);

      expect(search).toBeNull();
    });

    it('should parse search parameter', () => {
      const request = createMockRequest('https://example.com/api/items?search=test');
      const search = getSearchParam(request);

      expect(search).toBe('test');
    });

    it('should parse q as alias for search', () => {
      const request = createMockRequest('https://example.com/api/items?q=query');
      const search = getSearchParam(request);

      expect(search).toBe('query');
    });
  });

  describe('getFilterParam', () => {
    it('should return null when param not present', () => {
      const request = createMockRequest('https://example.com/api/items');
      const filter = getFilterParam(request, 'category');

      expect(filter).toBeNull();
    });

    it('should return param value when present', () => {
      const request = createMockRequest('https://example.com/api/items?category=electronics');
      const filter = getFilterParam(request, 'category');

      expect(filter).toBe('electronics');
    });
  });

  describe('buildPaginatedResponse', () => {
    it('should build correct pagination response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const params = { page: 1, limit: 20, offset: 0 };
      const response = buildPaginatedResponse(data, 50, params);

      expect(response.data).toEqual(data);
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.limit).toBe(20);
      expect(response.pagination.total).toBe(50);
      expect(response.pagination.totalPages).toBe(3); // ceil(50/20)
      expect(response.pagination.hasNext).toBe(true);
      expect(response.pagination.hasPrev).toBe(false);
    });

    it('should calculate hasNext correctly on last page', () => {
      const data = [{ id: 1 }];
      const params = { page: 3, limit: 20, offset: 40 };
      const response = buildPaginatedResponse(data, 50, params);

      expect(response.pagination.hasNext).toBe(false);
      expect(response.pagination.hasPrev).toBe(true);
    });

    it('should handle empty data', () => {
      const data: any[] = [];
      const params = { page: 1, limit: 20, offset: 0 };
      const response = buildPaginatedResponse(data, 0, params);

      expect(response.data).toEqual([]);
      expect(response.pagination.total).toBe(0);
      expect(response.pagination.totalPages).toBe(0);
      expect(response.pagination.hasNext).toBe(false);
      expect(response.pagination.hasPrev).toBe(false);
    });

    it('should handle middle page', () => {
      const data = [{ id: 1 }];
      const params = { page: 2, limit: 20, offset: 20 };
      const response = buildPaginatedResponse(data, 100, params);

      expect(response.pagination.page).toBe(2);
      expect(response.pagination.totalPages).toBe(5);
      expect(response.pagination.hasNext).toBe(true);
      expect(response.pagination.hasPrev).toBe(true);
    });
  });

  describe('getPaginationHeaders', () => {
    it('should generate correct headers', () => {
      const pagination = {
        page: 2,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
      };

      const headers = getPaginationHeaders(pagination);

      expect(headers['X-Total-Count']).toBe('100');
      expect(headers['X-Total-Pages']).toBe('5');
      expect(headers['X-Current-Page']).toBe('2');
      expect(headers['X-Page-Size']).toBe('20');
    });
  });
});
