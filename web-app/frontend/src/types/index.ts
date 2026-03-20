export type EmotionKey =
  | 'angry'
  | 'fear'
  | 'happy'
  | 'sad'
  | 'surprise'
  | 'disgust'
  | 'neutral'

export type EmotionScores = Partial<Record<EmotionKey, number>>

export interface FaceBox {
  x: number
  y: number
  w: number
  h: number
}

export interface DetectionResult {
  emotions: EmotionScores
  dominant: EmotionKey | ''
  confidence: number
  face_detected: boolean
  face_box: FaceBox | null
}

export interface HealthResponse {
  status: string
  model_loaded: boolean
  demo_mode: boolean
}

export interface ModelInfo {
  model: string
  classes: string[]
  n_classes: number
  parameters: number
  input_shape: number[]
  normalization: string
}

export interface EmotionDataPoint {
  timestamp: number
  dominant: EmotionKey
  confidence: number
  emotions: EmotionScores
}

export interface SessionStats {
  dominantEmotion: EmotionKey | null
  dominantPercentage: number
  volatilityScore: number
  currentStreakSeconds: number
  currentStreakEmotion: EmotionKey | null
  sessionDurationSeconds: number
  totalDetections: number
  happiestMoment: number | null
  peakHappiness: number
}

export interface CameraState {
  isStreamActive: boolean
  cameras: MediaDeviceInfo[]
  selectedCameraId: string
  error: string | null
  startCamera: () => Promise<void>
  stopCamera: () => void
  switchCamera: (deviceId: string) => void
}
