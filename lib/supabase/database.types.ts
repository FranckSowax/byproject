export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      photos: {
        Row: {
          id: number
          material_id: string | null
          price_id: number | null
          url: string
          photo_type: string | null
          uploaded_at: string | null
        }
        Insert: {
          id?: number
          material_id?: string | null
          price_id?: number | null
          url: string
          photo_type?: string | null
          uploaded_at?: string | null
        }
        Update: {
          id?: number
          material_id?: string | null
          price_id?: number | null
          url?: string
          photo_type?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          quantity: number | null
          specs: Json
          surface: number | null
          volume: number | null
          weight: number | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          quantity?: number | null
          specs?: Json
          surface?: number | null
          volume?: number | null
          weight?: number | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          quantity?: number | null
          specs?: Json
          surface?: number | null
          volume?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          file_path: string | null
          id: string
          mapping_status: string | null
          name: string
          source_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_path?: string | null
          id?: string
          mapping_status?: string | null
          name: string
          source_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string | null
          id?: string
          mapping_status?: string | null
          name?: string
          source_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      prices: {
        Row: {
          amount: number
          converted_amount: number | null
          country: string | null
          created_at: string | null
          currency: string | null
          id: number
          material_id: string | null
          notes: string | null
          notes_fr: string | null
          supplier_id: string | null
          variations: Json | null
        }
        Insert: {
          amount: number
          converted_amount?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          id?: number
          material_id?: string | null
          notes?: string | null
          notes_fr?: string | null
          supplier_id?: string | null
          variations?: Json | null
        }
        Update: {
          amount?: number
          converted_amount?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          id?: number
          material_id?: string | null
          notes?: string | null
          notes_fr?: string | null
          supplier_id?: string | null
          variations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_info: Json | null
          contact_name: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          wechat: string | null
          whatsapp: string | null
        }
        Insert: {
          contact_info?: Json | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          wechat?: string | null
          whatsapp?: string | null
        }
        Update: {
          contact_info?: Json | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          wechat?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      supplier_material_availability: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean
          material_id: string
          notes: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean
          material_id: string
          notes?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean
          material_id?: string
          notes?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_material_availability_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_material_availability_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_quotes: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          is_accepted: boolean | null
          notes: string | null
          rejected_at: string | null
          status: string | null
          supplier_id: string
          supplier_request_id: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          is_accepted?: boolean | null
          notes?: string | null
          rejected_at?: string | null
          status?: string | null
          supplier_id: string
          supplier_request_id: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          is_accepted?: boolean | null
          notes?: string | null
          rejected_at?: string | null
          status?: string | null
          supplier_id?: string
          supplier_request_id?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotes_supplier_request_id_fkey"
            columns: ["supplier_request_id"]
            isOneToOne: false
            referencedRelation: "supplier_requests"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never
