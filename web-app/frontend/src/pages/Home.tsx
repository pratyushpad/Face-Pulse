/**
 * Home — the main page of EmoVision.
 *
 * Orchestrates all hooks and passes state down to display components.
 * Layout:
 *   - Header bar (title + model status badge)
 *   - Controls bar (start/stop, snapshot, reset, camera select)
 *   - Main grid: [CameraFeed (3/5)] [EmotionBarChart (2/5)]
 *   - Bottom grid: [EmotionTimeline (3/5)] [SessionSummary (2/5)]
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import { useCamera } from '../hooks/useCamera'
import { useEmotionDetection } from '../hooks/useEmotionDetection'
import { useSessionStats } from '../hooks/useSessionStats'
import { ErrorBoundary } from '../components/ErrorBoundary'
import {
  CameraFeed,
  type CameraFeedHandle,
} from '../components/CameraFeed'
import { EmotionBarChart } from '../components/EmotionBarChart'
import { EmotionTimeline } from '../components/EmotionTimeline'
import { SessionSummary } from '../components/SessionSummary'
import { Controls } from '../components/Controls'
import { BACKEND_URL } from '../constants'

/**
 * Main application page.
 *
 * Manages the top-level state lifecycle:
 * 1. Camera hook → video stream
 * 2. Detection hook → emotion results + history
 * 3. Stats hook → aggregated session metrics
 * 4. Distributes state to all child components
 */
export function Home() {
  const cameraFeedRef = useRef<CameraFeedHandle>(null)

  // ── Camera stream ──────────────────────────────────────────────────────────
  const {
    videoRef,
    isStreamActive,
    cameras,
    selectedCameraId,
    error: cameraError,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera()

  // ── Emotion detection ──────────────────────────────────────────────────────
  const {
    latestResult,
    history,
    isDetecting,
    error: detectionError,
    startDetection,
    stopDetection,
    resetHistory,
  } = useEmotionDetection(videoRef)

  // ── Session statistics ─────────────────────────────────────────────────────
  const { stats } = useSessionStats(history, isDetecting)

  // ── Backend health ─────────────────────────────────────────────────────────
  const [backendStatus, setBackendStatus] = useState<
    'checking' | 'ok' | 'demo' | 'offline'
  >('checking')

  useEffect(() => {
    /** Check backend health on page load. */
    async function checkHealth(): Promise<void> {
      try {
        const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(3000) })
        if (!res.ok) throw new Error('Non-OK response')
        const data = await res.json()
        setBackendStatus(data.demo_mode ? 'demo' : 'ok')
      } catch {
        setBackendStatus('offline')
      }
    }
    checkHealth()
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────

  /** Start camera access then immediately begin detection. */
  const handleStart = useCallback(async (): Promise<void> => {
    await startCamera()
    startDetection()
  }, [startCamera, startDetection])

  /** Stop detection and camera. */
  const handleStop = useCallback((): void => {
    stopDetection()
    stopCamera()
  }, [stopDetection, stopCamera])

  /** Trigger snapshot via the CameraFeed imperative handle. */
  const handleSnapshot = useCallback((): void => {
    cameraFeedRef.current?.takeSnapshot()
  }, [])

  /** Reset history and stats. */
  const handleReset = useCallback((): void => {
    resetHistory()
  }, [resetHistory])

  /** Combined error message (camera or detection). */
  const activeError = cameraError ?? detectionError

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-sm font-bold">
            E
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">EmoVision</h1>
            <p className="text-xs text-white/40 font-mono">
              Real-Time Emotion Detection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Backend status badge */}
          <div
            className={[
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border',
              backendStatus === 'ok'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : backendStatus === 'demo'
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                : backendStatus === 'offline'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-white/5 border-border text-white/30',
            ].join(' ')}
          >
            <span
              className={[
                'w-1.5 h-1.5 rounded-full',
                backendStatus === 'ok'
                  ? 'bg-green-400'
                  : backendStatus === 'demo'
                  ? 'bg-yellow-400'
                  : backendStatus === 'offline'
                  ? 'bg-red-400'
                  : 'bg-white/30',
              ].join(' ')}
            />
            {backendStatus === 'ok'
              ? 'Model loaded'
              : backendStatus === 'demo'
              ? 'Demo mode'
              : backendStatus === 'offline'
              ? 'Backend offline'
              : 'Connecting…'}
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com/Pratyushpad27/fer2013-emotion-detection"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white transition-colors text-xs font-mono"
          >
            GitHub ↗
          </a>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="px-4 md:px-6 py-5 space-y-4 max-w-screen-2xl mx-auto">
        {/* Controls bar */}
        <Controls
          isDetecting={isDetecting}
          isStreamActive={isStreamActive}
          cameras={cameras}
          selectedCameraId={selectedCameraId}
          error={activeError}
          onStart={handleStart}
          onStop={handleStop}
          onSwitchCamera={switchCamera}
          onSnapshot={handleSnapshot}
          onReset={handleReset}
        />

        {/* Primary grid: camera feed + emotion bar chart */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Camera feed (takes 3 of 5 columns on large screens) */}
          <div className="lg:col-span-3">
            <ErrorBoundary>
              <CameraFeed
                ref={cameraFeedRef}
                videoRef={videoRef}
                latestResult={latestResult}
                isDetecting={isDetecting}
              />
            </ErrorBoundary>
          </div>

          {/* Emotion bar chart (takes 2 of 5 columns) */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-4 hover:shadow-glow transition-shadow duration-300 min-h-[320px] lg:min-h-[400px]">
            <EmotionBarChart latestResult={latestResult} />
          </div>
        </div>

        {/* Secondary grid: timeline + session summary — same height via items-stretch */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
          {/* Emotion timeline (3/5 columns) */}
          <div className="lg:col-span-3 bg-surface border border-border rounded-xl p-4 hover:shadow-glow transition-shadow duration-300 min-h-[260px]">
            <EmotionTimeline history={history} />
          </div>

          {/* Session summary (2/5 columns) */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-4 hover:shadow-glow transition-shadow duration-300">
            <SessionSummary stats={stats} />
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-3 text-center">
        <p className="text-xs text-white/25 font-mono">
          Built by Pratyush Padhy · UCI CS '28 · FER2013 CNN + VGG16 Transfer Learning
        </p>
      </footer>
    </div>
  )
}
