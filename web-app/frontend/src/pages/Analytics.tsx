/**
 * Analytics — session data visualization at /analytics.
 *
 * Reads the last session from localStorage (key: 'emovision_last_session')
 * and renders: emotion distribution doughnut, confidence timeline, and a
 * per-emotion frequency table.
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Doughnut, Line } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { FadeUpSection } from '../components/FadeUpSection'
import { GlowCard } from '../components/GlowCard'
import { EmotionBadge } from '../components/EmotionBadge'
import {
  EMOTION_COLORS,
  EMOTION_LABELS,
  EMOTION_EMOJIS,
  CHART_GRID_COLOR,
  CHART_TEXT_COLOR,
  COLOR_SURFACE,
  ALL_EMOTION_KEYS,
} from '../constants'
import type { EmotionDataPoint, EmotionKey } from '../types'

const SESSION_KEY = 'emovision_last_session'

function loadSession(): EmotionDataPoint[] {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as EmotionDataPoint[]) : []
  } catch {
    return []
  }
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function Analytics() {
  const history = useMemo(() => loadSession(), [])

  // ── Derived stats ─────────────────────────────────────────────────────────
  const emotionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const pt of history) {
      counts[pt.dominant] = (counts[pt.dominant] ?? 0) + 1
    }
    return counts
  }, [history])

  const emotionAvgConf = useMemo(() => {
    const sums: Record<string, number> = {}
    const counts: Record<string, number> = {}
    for (const pt of history) {
      sums[pt.dominant] = (sums[pt.dominant] ?? 0) + pt.confidence
      counts[pt.dominant] = (counts[pt.dominant] ?? 0) + 1
    }
    const result: Record<string, number> = {}
    for (const k of Object.keys(sums)) {
      result[k] = sums[k] / counts[k]
    }
    return result
  }, [history])

  const detectedEmotions = useMemo(
    () =>
      ALL_EMOTION_KEYS.filter((e) => (emotionCounts[e] ?? 0) > 0).sort(
        (a, b) => (emotionCounts[b] ?? 0) - (emotionCounts[a] ?? 0)
      ),
    [emotionCounts]
  )

  const sessionDuration =
    history.length > 1
      ? history[history.length - 1].timestamp - history[0].timestamp
      : 0

  const dominantEmotion: EmotionKey | null =
    detectedEmotions.length > 0 ? detectedEmotions[0] : null

  // ── Doughnut chart ─────────────────────────────────────────────────────────
  const doughnutData: ChartData<'doughnut'> = useMemo(() => {
    const labels = detectedEmotions.map(
      (e) => `${EMOTION_EMOJIS[e] ?? ''} ${EMOTION_LABELS[e] ?? e}`
    )
    const data = detectedEmotions.map((e) => emotionCounts[e] ?? 0)
    const colors = detectedEmotions.map((e) => EMOTION_COLORS[e] ?? '#6b7280')
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.map((c) => c + 'cc'),
          borderColor: colors,
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }
  }, [detectedEmotions, emotionCounts])

  const doughnutOptions: ChartOptions<'doughnut'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: CHART_TEXT_COLOR,
            font: { family: '"JetBrains Mono", monospace', size: 11 },
            padding: 12,
            boxWidth: 12,
            boxHeight: 12,
          },
        },
        tooltip: {
          backgroundColor: COLOR_SURFACE,
          borderColor: '#1e1e2e',
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor: CHART_TEXT_COLOR,
          callbacks: {
            label: (ctx) =>
              ` ${ctx.parsed} detections (${Math.round((ctx.parsed / history.length) * 100)}%)`,
          },
        },
      },
    }),
    [history.length]
  )

  // ── Confidence timeline ────────────────────────────────────────────────────
  const lineData: ChartData<'line'> = useMemo(() => {
    const step = Math.max(1, Math.floor(history.length / 6))
    const labels = history.map((pt, i) =>
      i % step === 0 || i === history.length - 1 ? formatTime(pt.timestamp) : ''
    )
    const lineColor =
      dominantEmotion ? (EMOTION_COLORS[dominantEmotion] ?? '#3b82f6') : '#3b82f6'
    return {
      labels,
      datasets: [
        {
          label: 'Confidence',
          data: history.map((pt) => Math.round(pt.confidence * 100)),
          borderColor: lineColor,
          backgroundColor: lineColor + '18',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35,
          fill: true,
        },
      ],
    }
  }, [history, dominantEmotion])

  const lineOptions: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: COLOR_SURFACE,
          borderColor: '#1e1e2e',
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor: CHART_TEXT_COLOR,
          callbacks: { label: (ctx) => ` ${ctx.parsed.y}% confidence` },
        },
      },
      scales: {
        x: {
          grid: { color: CHART_GRID_COLOR },
          ticks: { color: CHART_TEXT_COLOR, font: { size: 10 }, maxRotation: 0 },
          border: { color: CHART_GRID_COLOR },
        },
        y: {
          min: 0,
          grid: { color: CHART_GRID_COLOR },
          ticks: {
            color: CHART_TEXT_COLOR,
            font: { size: 11 },
            callback: (v) => `${v}%`,
            maxTicksLimit: 5,
          },
          border: { color: CHART_GRID_COLOR },
        },
      },
    }),
    []
  )

  // ── Empty state ────────────────────────────────────────────────────────────
  if (history.length === 0) {
    return (
      <div className="min-h-screen bg-background text-white font-sans flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <p className="text-5xl mb-5">📊</p>
          <h2 className="text-xl font-bold mb-3">No session data yet</h2>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Run a detection session first. Data is saved automatically when you stop detection.
          </p>
          <Link
            to="/detect"
            className="inline-block px-6 py-2.5 bg-accent hover:bg-accent-light text-white font-medium rounded-xl transition-colors"
          >
            Go to Detect →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <main className="px-4 md:px-6 py-8 max-w-screen-2xl mx-auto space-y-6">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <FadeUpSection>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-accent mb-1">
                Session Analytics
              </p>
              <h1 className="text-2xl font-black tracking-tight">Last Session</h1>
              <p className="text-sm text-white/40 font-mono mt-1">
                {history.length} detections · {formatDuration(sessionDuration)} duration ·{' '}
                {history.length > 0 ? formatTime(history[0].timestamp) : '—'}
              </p>
            </div>
            {dominantEmotion && (
              <EmotionBadge emotion={dominantEmotion} size="lg" />
            )}
          </div>
        </FadeUpSection>

        {/* ── Summary stat cards ─────────────────────────────────────────── */}
        <FadeUpSection delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Detections',
                value: history.length.toString(),
                sub: 'frames analyzed',
              },
              {
                label: 'Dominant Emotion',
                value: dominantEmotion
                  ? `${EMOTION_EMOJIS[dominantEmotion] ?? ''} ${EMOTION_LABELS[dominantEmotion]}`
                  : '—',
                sub: dominantEmotion
                  ? `${Math.round(((emotionCounts[dominantEmotion] ?? 0) / history.length) * 100)}% of session`
                  : '',
              },
              {
                label: 'Session Duration',
                value: formatDuration(sessionDuration),
                sub: 'active detection time',
              },
              {
                label: 'Emotions Seen',
                value: detectedEmotions.length.toString(),
                sub: `of 5 total classes`,
              },
            ].map((s, i) => (
              <FadeUpSection key={s.label} delay={0.08 * i}>
                <GlowCard className="p-4">
                  <p className="text-xs font-mono text-white/40 uppercase tracking-wider mb-2">
                    {s.label}
                  </p>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs font-mono text-white/30 mt-1">{s.sub}</p>
                </GlowCard>
              </FadeUpSection>
            ))}
          </div>
        </FadeUpSection>

        {/* ── Charts row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Doughnut */}
          <FadeUpSection delay={0.1} className="lg:col-span-2">
            <GlowCard className="p-5 h-full">
              <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">
                Emotion Distribution
              </p>
              <div className="h-52">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </GlowCard>
          </FadeUpSection>

          {/* Confidence timeline */}
          <FadeUpSection delay={0.12} className="lg:col-span-3">
            <GlowCard className="p-5 h-full">
              <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">
                Confidence Over Time
              </p>
              <div className="h-52">
                {history.length > 1 ? (
                  <Line data={lineData} options={lineOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-white/30 text-sm font-mono">
                    Not enough data points
                  </div>
                )}
              </div>
            </GlowCard>
          </FadeUpSection>
        </div>

        {/* ── Per-emotion breakdown table ─────────────────────────────────── */}
        <FadeUpSection delay={0.14}>
          <GlowCard className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-mono uppercase tracking-widest text-white/40">
                Per-Emotion Breakdown
              </p>
            </div>
            <div className="divide-y divide-border">
              {detectedEmotions.map((emotion) => {
                const count = emotionCounts[emotion] ?? 0
                const pct = Math.round((count / history.length) * 100)
                const avgConf = Math.round((emotionAvgConf[emotion] ?? 0) * 100)
                const color = EMOTION_COLORS[emotion] ?? '#6b7280'
                return (
                  <div
                    key={emotion}
                    className="flex items-center gap-4 px-5 py-3"
                  >
                    <span className="text-xl w-7 text-center">
                      {EMOTION_EMOJIS[emotion] ?? ''}
                    </span>
                    <span className="text-sm font-medium w-20 text-white/80">
                      {EMOTION_LABELS[emotion] ?? emotion}
                    </span>
                    <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-xs font-mono w-8 text-right" style={{ color }}>
                      {pct}%
                    </span>
                    <span className="text-xs font-mono text-white/30 w-20 text-right">
                      {count} frames
                    </span>
                    <span className="text-xs font-mono text-white/30 w-20 text-right hidden md:block">
                      avg {avgConf}% conf
                    </span>
                  </div>
                )
              })}
            </div>
          </GlowCard>
        </FadeUpSection>

      </main>

      <footer className="border-t border-border px-6 py-3 text-center mt-8">
        <p className="text-xs text-white/25 font-mono">
          Session data stored locally · not uploaded anywhere
        </p>
      </footer>
    </div>
  )
}
