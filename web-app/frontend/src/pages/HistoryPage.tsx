import { useState, useMemo } from 'react'
import { Download, Search, Filter } from 'lucide-react'
import { useDetection } from '@/contexts/DetectionContext'
import { EMOTION_LABELS, ALL_EMOTIONS } from '@/constants'
import type { EmotionKey } from '@/constants'

function exportCSV(log: ReturnType<typeof useDetection>['historyLog']) {
  if (log.length === 0) return
  const header = 'Timestamp,Emotion,Confidence,Duration\n'
  const rows = log.map((e) => `${e.timestamp},${e.emotion},${e.confidence}%,${e.duration}`).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `emovision-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportJSON(log: ReturnType<typeof useDetection>['historyLog']) {
  if (log.length === 0) return
  const data = {
    exported_at: new Date().toISOString(),
    total_entries: log.length,
    entries: log,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `emovision-log-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function HistoryPage() {
  const { historyLog } = useDetection()
  const [search, setSearch] = useState('')
  const [filterEmotion, setFilterEmotion] = useState<EmotionKey | 'all'>('all')

  const filtered = useMemo(() => {
    return historyLog.filter((entry) => {
      const matchesEmotion = filterEmotion === 'all' || entry.emotion === filterEmotion
      const matchesSearch = search === '' ||
        entry.emotion.toLowerCase().includes(search.toLowerCase()) ||
        entry.timestamp.toLowerCase().includes(search.toLowerCase())
      return matchesEmotion && matchesSearch
    })
  }, [historyLog, filterEmotion, search])

  return (
    <div className="max-w-content mx-auto px-6 pt-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="text-[15px] text-text-secondary mt-2">
            {historyLog.length} emotion event{historyLog.length !== 1 ? 's' : ''} recorded this session.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
                <th className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted text-left px-4 py-[10px]">
                  Timestamp
                </th>
                <th className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted text-left px-4 py-[10px]">
                  Emotion
                </th>
                <th className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted text-left px-4 py-[10px]">
                  Confidence
                </th>
                <th className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted text-left px-4 py-[10px]">
                  Duration
                </th>
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
                    <td className="px-4 py-[10px] text-[13px] font-mono text-text-secondary border-t border-border-subtle">
                      {entry.timestamp}
                    </td>
                    <td className="px-4 py-[10px] text-[13px] capitalize border-t border-border-subtle">
                      {EMOTION_LABELS[entry.emotion] ?? entry.emotion}
                    </td>
                    <td className="px-4 py-[10px] text-[13px] font-mono border-t border-border-subtle">
                      {entry.confidence}%
                    </td>
                    <td className="px-4 py-[10px] text-[13px] font-mono text-text-muted border-t border-border-subtle">
                      {entry.duration}
                    </td>
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
  )
}
