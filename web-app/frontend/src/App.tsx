import { useState, useCallback, useEffect } from 'react'
import { useCamera } from './hooks/useCamera'
import { useFaceDetection } from './hooks/useFaceDetection'
import { Navbar } from './components/Navbar'
import { LoadingScreen } from './components/LoadingScreen'
import { CameraFeed } from './components/CameraFeed'
import { Controls } from './components/Controls'
import { EmotionDisplay } from './components/EmotionDisplay'
import { AnalyticsPanel } from './components/AnalyticsPanel'
import { HistoryTable } from './components/HistoryTable'
import { SettingsPanel } from './components/SettingsPanel'
import { Footer } from './components/Footer'
import type { AppSettings } from './types'

const DEFAULT_SETTINGS: AppSettings = {
  sensitivity: 1,
  modelType: 'fast',
  showBoundingBox: true,
  showHud: true,
  darkMode: true,
  cameraId: '',
}

export function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [cameraIdx, setCameraIdx] = useState(0)

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

  const {
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
    fps,
    latency,
    startDetection,
    stopDetection,
    // resetSession is available but not wired to UI yet
  } = useFaceDetection(videoRef, settings)

  // Handle camera switch from settings
  useEffect(() => {
    if (settings.cameraId && settings.cameraId !== selectedCameraId) {
      switchCamera(settings.cameraId)
    }
  }, [settings.cameraId, selectedCameraId, switchCamera])

  const handleStart = useCallback(async () => {
    await startCamera()
    startDetection()
  }, [startCamera, startDetection])

  const handleStop = useCallback(() => {
    stopDetection()
    stopCamera()
  }, [stopDetection, stopCamera])

  const handleSwitchCamera = useCallback(() => {
    if (cameras.length < 2) return
    const nextIdx = (cameraIdx + 1) % cameras.length
    setCameraIdx(nextIdx)
    switchCamera(cameras[nextIdx].deviceId)
  }, [cameras, cameraIdx, switchCamera])

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
  }, [])

  // Close settings on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && settingsOpen) setSettingsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [settingsOpen])

  // Show loading screen while models load
  if (!modelsLoaded) {
    return (
      <LoadingScreen
        progress={loadingProgress}
        message={loadingMessage}
        error={loadError}
      />
    )
  }

  return (
    <div className="min-h-screen bg-base">
      <Navbar onOpenSettings={() => setSettingsOpen(true)} />

      <main className="max-w-content mx-auto px-6 pt-[104px] pb-12">
        {/* Hero header */}
        <section id="detect" className="mb-8">
          <h1 className="text-2xl font-semibold">EmoVision</h1>
          <p className="text-[15px] text-text-secondary mt-2 max-w-[480px]">
            Real-time facial emotion analysis powered by machine learning.
            All processing runs locally in your browser.
          </p>
        </section>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12">
          {/* Left: Camera + Controls + Emotion */}
          <div>
            <CameraFeed
              videoRef={videoRef}
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

            <EmotionDisplay
              result={latestResult}
              faceDetected={faceDetected}
              isDetecting={isDetecting}
            />
          </div>

          {/* Right: Analytics */}
          <div id="analytics">
            <AnalyticsPanel
              sessionStart={sessionStart}
              totalDetections={totalDetections}
              emotionCounts={emotionCounts}
              timelineData={timelineData}
              isDetecting={isDetecting}
            />
          </div>
        </div>

        {/* History */}
        <HistoryTable historyLog={historyLog} />
      </main>

      {/* Settings */}
      <SettingsPanel
        isOpen={settingsOpen}
        settings={settings}
        cameras={cameras}
        onClose={() => setSettingsOpen(false)}
        onUpdate={updateSettings}
      />

      <Footer />
    </div>
  )
}
