import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Only use env values if they look like real credentials
const isValidUrl = (s?: string) => {
  try { return s ? new URL(s).protocol.startsWith('http') : false } catch { return false }
}

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl! : 'https://placeholder.supabase.co'
const supabaseAnonKey = (rawKey && rawKey !== 'your_supabase_anon_key') ? rawKey : 'placeholder-anon-key'

export const supabaseConfigured = isValidUrl(rawUrl) && rawKey !== 'your_supabase_anon_key'

if (!supabaseConfigured) {
  console.warn(
    '[FacePulse] Supabase not configured — auth and data persistence disabled. ' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to web-app/frontend/.env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
