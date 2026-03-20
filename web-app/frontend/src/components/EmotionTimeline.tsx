import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import type { ChartOptions, ChartData } from 'chart.js'
import type { EmotionDataPoint } from '../types'
import {
  EMOTION_COLORS,
  EMOTION_LABELS,
  CHART_TEXT_COLOR,
  CHART_GRID_COLOR,
  COLOR_SURFACE,
} from '../constants'

interface EmotionTimelineProps {
  history: EmotionDataPoint[]
}

const MAX_VISIBLE_LABELS = 6

function formatRelativeTime(timestamp: number, now: number): string {
  const seconds = Math.round((now - timestamp) / 1000)
  if (seconds <= 0) return 'now'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

export function EmotionTimeline({ history }: EmotionTimelineProps) {
  const lineColor = useMemo(() => {
    if (history.length === 0) return '#3b82f6'
    const last = history[history.length - 1]
    return EMOTION_COLORS[last.dominant] ?? '#3b82f6'
  }, [history])

  const chartData: ChartData<'line'> = useMemo(() => {
    const now = Date.now()
    const step = Math.max(1, Math.floor(history.length / MAX_VISIBLE_LABELS))

    const labels = history.map((point, i) =>
      i % step === 0 || i === history.length - 1
        ? formatRelativeTime(point.timestamp, now)
        : ''
    )

    const values = history.map((point) =>
      Math.round(point.confidence * 100)
    )

    return {
      labels,
      datasets: [
        {
          label: 'Confidence',
          data: values,
          borderColor: lineColor,
          backgroundColor: lineColor + '22',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.35,
          fill: true,
        },
      ],
    }
  }, [history, lineColor])

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 150 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: COLOR_SURFACE,
          borderColor: '#1e1e2e',
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor: '#9ca3af',
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y}% confidence`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: CHART_GRID_COLOR },
          ticks: {
            color: CHART_TEXT_COLOR,
            font: { family: '"JetBrains Mono", monospace', size: 10 },
            maxRotation: 0,
          },
          border: { color: CHART_GRID_COLOR },
        },
        y: {
          min: 0,
          grid: { color: CHART_GRID_COLOR },
          ticks: {
            color: CHART_TEXT_COLOR,
            font: { family: '"JetBrains Mono", monospace', size: 11 },
            callback: (val) => `${val}%`,
            maxTicksLimit: 5,
          },
          border: { color: CHART_GRID_COLOR },
        },
      },
    }),
    []
  )

  const currentEmotion =
    history.length > 0 ? history[history.length - 1].dominant : null

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Confidence Timeline
        </h2>
        <div className="flex items-center gap-2">
          {currentEmotion && (
            <span className="text-xs font-mono text-white/50">
              {EMOTION_LABELS[currentEmotion] ?? currentEmotion}
            </span>
          )}
          <span className="text-xs font-mono text-white/30">
            {history.length} pts
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {history.length > 1 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/25 text-sm font-mono">
              {history.length === 0
                ? 'Start detection to see timeline…'
                : 'Collecting data…'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
