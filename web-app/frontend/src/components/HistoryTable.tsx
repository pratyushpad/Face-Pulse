import { Download } from 'lucide-react'
import { EMOTION_LABELS } from '../constants'
import type { HistoryEntry } from '../types'

interface HistoryTableProps {
  historyLog: HistoryEntry[]
}

function exportCSV(log: HistoryEntry[]) {
  if (log.length === 0) return
  const header = 'Timestamp,Emotion,Confidence,Duration\n'
  const rows = log
    .map((e) => `${e.timestamp},${e.emotion},${e.confidence}%,${e.duration}`)
    .join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `facepulse-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function HistoryTable({ historyLog }: HistoryTableProps) {
  return (
    <section className="mt-12" id="history">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">History</h2>
        <button
          onClick={() => exportCSV(historyLog)}
          disabled={historyLog.length === 0}
          className="inline-flex items-center gap-1.5 px-[10px] py-[6px] text-[12px] font-medium rounded-[6px] cursor-pointer transition-colors duration-150 bg-transparent border border-border-default text-text-primary hover:bg-hover-overlay disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3 h-3" />
          Export CSV
        </button>
      </div>

      <div className="border border-border-subtle rounded-[6px] overflow-hidden">
        <div className="max-h-[320px] overflow-y-auto">
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
              {historyLog.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-text-muted text-[13px]">
                    No emotion events recorded yet. Start detection to begin logging.
                  </td>
                </tr>
              ) : (
                historyLog.map((entry, i) => (
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
    </section>
  )
}
