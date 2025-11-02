export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      materials: {
        Row: {
          category: string | null
          id: string
          name: string
          project_id: string | null
          quantity: number | null
          specs: Json | null
          volume: number | null
          weight: number | null
        }
        Insert: {
          category?: string | null
          id?: string
          name: string
          project_id?: string | null
          quantity?: number | null
          specs?: Json | null
          volume?: number | null
          weight?: number | null
        }
        Update: {
          category?: string | null
          id?: string
          name?: string
          project_id?: string | null
          quantity?: number | null
          specs?: Json | null
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
          supplier_id: string | null
          updated_at: string | null
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
          supplier_id?: string | null
          updated_at?: string | null
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
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          name: string
          country: string | null
          contact_name: string | null
          phone: string | null
          email: string | null
          whatsapp: string | null
          wechat: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          country?: string | null
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          whatsapp?: string | null
          wechat?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          country?: string | null
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          whatsapp?: string | null
          wechat?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
