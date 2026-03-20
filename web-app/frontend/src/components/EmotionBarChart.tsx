import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import type { ChartOptions, ChartData } from 'chart.js'
import type { DetectionResult } from '../types'
import {
  EMOTION_COLORS,
  EMOTION_LABELS,
  CHART_TEXT_COLOR,
  CHART_GRID_COLOR,
  COLOR_SURFACE,
} from '../constants'

interface EmotionBarChartProps {
  latestResult: DetectionResult | null
}

export function EmotionBarChart({ latestResult }: EmotionBarChartProps) {
  const chartData: ChartData<'bar'> = useMemo(() => {
    const emotions = latestResult?.emotions ?? {}
    const dominant = latestResult?.dominant ?? ''

    const keys = Object.keys(emotions)
    const labels = keys.map((k) => EMOTION_LABELS[k] ?? k)
    const values = keys.map((k) => Math.round((emotions[k as keyof typeof emotions] ?? 0) * 100))

    const backgroundColors = keys.map((k) => {
      const base = EMOTION_COLORS[k] ?? '#6b7280'
      return k === dominant ? base : base + '99'
    })

    const borderColors = keys.map((k) => EMOTION_COLORS[k] ?? '#6b7280')

    return {
      labels,
      datasets: [
        {
          label: 'Confidence',
          data: values,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 44,
        },
      ],
    }
  }, [latestResult])

  const options: ChartOptions<'bar'> = useMemo(
    () => ({
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 250,
        easing: 'easeInOutQuart',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: COLOR_SURFACE,
          borderColor: '#1e1e2e',
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor: '#9ca3af',
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.x}%`,
          },
        },
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: { color: CHART_GRID_COLOR },
          ticks: {
            color: CHART_TEXT_COLOR,
            font: { family: '"JetBrains Mono", monospace', size: 11 },
            callback: (val) => `${val}%`,
          },
          border: { color: CHART_GRID_COLOR },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: CHART_TEXT_COLOR,
            font: { family: 'Inter, sans-serif', size: 13 },
          },
          border: { color: CHART_GRID_COLOR },
        },
      },
    }),
    []
  )

  const hasFace = latestResult?.face_detected === true

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Emotion Scores
        </h2>
        {hasFace && latestResult?.dominant ? (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-mono font-medium text-white"
            style={{
              backgroundColor:
                (EMOTION_COLORS[latestResult.dominant] ?? '#3b82f6') + 'cc',
            }}
          >
            {EMOTION_LABELS[latestResult.dominant] ?? latestResult.dominant}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-mono text-white/30 bg-white/5">
            No face
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {hasFace ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/25 text-sm font-mono">
              Waiting for face detection…
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
