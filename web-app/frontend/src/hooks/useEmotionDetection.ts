import { useState, useRef, useCallback, useEffect } from 'react'
import type { DetectionResult, EmotionDataPoint } from '../types'
import {
  BACKEND_URL,
  DETECTION_INTERVAL_MS,
  MAX_HISTORY_POINTS,
} from '../constants'

interface EmotionDetectionState {
  latestResult: DetectionResult | null
  history: EmotionDataPoint[]
  isDetecting: boolean
  isLoading: boolean
  error: string | null
  startDetection: () => void
  stopDetection: () => void
  resetHistory: () => void
}

export function useEmotionDetection(
  videoRef: React.RefObject<HTMLVideoElement>
): EmotionDetectionState {
  const intervalRef = useRef<number | null>(null)

  const [latestResult, setLatestResult] = useState<DetectionResult | null>(null)
  const [history, setHistory] = useState<EmotionDataPoint[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Grab a JPEG frame from the video element via an offscreen canvas
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

  const startDetection = useCallback((): void => {
    if (intervalRef.current !== null) return
    setIsDetecting(true)
    runDetection()
    intervalRef.current = window.setInterval(runDetection, DETECTION_INTERVAL_MS)
  }, [runDetection])

  const stopDetection = useCallback((): void => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsDetecting(false)
    setIsLoading(false)
  }, [])

  const resetHistory = useCallback((): void => {
    setHistory([])
    setLatestResult(null)
    setError(null)
  }, [])

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
