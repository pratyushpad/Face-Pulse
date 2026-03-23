import type { EmotionKey } from '../constants'

export interface FaceBox {
  x: number
  y: number
  width: number
  height: number
}

export interface DetectionResult {
  emotion: EmotionKey
  confidence: number
  expressions: Record<EmotionKey, number>
  faceBox: FaceBox
}

export interface TimelinePoint {
  time: number
  emotion: EmotionKey
  confidence: number
}

export interface HistoryEntry {
  timestamp: string
  emotion: EmotionKey
  confidence: number
  duration: string
  durationMs: number
}

export interface AppSettings {
  sensitivity: number      // 0=low, 1=medium, 2=high
  modelType: 'fast' | 'accurate'
  showBoundingBox: boolean
  showHud: boolean
  darkMode: boolean
  cameraId: string
}

export interface SessionData {
  emotionCounts: Record<string, number>
  timelineData: TimelinePoint[]
  historyLog: HistoryEntry[]
  totalDetections: number
  sessionStart: number | null
}
