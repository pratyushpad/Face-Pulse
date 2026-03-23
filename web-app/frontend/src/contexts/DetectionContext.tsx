import { createContext, useContext } from 'react'
import { useFaceDetection } from '@/hooks/useFaceDetection'
import { useSessionPersistence } from '@/hooks/useSessionPersistence'
import { useCamera2 } from './CameraContext'
import { useSettings } from './SettingsContext'
import type { DetectionResult, TimelinePoint, HistoryEntry } from '@/types'

interface DetectionContextValue {
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
  fps: number
  latency: number
  startDetection: () => void
  stopDetection: () => void
  resetSession: () => void
}

const DetectionContext = createContext<DetectionContextValue | undefined>(undefined)

export function DetectionProvider({ children }: { children: React.ReactNode }) {
  const { videoRef } = useCamera2()
  const { settings } = useSettings()

  const detection = useFaceDetection(videoRef, settings)

  useSessionPersistence({
    isDetecting: detection.isDetecting,
    sessionStart: detection.sessionStart,
    historyLog: detection.historyLog,
    emotionCounts: detection.emotionCounts,
    totalDetections: detection.totalDetections,
  })

  return (
    <DetectionContext.Provider value={detection}>
      {children}
    </DetectionContext.Provider>
  )
}

export function useDetection() {
  const ctx = useContext(DetectionContext)
  if (!ctx) throw new Error('useDetection must be used within DetectionProvider')
  return ctx
}
