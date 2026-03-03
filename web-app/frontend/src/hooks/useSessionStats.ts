/**
 * useSessionStats — computes aggregated session statistics from detection history.
 *
 * Recalculates every SESSION_STATS_INTERVAL_MS using a setInterval,
 * so it doesn't recompute on every single 500ms detection tick.
 */

import { useState, useEffect, useCallback } from 'react'
import type { EmotionDataPoint, SessionStats, EmotionKey } from '../types'
import { SESSION_STATS_INTERVAL_MS } from '../constants'

/**
 * Compute full session statistics from the current detection history.
 *
 * @param history - Array of all EmotionDataPoints recorded this session.
 * @param sessionStartMs - Unix timestamp (ms) when the session started.
 * @returns A populated SessionStats object.
 */
function computeStats(
  history: EmotionDataPoint[],
  sessionStartMs: number
): SessionStats {
  const now = Date.now()
  const sessionDurationSeconds = Math.floor((now - sessionStartMs) / 1000)
  const totalDetections = history.length

  if (totalDetections === 0) {
    return {
      dominantEmotion: null,
      dominantPercentage: 0,
      volatilityScore: 0,
      currentStreakSeconds: 0,
      currentStreakEmotion: null,
      sessionDurationSeconds,
      totalDetections: 0,
      happiestMoment: null,
      peakHappiness: 0,
    }
  }

  // ── Dominant emotion (most frequent) ──────────────────────────────────────
  const emotionCounts: Record<string, number> = {}
  for (const point of history) {
    emotionCounts[point.dominant] = (emotionCounts[point.dominant] ?? 0) + 1
  }
  const dominantEmotion = Object.entries(emotionCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0] as EmotionKey
  const dominantPercentage = Math.round(
    (emotionCounts[dominantEmotion] / totalDetections) * 100
  )

  // ── Volatility: fraction of consecutive pairs where emotion changed ────────
  let changes = 0
  for (let i = 1; i < history.length; i++) {
    if (history[i].dominant !== history[i - 1].dominant) changes++
  }
  const volatilityScore =
    history.length > 1
      ? parseFloat((changes / (history.length - 1)).toFixed(2))
      : 0

  // ── Current streak ─────────────────────────────────────────────────────────
  const currentStreakEmotion = history[history.length - 1].dominant
  let streakCount = 0
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].dominant === currentStreakEmotion) {
      streakCount++
    } else {
      break
    }
  }
  // Each detection is ~500ms apart
  const currentStreakSeconds = Math.round(
    (streakCount * 500) / 1000
  )

  // ── Happiest moment ────────────────────────────────────────────────────────
  let happiestMoment: number | null = null
  let peakHappiness = 0
  for (const point of history) {
    const happinessScore = point.emotions['happy'] ?? 0
    if (happinessScore > peakHappiness) {
      peakHappiness = happinessScore
      happiestMoment = point.timestamp
    }
  }

  return {
    dominantEmotion,
    dominantPercentage,
    volatilityScore,
    currentStreakSeconds,
    currentStreakEmotion,
    sessionDurationSeconds,
    totalDetections,
    happiestMoment,
    peakHappiness: parseFloat(peakHappiness.toFixed(2)),
  }
}

/**
 * Custom hook for computing and periodically refreshing session statistics.
 *
 * @param history - Detection history from useEmotionDetection.
 * @param isActive - Whether a session is currently in progress.
 * @returns Current SessionStats and the session start timestamp.
 */
export function useSessionStats(
  history: EmotionDataPoint[],
  isActive: boolean
): { stats: SessionStats; sessionStartMs: number } {
  const [sessionStartMs] = useState<number>(() => Date.now())

  const [stats, setStats] = useState<SessionStats>(() =>
    computeStats([], sessionStartMs)
  )

  /** Recompute stats from current history snapshot. */
  const refresh = useCallback((): void => {
    setStats(computeStats(history, sessionStartMs))
  }, [history, sessionStartMs])

  // Refresh immediately when history changes length (new data point)
  useEffect(() => {
    if (history.length > 0) {
      refresh()
    }
  }, [history.length, refresh])

  // Also refresh on a timer while session is active
  useEffect(() => {
    if (!isActive) return
    const timer = window.setInterval(refresh, SESSION_STATS_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [isActive, refresh])

  return { stats, sessionStartMs }
}
