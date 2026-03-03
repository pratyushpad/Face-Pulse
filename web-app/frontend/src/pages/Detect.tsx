/**
 * Detect — live emotion detection page at /detect.
 *
 * Upgrades the original Home.tsx with:
 * - DominantEmotionDisplay strip for at-a-glance emotion reading
 * - localStorage session persistence for the Analytics page
 * - Cleaner layout without the standalone header (Navbar handles that)
 */

import { useRef, useCallback, useEffect} from 'react'
import { useCamera } from '../hooks/useCamera'
import { useEmotionDetection } from '../hooks/useEmotionDetection'
import { useSessionStats } from '../hooks/useSessionStats'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { CameraFeed, type CameraFeedHandle } from '../components/CameraFeed'
import { EmotionBarChart } from '../components/EmotionBarChart'
import { EmotionTimeline } from '../components/EmotionTimeline'
import { SessionSummary } from '../components/SessionSummary'
import { Controls } from '../components/Controls'
import { DominantEmotionDisplay } from '../components/DominantEmotionDisplay'
import type { EmotionDataPoint } from '../types'

/** localStorage key for the last recorded session history. */
const SESSION_KEY = 'emovision_last_session'

/** Persist the history array to localStorage (overwrites previous session). */
function saveSession(history: EmotionDataPoint[]): void {
  if (history.length === 0) return
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(history))
  } catch {
    // localStorage may be unavailable in private browsing
  }
}

export function Detect() {
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

  // ── Persist session to localStorage when detection stops ───────────────────
  useEffect(() => {
    if (!isDetecting && history.length > 0) {
      saveSession(history)
    }
  }, [isDetecting, history])

  // ── Save on unmount (ref avoids stale closure over empty initial history) ──
  const historyRef = useRef(history)
  historyRef.current = history
  useEffect(() => {
    return () => {
      saveSession(historyRef.current)
    }
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStart = useCallback(async (): Promise<void> => {
    await startCamera()
    startDetection()
  }, [startCamera, startDetection])

  const handleStop = useCallback((): void => {
    stopDetection()
    stopCamera()
  }, [stopDetection, stopCamera])

  const handleSnapshot = useCallback((): void => {
    cameraFeedRef.current?.takeSnapshot()
  }, [])

  const handleReset = useCallback((): void => {
    resetHistory()
  }, [resetHistory])

  const activeError = cameraError ?? detectionError

  // Dominant emotion from latest result
  const dominantEmotion =
    latestResult?.face_detected && latestResult.dominant ? latestResult.dominant : null
  const confidence = latestResult?.face_detected ? (latestResult.confidence ?? 0) : 0

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <main className="px-4 md:px-6 py-5 space-y-4 max-w-screen-2xl mx-auto">

        {/* ── Dominant emotion strip ─────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl">
          <DominantEmotionDisplay
            emotion={dominantEmotion}
            confidence={confidence}
            isDetecting={isDetecting}
          />
        </div>

        {/* ── Controls bar ──────────────────────────────────────────────── */}
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

        {/* ── Primary grid: camera feed + emotion bar chart ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
          <div className="lg:col-span-3 h-full">
            <ErrorBoundary>
              <CameraFeed
                ref={cameraFeedRef}
                videoRef={videoRef}
                latestResult={latestResult}
                isDetecting={isDetecting}
              />
            </ErrorBoundary>
          </div>

          <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-4 hover:shadow-glow transition-shadow duration-300 min-h-[300px] lg:min-h-0">
            <EmotionBarChart latestResult={latestResult} />
          </div>
        </div>

        {/* ── Secondary grid: timeline + session summary ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
          <div className="lg:col-span-3 bg-surface border border-border rounded-xl p-4 hover:shadow-glow transition-shadow duration-300 min-h-[260px]">
            <EmotionTimeline history={history} />
          </div>

          <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-4 hover:shadow-glow transition-shadow duration-300">
            <SessionSummary stats={stats} />
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-3 text-center">
        <p className="text-xs text-white/25 font-mono">
          Built by Pratyush Padhy · UCI CS '28 · FER2013 CNN + VGG16 Transfer Learning
        </p>
      </footer>
    </div>
  )
}
