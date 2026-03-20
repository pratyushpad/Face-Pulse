import { useMemo } from 'react'
import type { SessionStats } from '../types'
import {
  EMOTION_COLORS,
  EMOTION_LABELS,
  EMOTION_EMOJIS,
} from '../constants'

interface SessionSummaryProps {
  stats: SessionStats
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.round((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ago`
}

function StatCard({
  label,
  value,
  sub,
  accentColor,
}: {
  label: string
  value: string
  sub?: string
  accentColor?: string
}) {
  return (
    <div
      className="rounded-lg bg-background border border-border p-3 hover:shadow-glow transition-shadow duration-300"
      style={accentColor ? { borderColor: accentColor + '40' } : undefined}
    >
      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className="text-base font-semibold font-mono truncate"
        style={accentColor ? { color: accentColor } : { color: '#ffffff' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs text-white/40 mt-0.5 truncate">{sub}</p>
      )}
    </div>
  )
}

export function SessionSummary({ stats }: SessionSummaryProps) {
  const isEmpty = stats.totalDetections === 0

  const dominantColor = useMemo(
    () =>
      stats.dominantEmotion
        ? (EMOTION_COLORS[stats.dominantEmotion] ?? '#3b82f6')
        : '#3b82f6',
    [stats.dominantEmotion]
  )

  const streakColor = useMemo(
    () =>
      stats.currentStreakEmotion
        ? (EMOTION_COLORS[stats.currentStreakEmotion] ?? '#6b7280')
        : '#6b7280',
    [stats.currentStreakEmotion]
  )

  if (isEmpty) {
    return (
      <div className="h-full flex flex-col">
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">
          Session Summary
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/25 text-sm font-mono text-center">
            Start detection to<br />see session stats
          </p>
        </div>
      </div>
    )
  }

  const dominantLabel = stats.dominantEmotion
    ? `${EMOTION_EMOJIS[stats.dominantEmotion] ?? ''} ${EMOTION_LABELS[stats.dominantEmotion] ?? stats.dominantEmotion}`
    : '—'

  const streakLabel = stats.currentStreakEmotion
    ? `${EMOTION_EMOJIS[stats.currentStreakEmotion] ?? ''} ${EMOTION_LABELS[stats.currentStreakEmotion] ?? stats.currentStreakEmotion}`
    : '—'

  const volatilityDescription =
    stats.volatilityScore < 0.2
      ? 'Very stable'
      : stats.volatilityScore < 0.4
      ? 'Fairly stable'
      : stats.volatilityScore < 0.6
      ? 'Moderate'
      : stats.volatilityScore < 0.8
      ? 'Volatile'
      : 'Very volatile'

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Session Summary
        </h2>
        <span className="text-xs font-mono text-white/30">
          {stats.totalDetections} detections
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1 content-start">
        <StatCard
          label="Dominant Emotion"
          value={dominantLabel}
          sub={`${stats.dominantPercentage}% of session`}
          accentColor={dominantColor}
        />

        <StatCard
          label="Volatility"
          value={`${(stats.volatilityScore * 100).toFixed(0)}%`}
          sub={volatilityDescription}
          accentColor="#f59e0b"
        />

        <StatCard
          label="Current Streak"
          value={formatDuration(stats.currentStreakSeconds)}
          sub={streakLabel}
          accentColor={streakColor}
        />

        <StatCard
          label="Session Duration"
          value={formatDuration(stats.sessionDurationSeconds)}
          sub={`${stats.totalDetections} total`}
          accentColor="#3b82f6"
        />

        {stats.happiestMoment !== null && (
          <StatCard
            label="Happiest Moment"
            value={`${(stats.peakHappiness * 100).toFixed(0)}% happy`}
            sub={formatTimeAgo(stats.happiestMoment)}
            accentColor={EMOTION_COLORS['happy']}
          />
        )}
      </div>
    </div>
  )
}
