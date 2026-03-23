import { useState, useRef, useCallback, useEffect } from 'react'
import {
  MODEL_URL,
  DETECTION_INTERVAL_MS,
  TIMELINE_SAMPLE_MS,
  MAX_TIMELINE_POINTS,
  SENSITIVITY_MAP,
  INPUT_SIZE_MAP,
  ALL_EMOTIONS,
} from '../constants'
import type { EmotionKey } from '../constants'
import type { DetectionResult, TimelinePoint, HistoryEntry, AppSettings } from '../types'

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = (ms / 1000).toFixed(1)
  if (Number(s) < 60) return `${s}s`
  const m = Math.floor(ms / 60000)
  const rem = Math.round((ms % 60000) / 1000)
  return `${m}m ${rem}s`
}

const SESSION_WARN_MS = 5 * 60 * 1000   // 5 minutes
const SESSION_MAX_MS  = 10 * 60 * 1000  // 10 minutes

interface FaceDetectionState {
  modelsLoaded: boolean
  loadingProgress: number
  loadingMessage: string
  loadError: string | null
  latestResult: DetectionResult | null
  faceDetected: boolean
  isDetecting: boolean
  emotionCounts: Record<string, number>
  timelineData: TimelinePoint[]
  historyLog: HistoryEntry[]
  totalDetections: number
  sessionStart: number | null
  sessionEnd: number | null
  sessionWarning: string | null
  fps: number
  latency: number
  startDetection: () => void
  stopDetection: () => void
  resetSession: () => void
}

export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  settings: AppSettings
): FaceDetectionState {
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('Initializing...')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [latestResult, setLatestResult] = useState<DetectionResult | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [emotionCounts, setEmotionCounts] = useState<Record<string, number>>({})
  const [timelineData, setTimelineData] = useState<TimelinePoint[]>([])
  const [historyLog, setHistoryLog] = useState<HistoryEntry[]>([])
  const [totalDetections, setTotalDetections] = useState(0)
  const [sessionStart, setSessionStart] = useState<number | null>(null)
  const [sessionEnd, setSessionEnd] = useState<number | null>(null)
  const [sessionWarning, setSessionWarning] = useState<string | null>(null)
  const [fps, setFps] = useState(0)
  const [latency, setLatency] = useState(0)

  const isDetectingRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const lastDetectionRef = useRef(0)
  const lastTimelineSampleRef = useRef(0)
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(0)
  const lastEmotionRef = useRef<string | null>(null)
  const lastEmotionChangeRef = useRef(0)
  const lastConfidenceRef = useRef(0)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const sessionStartRef = useRef<number | null>(null)
  const warnFiredRef = useRef(false)

  // Wait for face-api.js CDN script to load
  const waitForFaceApi = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const check = () => {
        if (typeof faceapi !== 'undefined') resolve()
        else setTimeout(check, 100)
      }
      check()
    })
  }, [])

  // Load models
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        await waitForFaceApi()
        if (cancelled) return

        const models = [
          { net: faceapi.nets.tinyFaceDetector, name: 'Face Detector', pct: 33 },
          { net: faceapi.nets.faceExpressionNet, name: 'Expression Recognition', pct: 66 },
          { net: faceapi.nets.faceLandmark68Net, name: 'Face Landmarks', pct: 100 },
        ]

        for (const m of models) {
          if (cancelled) return
          setLoadingMessage(`Loading ${m.name}...`)
          setLoadingProgress(m.pct - 20)
          await m.net.loadFromUri(MODEL_URL)
          setLoadingProgress(m.pct)
        }

        if (!cancelled) {
          setLoadingMessage('Models loaded')
          setModelsLoaded(true)
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load models')
          setLoadingMessage('Failed to load models. Please refresh.')
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [waitForFaceApi])

  const runDetection = useCallback(async () => {
    const video = videoRef.current
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) return

    const s = settingsRef.current
    const opts = new faceapi.TinyFaceDetectorOptions({
      inputSize: INPUT_SIZE_MAP[s.modelType],
      scoreThreshold: SENSITIVITY_MAP[s.sensitivity],
    })

    const t0 = performance.now()
    const result = await faceapi.detectSingleFace(video, opts).withFaceExpressions()
    const lat = Math.round(performance.now() - t0)
    setLatency(lat)

    if (!result) {
      setFaceDetected(false)
      setLatestResult(null)
      return
    }

    setFaceDetected(true)
    setTotalDetections((prev) => prev + 1)

    const expressions = result.expressions
    const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1])
    const topEmotion = sorted[0][0] as EmotionKey
    const topConfidence = sorted[0][1]

    const det: DetectionResult = {
      emotion: topEmotion,
      confidence: topConfidence,
      expressions: expressions as Record<EmotionKey, number>,
      faceBox: result.detection.box,
    }
    setLatestResult(det)

    // Update emotion counts
    setEmotionCounts((prev) => ({
      ...prev,
      [topEmotion]: (prev[topEmotion] || 0) + 1,
    }))

    // Timeline sampling
    const now = Date.now()
    if (now - lastTimelineSampleRef.current >= TIMELINE_SAMPLE_MS) {
      lastTimelineSampleRef.current = now
      setTimelineData((prev) => [
        ...prev.slice(-(MAX_TIMELINE_POINTS - 1)),
        { time: now, emotion: topEmotion, confidence: topConfidence },
      ])
    }

    // History log (on emotion change)
    if (topEmotion !== lastEmotionRef.current) {
      if (lastEmotionRef.current !== null) {
        const duration = now - lastEmotionChangeRef.current
        const entry: HistoryEntry = {
          timestamp: new Date(lastEmotionChangeRef.current).toLocaleTimeString(),
          emotion: lastEmotionRef.current as EmotionKey,
          confidence: Math.round(lastConfidenceRef.current * 100),
          duration: formatDuration(duration),
          durationMs: duration,
        }
        setHistoryLog((prev) => [entry, ...prev])
      }
      lastEmotionRef.current = topEmotion
      lastEmotionChangeRef.current = now
    }
    lastConfidenceRef.current = topConfidence
  }, [videoRef])

  const detectLoop = useCallback(() => {
    rafRef.current = requestAnimationFrame(async () => {
      if (!isDetectingRef.current) return

      const now = performance.now()

      // FPS tracking
      frameCountRef.current++
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current)
        frameCountRef.current = 0
        lastFpsTimeRef.current = now
      }

      // Throttled detection
      if (now - lastDetectionRef.current >= DETECTION_INTERVAL_MS) {
        lastDetectionRef.current = now
        await runDetection()
      }

      detectLoop()
    })
  }, [runDetection])

  const startDetection = useCallback(() => {
    if (isDetectingRef.current) return
    isDetectingRef.current = true
    const now = Date.now()
    sessionStartRef.current = now
    warnFiredRef.current = false
    setIsDetecting(true)
    setSessionStart(now)
    setSessionEnd(null)
    setSessionWarning(null)
    lastFpsTimeRef.current = performance.now()
    frameCountRef.current = 0
    lastEmotionRef.current = null
    lastEmotionChangeRef.current = now
    lastTimelineSampleRef.current = 0
    detectLoop()
  }, [detectLoop])

  const stopDetection = useCallback(() => {
    isDetectingRef.current = false
    setIsDetecting(false)
    setSessionEnd(Date.now())
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    // Flush last emotion to history
    if (lastEmotionRef.current) {
      const now = Date.now()
      const duration = now - lastEmotionChangeRef.current
      const entry: HistoryEntry = {
        timestamp: new Date(lastEmotionChangeRef.current).toLocaleTimeString(),
        emotion: lastEmotionRef.current as EmotionKey,
        confidence: Math.round(lastConfidenceRef.current * 100),
        duration: formatDuration(duration),
        durationMs: duration,
      }
      setHistoryLog((prev) => [entry, ...prev])
    }
  }, [])

  // Session timeout — checked via interval to avoid stale closure in rAF loop
  useEffect(() => {
    if (!isDetecting || !sessionStart) return
    const id = setInterval(() => {
      const elapsed = Date.now() - sessionStart
      if (elapsed >= SESSION_MAX_MS) {
        setSessionWarning('Session ended — 10 minute limit reached. Start a new session to continue.')
        stopDetection()
      } else if (elapsed >= SESSION_WARN_MS && !warnFiredRef.current) {
        warnFiredRef.current = true
        setSessionWarning('Halfway through session — auto-pause in 5 minutes.')
      }
    }, 1000)
    return () => clearInterval(id)
  }, [isDetecting, sessionStart, stopDetection])

  const resetSession = useCallback(() => {
    const fresh: Record<string, number> = {}
    ALL_EMOTIONS.forEach((e) => { fresh[e] = 0 })
    setEmotionCounts(fresh)
    setTimelineData([])
    setHistoryLog([])
    setTotalDetections(0)
    setSessionStart(null)
    setSessionEnd(null)
    setSessionWarning(null)
    setLatestResult(null)
    setFaceDetected(false)
    sessionStartRef.current = null
    warnFiredRef.current = false
    lastEmotionRef.current = null
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isDetectingRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return {
    modelsLoaded,
    loadingProgress,
    loadingMessage,
    loadError,
    latestResult,
    faceDetected,
    isDetecting,
    emotionCounts,
    timelineData,
    historyLog,
    totalDetections,
    sessionStart,
    sessionEnd,
    sessionWarning,
    fps,
    latency,
    startDetection,
    stopDetection,
    resetSession,
  }
}
