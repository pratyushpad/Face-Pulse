import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env vars missing. Auth and data persistence will not work. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          total_detections: number
          dominant_emotion: string | null
          settings: Record<string, unknown>
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>
      }
      detections: {
        Row: {
          id: string
          session_id: string
          emotion: string
          confidence: number
          expressions: Record<string, number>
          detected_at: string
        }
        Insert: Omit<Database['public']['Tables']['detections']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['detections']['Insert']>
      }
    }
  }
}
