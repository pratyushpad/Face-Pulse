import { useEffect, useRef } from 'react'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { HistoryEntry } from '@/types'

interface Params {
  isDetecting: boolean
  sessionStart: number | null
  historyLog: HistoryEntry[]
  emotionCounts: Record<string, number>
  totalDetections: number
}

export function useSessionPersistence({
  isDetecting,
  sessionStart,
  historyLog,
  emotionCounts,
  totalDetections,
}: Params) {
  const { user } = useAuth()
  const sessionIdRef = useRef<string | null>(null)
  const wasDetectingRef = useRef(false)
  const savedCountRef = useRef(0)
  // Entries that arrived before the session row was created
  const pendingRef = useRef<HistoryEntry[]>([])

  // Session lifecycle: create row on start, update on stop
  useEffect(() => {
    if (!supabaseConfigured || !user) return

    const started = isDetecting && !wasDetectingRef.current
    const stopped = !isDetecting && wasDetectingRef.current
    wasDetectingRef.current = isDetecting

    if (started && sessionStart) {
      sessionIdRef.current = null
      savedCountRef.current = 0
      pendingRef.current = []

      supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          started_at: new Date(sessionStart).toISOString(),
          total_detections: 0,
          dominant_emotion: null,
          settings: {},
        })
        .select('id')
        .single()
        .then(({ data, error }) => {
          if (error || !data) return
          sessionIdRef.current = data.id
          // Flush any entries that arrived before session row was ready
          if (pendingRef.current.length > 0) {
            const rows = pendingRef.current.map((e) => toRow(e, data.id))
            pendingRef.current = []
            supabase.from('detections').insert(rows)
          }
        })
    }

    if (stopped && sessionIdRef.current) {
      const dominant =
        Object.entries(emotionCounts)
          .filter(([, v]) => v > 0)
          .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

      const id = sessionIdRef.current
      supabase
        .from('sessions')
        .update({
          ended_at: new Date().toISOString(),
          total_detections: totalDetections,
          dominant_emotion: dominant,
        })
        .eq('id', id)
        .then(() => {
          // Only null out after the update completes so any final entries still get written
          if (sessionIdRef.current === id) sessionIdRef.current = null
        })
    }
  }, [isDetecting, sessionStart, user, emotionCounts, totalDetections])

  // Save new history entries as they appear
  useEffect(() => {
    if (!supabaseConfigured || !user) return

    // resetSession sets historyLog to [] — reset our counter
    if (historyLog.length === 0) {
      savedCountRef.current = 0
      return
    }

    const newCount = historyLog.length - savedCountRef.current
    if (newCount <= 0) return

    // historyLog is newest-first: new entries are at 0..newCount-1
    const newEntries = historyLog.slice(0, newCount)
    savedCountRef.current = historyLog.length

    if (sessionIdRef.current) {
      supabase.from('detections').insert(newEntries.map((e) => toRow(e, sessionIdRef.current!)))
    } else {
      pendingRef.current.push(...newEntries)
    }
  }, [historyLog, user])
}

function toRow(e: HistoryEntry, sessionId: string) {
  return {
    session_id: sessionId,
    emotion: e.emotion,
    confidence: e.confidence / 100,
    expressions: {} as Record<string, number>,
    detected_at: new Date().toISOString(),
  }
}
