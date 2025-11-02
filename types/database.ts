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
      project_collaborators: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          id: string
          invited_at: string | null
          invited_by: string | null
          project_id: string
          role: string
          status: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          project_id: string
          role?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          project_id?: string
          role?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      project_history: {
        Row: {
          action_type: string
          changes: Json | null
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          project_id: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          project_id: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          project_id?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      [key: string]: any
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
