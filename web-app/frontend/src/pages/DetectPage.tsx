import { useCallback, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CameraFeed } from '@/components/CameraFeed'
import { Controls } from '@/components/Controls'
import { EmotionDisplay } from '@/components/EmotionDisplay'
import { useCamera2 } from '@/contexts/CameraContext'
import { useDetection } from '@/contexts/DetectionContext'
import { useSettings } from '@/contexts/SettingsContext'
import { EMOTION_LABELS } from '@/constants'
import type { EmotionKey } from '@/constants'

export function DetectPage() {
  const {
    isStreamActive,
    cameras,
    error: cameraError,
    handleStart: startCamera,
    handleStop: stopCamera,
    handleSwitchCamera,
  } = useCamera2()

  const {
    latestResult,
    faceDetected,
    isDetecting,
    fps,
    latency,
    sessionWarning,
    startDetection,
    stopDetection,
  } = useDetection()

  const { settings } = useSettings()

  const handleStart = useCallback(async () => {
    await startCamera()
    startDetection()
  }, [startCamera, startDetection])

  const handleStop = useCallback(() => {
    stopDetection()
    stopCamera()
  }, [stopDetection, stopCamera])

  return (
    <div className="max-w-content mx-auto px-6 pt-8 pb-12">
      {/* Header */}
      <section className="mb-8">
        <h1 className="text-2xl font-semibold">Detect</h1>
        <p className="text-[15px] text-text-secondary mt-2 max-w-[480px]">
          Real-time facial emotion analysis. Session data is temporary and cleared when you leave.
        </p>
      </section>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12">
        {/* Left: Camera + Controls + Emotion */}
        <div>
          <CameraFeed
            latestResult={latestResult}
            faceDetected={faceDetected}
            isDetecting={isDetecting}
            fps={fps}
            latency={latency}
            settings={settings}
          />

          <div className="flex items-center gap-2 mt-3 text-[13px] text-text-secondary">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDetecting ? 'bg-success' : cameraError ? 'bg-danger' : 'bg-text-muted'
              }`}
            />
            <span>
              {isDetecting
                ? faceDetected
                  ? 'Detecting'
                  : 'No face detected'
                : cameraError
                  ? 'Camera error'
                  : 'Ready'}
            </span>
          </div>

          <Controls
            isDetecting={isDetecting}
            isStreamActive={isStreamActive}
            cameras={cameras}
            hasMultipleCameras={cameras.length > 1}
            error={cameraError}
            onStart={handleStart}
            onStop={handleStop}
            onSwitch={handleSwitchCamera}
          />

          {sessionWarning && (
            <div className="mt-3 px-4 py-2.5 rounded-[8px] bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[13px] leading-[1.5]">
              {sessionWarning}
            </div>
          )}

          <EmotionDisplay
            result={latestResult}
            faceDetected={faceDetected}
          />
        </div>

        {/* Right: Mini analytics */}
        <div className="hidden lg:block">
          <MiniAnalytics />
        </div>
      </div>
    </div>
  )
}

function MiniAnalytics() {
  const { totalDetections, sessionStart, sessionEnd, emotionCounts, isDetecting } = useDetection()

  // Tick every second while detecting so the timer updates live
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!isDetecting) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [isDetecting])

  const elapsed = sessionStart
    ? (isDetecting ? Date.now() : (sessionEnd ?? sessionStart)) - sessionStart
    : 0

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  const dominant = Object.entries(emotionCounts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return (
    <div className="sticky top-4 flex flex-col gap-5">
      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted">
        Live Session
      </span>

      <div className="bg-surface border border-border-subtle rounded-[8px] p-5 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] text-text-muted mb-1">Duration</div>
            <div className="text-[24px] font-semibold font-mono tracking-tight">
              {formatTime(elapsed)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-text-muted mb-1">Detections</div>
            <div className="text-[24px] font-semibold font-mono tracking-tight">
              {totalDetections}
            </div>
          </div>
        </div>

        {dominant && (
          <div>
            <div className="text-[11px] text-text-muted mb-1">Dominant</div>
            <div className="text-[18px] font-semibold text-accent capitalize">
              {EMOTION_LABELS[dominant as EmotionKey] ?? dominant}
            </div>
          </div>
        )}

        {!isDetecting && (
          <p className="text-[12px] text-text-muted">Start detection to see live stats.</p>
        )}
      </div>

      <Link
        to="/dashboard"
        className="text-[12px] text-text-muted hover:text-text-primary transition-colors duration-150"
      >
        View full dashboard →
      </Link>
    </div>
  )
}
