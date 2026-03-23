import { useMemo, useState, useEffect } from 'react'
import { Line, Doughnut } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import {
  ALL_EMOTIONS,
  EMOTION_LABELS,
  CHART_GRID,
  CHART_TICK,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
  COLOR,
} from '@/constants'
import type { TimelinePoint } from '@/types'

interface AnalyticsPanelProps {
  sessionStart: number | null
  sessionEnd: number | null
  totalDetections: number
  emotionCounts: Record<string, number>
  timelineData: TimelinePoint[]
  isDetecting: boolean
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const sec = String(s % 60).padStart(2, '0')
  const min = String(m % 60).padStart(2, '0')
  if (h > 0) return `${h}:${min}:${sec}`
  return `${min}:${sec}`
}

const card = 'bg-surface border border-border-subtle rounded-[12px] p-5'

export function AnalyticsPanel({
  sessionStart,
  sessionEnd,
  totalDetections,
  emotionCounts,
  timelineData,
  isDetecting,
}: AnalyticsPanelProps) {
  // Tick every second while detecting so the timer counts up live
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!isDetecting) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [isDetecting])

  // During detection: live count-up. After stop: frozen at final duration. Never started: 0.
  const elapsed = sessionStart
    ? (isDetecting ? Date.now() : (sessionEnd ?? sessionStart)) - sessionStart
    : 0

  const dominant = useMemo(() => {
    const entries = Object.entries(emotionCounts).filter(([, v]) => v > 0)
    if (entries.length === 0) return null
    entries.sort((a, b) => b[1] - a[1])
    return entries[0][0]
  }, [emotionCounts])

  const timelineChartData: ChartData<'line'> = useMemo(() => {
    const recent = timelineData.slice(-60)
    return {
      labels: recent.map((d) =>
        new Date(d.time).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })
      ),
      datasets: ALL_EMOTIONS.map((e) => ({
        label: EMOTION_LABELS[e],
        data: recent.map((d) => (d.emotion === e ? d.confidence : 0)),
        borderColor: e === dominant ? COLOR.accent : 'rgba(255,255,255,0.12)',
        borderWidth: e === dominant ? 2 : 1,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      })),
    }
  }, [timelineData, dominant])

  const timelineOptions: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: CHART_TOOLTIP_BG,
          titleColor: COLOR.textPrimary,
          bodyColor: COLOR.textSecondary,
          borderColor: CHART_TOOLTIP_BORDER,
          borderWidth: 1,
          titleFont: { family: 'Inter' },
          bodyFont: { family: '"JetBrains Mono"', size: 11 },
          padding: 10,
        },
      },
      scales: {
        x: {
          grid: { color: CHART_GRID },
          ticks: { color: CHART_TICK, font: { family: '"JetBrains Mono"', size: 10 }, maxTicksLimit: 6 },
        },
        y: {
          min: 0,
          max: 1,
          grid: { color: CHART_GRID },
          ticks: {
            color: CHART_TICK,
            font: { family: '"JetBrains Mono"', size: 10 },
            callback: (v) => `${Math.round(Number(v) * 100)}%`,
            stepSize: 0.25,
          },
        },
      },
    }),
    []
  )

  const donutData: ChartData<'doughnut'> = useMemo(() => {
    const counts = ALL_EMOTIONS.map((e) => emotionCounts[e] || 0)
    return {
      labels: ALL_EMOTIONS.map((e) => EMOTION_LABELS[e]),
      datasets: [
        {
          data: counts,
          backgroundColor: ALL_EMOTIONS.map((e) =>
            e === dominant ? COLOR.accent : 'rgba(255,255,255,0.08)'
          ),
          borderColor: 'rgba(255,255,255,0.03)',
          borderWidth: 1,
          hoverOffset: 4,
        },
      ],
    }
  }, [emotionCounts, dominant])

  const donutOptions: ChartOptions<'doughnut'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      animation: false,
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            color: COLOR.textSecondary,
            font: { family: 'Inter', size: 11 },
            boxWidth: 10,
            boxHeight: 10,
            padding: 8,
          },
        },
        tooltip: {
          backgroundColor: CHART_TOOLTIP_BG,
          titleColor: COLOR.textPrimary,
          bodyColor: COLOR.textSecondary,
          borderColor: CHART_TOOLTIP_BORDER,
          borderWidth: 1,
          bodyFont: { family: '"JetBrains Mono"', size: 11 },
          padding: 10,
        },
      },
    }),
    []
  )

  const maxCount = Math.max(...Object.values(emotionCounts), 1)

  return (
    <div className="flex flex-col gap-4">

      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Duration */}
        <div className={card}>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Duration
          </span>
          <div className="text-[28px] font-semibold font-mono tracking-tight mt-2 text-text-primary">
            {formatTime(elapsed)}
          </div>
        </div>

        {/* Detections */}
        <div className={card}>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Detections
          </span>
          <div className="text-[28px] font-semibold font-mono tracking-tight mt-2 text-text-primary">
            {totalDetections}
          </div>
        </div>

        {/* Dominant emotion */}
        <div className={`${card} md:col-span-2`}>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Dominant Emotion
          </span>
          <div className="text-[28px] font-semibold mt-2 capitalize text-accent">
            {dominant ? EMOTION_LABELS[dominant as keyof typeof EMOTION_LABELS] : '—'}
          </div>
        </div>
      </div>

      {/* Row 2: Timeline */}
      <div className={card}>
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
          Emotion Timeline
        </span>
        <div className="relative w-full h-[200px] mt-4">
          {timelineData.length > 1 ? (
            <Line data={timelineChartData} options={timelineOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-[13px] font-mono">
              Collecting data...
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Donut + Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Session distribution */}
        <div className={card}>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Session Distribution
          </span>
          <div className="relative w-full h-[180px] mt-4">
            {totalDetections > 0 ? (
              <Doughnut data={donutData} options={donutOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-[13px] font-mono">
                No data yet
              </div>
            )}
          </div>
        </div>

        {/* Expressions table */}
        <div className={card}>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Expressions Detected
          </span>
          <table className="w-full mt-3 border-collapse">
            <thead>
              <tr>
                <th className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted text-left py-2 border-b border-border-subtle">
                  Emotion
                </th>
                <th className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted text-right py-2 border-b border-border-subtle">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {ALL_EMOTIONS.map((e) => {
                const count = emotionCounts[e] || 0
                const barWidth = Math.round((count / maxCount) * 60)
                const isDom = e === dominant
                return (
                  <tr key={e}>
                    <td className="py-2 text-[13px] capitalize border-b border-border-subtle text-text-secondary">
                      {EMOTION_LABELS[e]}
                    </td>
                    <td className="py-2 text-[13px] font-mono text-text-secondary text-right border-b border-border-subtle">
                      {count}
                      <span
                        className={`inline-block h-[3px] rounded-[1px] align-middle ml-2 transition-[width] duration-300 ease-out ${isDom ? 'bg-accent' : 'bg-text-muted'}`}
                        style={{ width: `${barWidth}px` }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
