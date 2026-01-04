export interface Material {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number | null;
  surface: number | null;
  weight: number | null;
  volume: number | null;
  specs: any;
  images?: string[];
  project_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaterialPrice {
  id: string;
  material_id: string;
  amount: number;
  currency: string;
  supplier_id?: string;
  supplier?: {
    id: string;
    name: string;
  };
}

export type ViewMode = 'grid' | 'list' | 'categories' | 'suggestions';
