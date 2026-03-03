/**
 * useEmotionDetection — drives the 500ms detection loop.
 *
 * Captures frames from the video element, POSTs them to the FastAPI backend,
 * and maintains a rolling history of EmotionDataPoints for the timeline chart.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import type { DetectionResult, EmotionDataPoint } from '../types'
import {
  BACKEND_URL,
  DETECTION_INTERVAL_MS,
  MAX_HISTORY_POINTS,
} from '../constants'

/** Return shape of the useEmotionDetection hook. */
interface EmotionDetectionState {
  /** Most recent detection result from the backend. */
  latestResult: DetectionResult | null
  /** Rolling history of the last MAX_HISTORY_POINTS detections. */
  history: EmotionDataPoint[]
  /** Whether the detection interval is currently running. */
  isDetecting: boolean
  /** Whether a backend request is currently in-flight. */
  isLoading: boolean
  /** Last error message from a failed request. */
  error: string | null
  /** Start the 500ms detection interval. */
  startDetection: () => void
  /** Stop the detection interval and clear the interval handle. */
  stopDetection: () => void
  /** Clear all session history and the latest result. */
  resetHistory: () => void
}

/**
 * Custom hook that manages the real-time emotion detection pipeline.
 *
 * Captures frames via a temporary canvas, sends them to /api/detect,
 * and returns the latest result plus a rolling history buffer.
 *
 * @param videoRef - Ref to the live <video> element to capture frames from.
 * @returns EmotionDetectionState
 */
export function useEmotionDetection(
  videoRef: React.RefObject<HTMLVideoElement>
): EmotionDetectionState {
  const intervalRef = useRef<number | null>(null)

  const [latestResult, setLatestResult] = useState<DetectionResult | null>(null)
  const [history, setHistory] = useState<EmotionDataPoint[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Capture a JPEG snapshot from the current video frame.
   * Uses a temporary off-screen canvas — does NOT draw to the overlay.
   *
   * @returns Base64 data URL (image/jpeg at 0.8 quality), or null if video not ready.
   */
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current
    if (
      !video ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      video.videoWidth === 0
    ) {
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8)
  }, [videoRef])

  /**
   * Send one frame to the backend and update state with the result.
   * Silently skips if no frame is available (video not ready).
   */
  const runDetection = useCallback(async (): Promise<void> => {
    const frame = captureFrame()
    if (!frame) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${BACKEND_URL}/api/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: frame }),
      })

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`)
      }

      const result: DetectionResult = await response.json()
      setLatestResult(result)

      // Only record data points when a face is actually detected
      if (result.face_detected && result.dominant) {
        const point: EmotionDataPoint = {
          timestamp: Date.now(),
          dominant: result.dominant,
          confidence: result.confidence,
          emotions: result.emotions,
        }
        setHistory((prev) => [
          ...prev.slice(-MAX_HISTORY_POINTS + 1),
          point,
        ])
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Detection request failed'
      console.error('Detection error:', err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [captureFrame])

  /** Start the detection interval. No-op if already running. */
  const startDetection = useCallback((): void => {
    if (intervalRef.current !== null) return
    setIsDetecting(true)
    // Run once immediately, then on interval
    runDetection()
    intervalRef.current = window.setInterval(runDetection, DETECTION_INTERVAL_MS)
  }, [runDetection])

  /** Stop the detection interval and clear the handle. */
  const stopDetection = useCallback((): void => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsDetecting(false)
    setIsLoading(false)
  }, [])

  /** Clear all session data (history and latest result). */
  const resetHistory = useCallback((): void => {
    setHistory([])
    setLatestResult(null)
    setError(null)
  }, [])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    latestResult,
    history,
    isDetecting,
    isLoading,
    error,
    startDetection,
    stopDetection,
    resetHistory,
  }
}
