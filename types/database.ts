export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          hashed_password: string
          preferred_language: string
          role_id: number | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          hashed_password: string
          preferred_language?: string
          role_id?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          hashed_password?: string
          preferred_language?: string
          role_id?: number | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: number
          user_id: string | null
          plan: string
          project_limit: number
          export_limit: number
          expires_at: string | null
        }
        Insert: {
          id?: number
          user_id?: string | null
          plan: string
          project_limit?: number
          export_limit?: number
          expires_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string | null
          plan?: string
          project_limit?: number
          export_limit?: number
          expires_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string | null
          name: string
          source_url: string | null
          file_path: string | null
          mapping_status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          source_url?: string | null
          file_path?: string | null
          mapping_status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          source_url?: string | null
          file_path?: string | null
          mapping_status?: string | null
          created_at?: string
        }
      }
      column_mappings: {
        Row: {
          id: number
          project_id: string | null
          ai_mapping: Json | null
          user_mapping: Json | null
          updated_at: string
        }
        Insert: {
          id?: number
          project_id?: string | null
          ai_mapping?: Json | null
          user_mapping?: Json | null
          updated_at?: string
        }
        Update: {
          id?: number
          project_id?: string | null
          ai_mapping?: Json | null
          user_mapping?: Json | null
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          project_id: string | null
          name: string
          category: string | null
          quantity: number | null
          weight: number | null
          volume: number | null
          specs: Json | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          name: string
          category?: string | null
          quantity?: number | null
          weight?: number | null
          volume?: number | null
          specs?: Json | null
        }
        Update: {
          id?: string
          project_id?: string | null
          name?: string
          category?: string | null
          quantity?: number | null
          weight?: number | null
          volume?: number | null
          specs?: Json | null
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          country: string | null
          contact_info: Json | null
          logo_url: string | null
        }
        Insert: {
          id?: string
          name: string
          country?: string | null
          contact_info?: Json | null
          logo_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          country?: string | null
          contact_info?: Json | null
          logo_url?: string | null
        }
      }
      currencies: {
        Row: {
          code: string
          symbol: string | null
        }
        Insert: {
          code: string
          symbol?: string | null
        }
        Update: {
          code?: string
          symbol?: string | null
        }
      }
      exchange_rates: {
        Row: {
          id: number
          project_id: string | null
          from_currency: string | null
          to_currency: string | null
          rate: number | null
          updated_at: string
        }
        Insert: {
          id?: number
          project_id?: string | null
          from_currency?: string | null
          to_currency?: string | null
          rate?: number | null
          updated_at?: string
        }
        Update: {
          id?: number
          project_id?: string | null
          from_currency?: string | null
          to_currency?: string | null
          rate?: number | null
          updated_at?: string
        }
      }
      prices: {
        Row: {
          id: number
          material_id: string | null
          supplier_id: string | null
          country: string | null
          amount: number
          currency: string | null
          converted_amount: number | null
          created_at: string
        }
        Insert: {
          id?: number
          material_id?: string | null
          supplier_id?: string | null
          country?: string | null
          amount: number
          currency?: string | null
          converted_amount?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          material_id?: string | null
          supplier_id?: string | null
          country?: string | null
          amount?: number
          currency?: string | null
          converted_amount?: number | null
          created_at?: string
        }
      }
      photos: {
        Row: {
          id: number
          material_id: string | null
          url: string
          uploaded_at: string
        }
        Insert: {
          id?: number
          material_id?: string | null
          url: string
          uploaded_at?: string
        }
        Update: {
          id?: number
          material_id?: string | null
          url?: string
          uploaded_at?: string
        }
      }
      exports: {
        Row: {
          id: number
          project_id: string | null
          user_id: string | null
          format: string | null
          file_path: string | null
          created_at: string
        }
        Insert: {
          id?: number
          project_id?: string | null
          user_id?: string | null
          format?: string | null
          file_path?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          project_id?: string | null
          user_id?: string | null
          format?: string | null
          file_path?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
