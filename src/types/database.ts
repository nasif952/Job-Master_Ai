// 🗄️ Database Types - Generated from Supabase schema
// This file will be automatically generated when we connect to Supabase

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
      users: {
        Row: {
          id: string
          email: string
          name: string
          password_hash: string | null
          avatar: string | null
          email_verified: boolean
          title: string | null
          location: string | null
          bio: string | null
          skills: string[]
          preferences: Json | null
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          password_hash?: string | null
          avatar?: string | null
          email_verified?: boolean
          title?: string | null
          location?: string | null
          bio?: string | null
          skills?: string[]
          preferences?: Json | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          password_hash?: string | null
          avatar?: string | null
          email_verified?: boolean
          title?: string | null
          location?: string | null
          bio?: string | null
          skills?: string[]
          preferences?: Json | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          title: string
          company: string
          description: string | null
          requirements: string | null
          benefits: string | null
          salary: string | null
          location: string | null
          remote: boolean
          job_type: string | null
          status: string
          application_date: string | null
          url: string | null
          source: string | null
          match_score: number | null
          ai_analysis: Json | null
          custom_notes: string | null
          priority: string
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          company: string
          description?: string | null
          requirements?: string | null
          benefits?: string | null
          salary?: string | null
          location?: string | null
          remote?: boolean
          job_type?: string | null
          status?: string
          application_date?: string | null
          url?: string | null
          source?: string | null
          match_score?: number | null
          ai_analysis?: Json | null
          custom_notes?: string | null
          priority?: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          company?: string
          description?: string | null
          requirements?: string | null
          benefits?: string | null
          salary?: string | null
          location?: string | null
          remote?: boolean
          job_type?: string | null
          status?: string
          application_date?: string | null
          url?: string | null
          source?: string | null
          match_score?: number | null
          ai_analysis?: Json | null
          custom_notes?: string | null
          priority?: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          job_id: string | null
          title: string | null
          type: string
          context: Json | null
          is_active: boolean
          summary: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id?: string | null
          title?: string | null
          type?: string
          context?: Json | null
          is_active?: boolean
          summary?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string | null
          title?: string | null
          type?: string
          context?: Json | null
          is_active?: boolean
          summary?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          session_id: string
          content: string
          role: string
          message_type: string
          tokens: number | null
          model: string | null
          context: Json | null
          is_edited: boolean
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          content: string
          role: string
          message_type?: string
          tokens?: number | null
          model?: string | null
          context?: Json | null
          is_edited?: boolean
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          content?: string
          role?: string
          message_type?: string
          tokens?: number | null
          model?: string | null
          context?: Json | null
          is_edited?: boolean
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table types as needed...
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