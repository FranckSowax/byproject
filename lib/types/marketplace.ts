/**
 * Types partagés pour le système de requêtes client et recherche marketplace
 * Utilisés par les services Taobao, 1688, Kimi et l'agrégateur
 */

// ============================================================================
// Marketplace Sources
// ============================================================================

export type MarketplaceSource = '1688' | 'taobao' | 'kimi_factory' | 'manual';

// ============================================================================
// Marketplace Product (normalized across all sources)
// ============================================================================

export interface MarketplaceProduct {
  externalId: string;
  source: MarketplaceSource;
  title: string;
  titleZh?: string;
  titleFr?: string;
  description?: string;
  descriptionZh?: string;
  descriptionFr?: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  moq?: number;
  imageUrl: string;
  mainImageUrl?: string;
  extraImages?: string[];
  productUrl: string;
  supplierName?: string;
  supplierLocation?: string;
  supplierRating?: number;
  supplierYears?: number;
  supplierVerified?: boolean;
  supplierContact?: SupplierContact;
  weight?: number;
  volume?: number;
  dimensions?: string;
  rawData?: Record<string, unknown>;
}

export interface SupplierContact {
  phone?: string;
  email?: string;
  wechat?: string;
  whatsapp?: string;
  website?: string;
}

// ============================================================================
// Search Results
// ============================================================================

export interface MarketplaceSearchResult {
  source: MarketplaceSource;
  query: string;
  queryZh?: string;
  products: MarketplaceProduct[];
  totalFound: number;
  searchedAt: Date;
  error?: string;
}

export interface AggregatedSearchResult {
  itemId: string;
  itemName: string;
  results: MarketplaceSearchResult[];
  totalProducts: number;
  searchedAt: Date;
}

export interface SearchProgress {
  totalItems: number;
  completedItems: number;
  currentItem?: string;
  currentSource?: MarketplaceSource;
  errors: Array<{ itemId: string; source: MarketplaceSource; error: string }>;
  startedAt: Date;
  status: 'idle' | 'searching' | 'completed' | 'error';
}

// ============================================================================
// Client Request Types (matching DB schema)
// ============================================================================

export type ClientRequestStatus =
  | 'draft'
  | 'submitted'
  | 'searching'
  | 'search_complete'
  | 'proposal_ready'
  | 'proposal_reviewed'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'cancelled';

export type ClientRequestItemStatus =
  | 'pending'
  | 'searching'
  | 'results_available'
  | 'curated'
  | 'no_results';

export type ProposalStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired';

export interface ClientRequest {
  id: string;
  public_uuid: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  user_id: string | null;
  request_number: string;
  title: string | null;
  status: ClientRequestStatus;
  project_id: string | null;
  supplier_request_id: string | null;
  sector_id: string | null;
  admin_notes: string | null;
  assigned_admin_id: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  search_started_at: string | null;
  proposal_sent_at: string | null;
  client_reviewed_at: string | null;
  completed_at: string | null;
  // Joined data
  items?: ClientRequestItem[];
  proposals?: ClientProposal[];
}

export interface ClientRequestItem {
  id: string;
  client_request_id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  images: string[];
  reference_url: string | null;
  name_zh: string | null;
  name_en: string | null;
  description_zh: string | null;
  description_en: string | null;
  admin_notes: string | null;
  status: ClientRequestItemStatus;
  material_id: string | null;
  client_note: string | null;
  sort_order: number;
  added_by: 'client' | 'admin';
  created_at: string;
  updated_at: string;
  // Joined data
  search_results?: MarketplaceSearchResultRow[];
}

export interface MarketplaceSearchResultRow {
  id: string;
  client_request_item_id: string;
  source: MarketplaceSource;
  external_id: string | null;
  title: string;
  title_zh: string | null;
  title_fr: string | null;
  description: string | null;
  description_zh: string | null;
  description_fr: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  moq: number | null;
  image_url: string | null;
  main_image_url: string | null;
  extra_images: string[];
  product_url: string | null;
  supplier_name: string | null;
  supplier_location: string | null;
  supplier_rating: number | null;
  supplier_years: number | null;
  supplier_verified: boolean;
  supplier_contact: SupplierContact;
  weight: number | null;
  volume: number | null;
  dimensions: string | null;
  is_selected: boolean;
  admin_margin_percent: number;
  client_price: number | null;
  client_currency: string;
  quantity: number;
  admin_notes: string | null;
  client_selected: boolean | null;
  client_quantity: number | null;
  raw_data: Record<string, unknown>;
  searched_at: string;
  created_at: string;
}

export interface ClientProposal {
  id: string;
  client_request_id: string;
  proposal_number: string;
  status: ProposalStatus;
  total_amount: number | null;
  currency: string;
  default_margin_percent: number;
  document_type: 'devis' | 'packing_list' | 'proforma';
  pdf_url: string | null;
  valid_until: string | null;
  client_selections: Array<{
    result_id: string;
    quantity: number;
    selected: boolean;
  }>;
  client_notes: string | null;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
}

export interface ClientRequestNote {
  id: string;
  client_request_item_id: string | null;
  marketplace_search_result_id: string | null;
  author_type: 'admin' | 'client' | 'system';
  author_id: string | null;
  content: string;
  media_urls: string[];
  created_at: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateClientRequestPayload {
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_company?: string;
  title?: string;
}

export interface AddItemPayload {
  name: string;
  description?: string;
  quantity?: number;
  unit?: string;
  images?: string[];
  reference_url?: string;
}

export interface SubmitRequestPayload {
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_company?: string;
  notes?: string;
}

export interface CurateResultsPayload {
  selections: Array<{
    result_id: string;
    is_selected: boolean;
    margin_percent?: number;
    quantity?: number;
  }>;
  default_margin_percent?: number;
}

export interface ProposalResponsePayload {
  selections: Array<{
    result_id: string;
    selected: boolean;
    quantity: number;
  }>;
  client_notes?: string;
}

// ============================================================================
// Kimi Factory Search Types
// ============================================================================

export interface KimiFactory {
  companyName: string;
  city: string;
  experienceYears: number;
  specialties: string[];
  moq: number;
  estimatedPrice: string;
  contact: SupplierContact;
  whyRecommended: string;
}

export interface KimiFactorySearchResult {
  query: string;
  factories: KimiFactory[];
  searchedAt: Date;
}

// ============================================================================
// Currency conversion rates
// ============================================================================

export const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  CNY: { EUR: 0.13, USD: 0.14, XAF: 85, FCFA: 85 },
  EUR: { CNY: 7.7, USD: 1.08, XAF: 655.957, FCFA: 655.957 },
  USD: { CNY: 7.1, EUR: 0.93, XAF: 607, FCFA: 607 },
};

export function convertCurrency(
  amount: number,
  from: string,
  to: string
): number {
  if (from === to) return amount;
  const rate = EXCHANGE_RATES[from]?.[to];
  if (!rate) return amount;
  return Math.round(amount * rate * 100) / 100;
}
