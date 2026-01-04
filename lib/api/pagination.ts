/**
 * Utilitaires de pagination pour les API
 * Fournit des fonctions réutilisables pour la pagination des requêtes Supabase
 */

import { NextRequest } from 'next/server';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Limites par défaut et maximales
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
};

/**
 * Extrait les paramètres de pagination depuis une requête
 */
export function getPaginationParams(request: NextRequest): PaginationParams {
  const url = new URL(request.url);

  // Extraire les paramètres
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit') || url.searchParams.get('pageSize');
  const offsetParam = url.searchParams.get('offset');

  // Parser et valider page
  let page = pageParam ? parseInt(pageParam, 10) : PAGINATION_DEFAULTS.page;
  if (isNaN(page) || page < 1) page = PAGINATION_DEFAULTS.page;

  // Parser et valider limit
  let limit = limitParam ? parseInt(limitParam, 10) : PAGINATION_DEFAULTS.limit;
  if (isNaN(limit) || limit < 1) limit = PAGINATION_DEFAULTS.limit;
  if (limit > PAGINATION_DEFAULTS.maxLimit) limit = PAGINATION_DEFAULTS.maxLimit;

  // Calculer offset (soit depuis le paramètre, soit depuis page)
  let offset: number;
  if (offsetParam !== null) {
    offset = parseInt(offsetParam, 10);
    if (isNaN(offset) || offset < 0) offset = 0;
    // Recalculer la page basée sur l'offset
    page = Math.floor(offset / limit) + 1;
  } else {
    offset = (page - 1) * limit;
  }

  return { page, limit, offset };
}

/**
 * Construit l'objet de réponse paginée
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * Applique la pagination à une requête Supabase
 * Retourne la requête modifiée avec range()
 */
export function applyPaginationToQuery<T>(
  query: any,
  params: PaginationParams
): any {
  const from = params.offset;
  const to = params.offset + params.limit - 1;
  return query.range(from, to);
}

/**
 * Récupère le count total pour une table Supabase
 */
export async function getTableCount(
  supabase: any,
  table: string,
  filters?: Record<string, any>
): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }
  }

  const { count, error } = await query;

  if (error) {
    console.error(`Error counting ${table}:`, error);
    return 0;
  }

  return count || 0;
}

/**
 * Headers de pagination à ajouter aux réponses
 */
export function getPaginationHeaders(
  pagination: PaginatedResponse<any>['pagination']
): Record<string, string> {
  return {
    'X-Total-Count': pagination.total.toString(),
    'X-Total-Pages': pagination.totalPages.toString(),
    'X-Current-Page': pagination.page.toString(),
    'X-Page-Size': pagination.limit.toString(),
  };
}

/**
 * Paramètres de tri
 */
export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Extrait les paramètres de tri depuis une requête
 */
export function getSortParams(
  request: NextRequest,
  defaultSortBy: string = 'created_at',
  allowedFields: string[] = []
): SortParams {
  const url = new URL(request.url);

  let sortBy = url.searchParams.get('sortBy') || url.searchParams.get('sort') || defaultSortBy;
  const sortOrder = (url.searchParams.get('order') || url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  // Valider le champ de tri si une liste est fournie
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    sortBy = defaultSortBy;
  }

  return {
    sortBy,
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
  };
}

/**
 * Paramètres de recherche
 */
export function getSearchParam(request: NextRequest): string | null {
  const url = new URL(request.url);
  return url.searchParams.get('search') || url.searchParams.get('q') || null;
}

/**
 * Paramètre de filtre générique
 */
export function getFilterParam(request: NextRequest, paramName: string): string | null {
  const url = new URL(request.url);
  return url.searchParams.get(paramName);
}
