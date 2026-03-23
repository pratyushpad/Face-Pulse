import { useState, useMemo, useEffect } from 'react'
import { Download, Search, Filter, Clock, Zap, Brain, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useDetection } from '@/contexts/DetectionContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { EMOTION_LABELS, ALL_EMOTIONS } from '@/constants'
import type { EmotionKey } from '@/constants'
import type { HistoryEntry } from '@/types'

interface SessionRow {
  id: string
  started_at: string
  ended_at: string | null
  total_detections: number
  dominant_emotion: string | null
}

function usePastSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured || !user) {
      setLoading(false)
      return
    }
    supabase
      .from('sessions')
      .select('id, started_at, ended_at, total_detections, dominant_emotion')
      .eq('user_id', user.id)
      .not('ended_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setSessions((data as SessionRow[]) ?? [])
        setLoading(false)
      })
  }, [user])

  return { sessions, loading }
}

function formatDuration(startedAt: string, endedAt: string) {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  if (m === 0) return `${s}s`
  return `${m}m ${s % 60}s`
}

function exportPDF(
  log: HistoryEntry[],
  emotionCounts: Record<string, number>,
  sessionStart: number | null,
  sessionEnd: number | null,
) {
  if (log.length === 0) return
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setTextColor(30, 30, 30)
  doc.text('FacePulse — Session Report', 14, 22)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)

  if (sessionStart) {
    const durationMs = (sessionEnd ?? Date.now()) - sessionStart
    const s = Math.floor(durationMs / 1000)
    const m = Math.floor(s / 60)
    const duration = m > 0 ? `${m}m ${s % 60}s` : `${s}s`
    doc.text(`Session started: ${new Date(sessionStart).toLocaleString()}   Duration: ${duration}`, 14, 36)
  }

  doc.text(`Total emotion events: ${log.length}`, 14, 42)

  // Emotion distribution table
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.text('Emotion Distribution', 14, 52)

  autoTable(doc, {
    startY: 56,
    head: [['Emotion', 'Count']],
    body: ALL_EMOTIONS.map((e) => [
      EMOTION_LABELS[e] ?? e,
      String(emotionCounts[e] || 0),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [96, 165, 250], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  // Events table
  const afterDist = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.text('Emotion Events', 14, afterDist)

  autoTable(doc, {
    startY: afterDist + 4,
    head: [['Timestamp', 'Emotion', 'Confidence', 'Duration']],
    body: log.map((e) => [
      e.timestamp,
      EMOTION_LABELS[e.emotion] ?? e.emotion,
      `${e.confidence}%`,
      e.duration,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [96, 165, 250], textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  })

  doc.save(`facepulse-report-${new Date().toISOString().slice(0, 10)}.pdf`)
}

function exportCSV(log: ReturnType<typeof useDetection>['historyLog']) {
  if (log.length === 0) return
  const header = 'Timestamp,Emotion,Confidence,Duration\n'
  const rows = log.map((e) => `${e.timestamp},${e.emotion},${e.confidence}%,${e.duration}`).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `facepulse-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportJSON(log: ReturnType<typeof useDetection>['historyLog']) {
  if (log.length === 0) return
  const data = { exported_at: new Date().toISOString(), total_entries: log.length, entries: log }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `facepulse-log-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const card = 'bg-surface border border-border-subtle rounded-[12px]'

export function HistoryPage() {
  const { historyLog, emotionCounts, sessionStart, sessionEnd } = useDetection()
  const { sessions, loading } = usePastSessions()
  const [search, setSearch] = useState('')
  const [filterEmotion, setFilterEmotion] = useState<EmotionKey | 'all'>('all')

  const filtered = useMemo(() => {
    return historyLog.filter((entry) => {
      const matchesEmotion = filterEmotion === 'all' || entry.emotion === filterEmotion
      const matchesSearch =
        search === '' ||
        entry.emotion.toLowerCase().includes(search.toLowerCase()) ||
        entry.timestamp.toLowerCase().includes(search.toLowerCase())
      return matchesEmotion && matchesSearch
    })
  }, [historyLog, filterEmotion, search])

  return (
    <div className="max-w-content mx-auto px-6 pt-8 pb-12 flex flex-col gap-8">

      {/* Past sessions */}
      {supabaseConfigured && (
        <div>
          <h2 className="text-[13px] font-semibold text-text-primary mb-3">Past Sessions</h2>
          {loading ? (
            <div className={`${card} p-5 text-[13px] text-text-muted font-mono`}>Loading...</div>
          ) : sessions.length === 0 ? (
            <div className={`${card} p-5 text-[13px] text-text-muted`}>
              No saved sessions yet — start detection to begin recording.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessions.map((s) => (
                <div key={s.id} className={`${card} p-4 flex flex-col gap-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-text-muted font-mono">
                      {new Date(s.started_at).toLocaleDateString([], {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                    <span className="text-[11px] text-text-muted font-mono">
                      {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-[13px] font-mono text-text-primary">
                        {s.ended_at ? formatDuration(s.started_at, s.ended_at) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-[13px] font-mono text-text-primary">
                        {s.total_detections}
                      </span>
                    </div>
                    {s.dominant_emotion && (
                      <div className="flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-text-muted" />
                        <span className="text-[13px] capitalize text-accent">
                          {EMOTION_LABELS[s.dominant_emotion as EmotionKey] ?? s.dominant_emotion}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Current session log */}
      <div>
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold">History</h1>
            <p className="text-[15px] text-text-secondary mt-2">
              {historyLog.length} emotion event{historyLog.length !== 1 ? 's' : ''} recorded this session.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportPDF(historyLog, emotionCounts, sessionStart, sessionEnd)}
              disabled={historyLog.length === 0}
              className="inline-flex items-center gap-1.5 px-[10px] py-[6px] text-[12px] font-medium rounded-[6px] cursor-pointer transition-colors duration-150 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileText className="w-3 h-3" />
              PDF Report
            </button>
            <button
              onClick={() => exportCSV(historyLog)}
              disabled={historyLog.length === 0}
              className="inline-flex items-center gap-1.5 px-[10px] py-[6px] text-[12px] font-medium rounded-[6px] cursor-pointer transition-colors duration-150 bg-transparent border border-border-default text-text-primary hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
            <button
              onClick={() => exportJSON(historyLog)}
              disabled={historyLog.length === 0}
              className="inline-flex items-center gap-1.5 px-[10px] py-[6px] text-[12px] font-medium rounded-[6px] cursor-pointer transition-colors duration-150 bg-transparent border border-border-default text-text-primary hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3 h-3" />
              JSON
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search by emotion or time..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-elevated border border-border-default rounded-[6px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors duration-150"
            />
          </div>

          <div className="relative flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={filterEmotion}
              onChange={(e) => setFilterEmotion(e.target.value as EmotionKey | 'all')}
              className="pl-2 pr-6 py-2 text-[13px] bg-elevated border border-border-default rounded-[6px] text-text-primary appearance-none outline-none focus:border-accent transition-colors duration-150 cursor-pointer"
            >
              <option value="all">All emotions</option>
              {ALL_EMOTIONS.map((e) => (
                <option key={e} value={e}>{EMOTION_LABELS[e]}</option>
              ))}
            </select>
          </div>

          {(search || filterEmotion !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilterEmotion('all') }}
              className="text-[12px] text-text-muted hover:text-text-primary transition-colors duration-150 cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="border border-border-subtle rounded-[6px] overflow-hidden">
          <div className="overflow-y-auto max-h-[calc(100vh-320px)]">
            <table className="w-full border-collapse">
              <thead className="bg-surface sticky top-0">
                <tr>
                  <th className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted text-left px-4 py-[10px]">Timestamp</th>
                  <th className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted text-left px-4 py-[10px]">Emotion</th>
                  <th className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted text-left px-4 py-[10px]">Confidence</th>
                  <th className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted text-left px-4 py-[10px]">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center text-text-muted text-[13px]">
                      {historyLog.length === 0
                        ? 'No events recorded yet. Start detection to begin logging.'
                        : 'No results match your filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry, i) => (
                    <tr key={i} className="hover:bg-surface transition-colors duration-100">
                      <td className="px-4 py-[10px] text-[13px] font-mono text-text-secondary border-t border-border-subtle">{entry.timestamp}</td>
                      <td className="px-4 py-[10px] text-[13px] capitalize border-t border-border-subtle">{EMOTION_LABELS[entry.emotion] ?? entry.emotion}</td>
                      <td className="px-4 py-[10px] text-[13px] font-mono border-t border-border-subtle">{entry.confidence}%</td>
                      <td className="px-4 py-[10px] text-[13px] font-mono text-text-muted border-t border-border-subtle">{entry.duration}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filtered.length > 0 && (
          <p className="text-[12px] text-text-muted mt-3">
            Showing {filtered.length} of {historyLog.length} entries
          </p>
        )}
      </div>
    </div>
  )
}
