/**
 * Core TypeScript interfaces for the EmoVision emotion detection app.
 * All API responses and shared state shapes are defined here.
 */

// ─────────────────────────────────────────────
// EMOTION TYPES
// ─────────────────────────────────────────────

/** The set of emotion keys returned by the model. */
export type EmotionKey =
  | 'angry'
  | 'fear'
  | 'happy'
  | 'sad'
  | 'surprise'
  | 'disgust'
  | 'neutral'

/** Map of emotion name → softmax probability (0.0–1.0). */
export type EmotionScores = Partial<Record<EmotionKey, number>>

// ─────────────────────────────────────────────
// API TYPES
// ─────────────────────────────────────────────

/** Bounding box of a detected face in original frame pixel coordinates. */
export interface FaceBox {
  x: number
  y: number
  w: number
  h: number
}

/** Full response from POST /api/detect. */
export interface DetectionResult {
  /** Softmax probabilities for each emotion class. */
  emotions: EmotionScores
  /** Name of the highest-confidence emotion. */
  dominant: EmotionKey | ''
  /** Probability of the dominant emotion (0.0–1.0). */
  confidence: number
  /** Whether a face was found in the submitted frame. */
  face_detected: boolean
  /** Bounding box of the detected face, null if no face found. */
  face_box: FaceBox | null
}

/** Response from GET /api/health. */
export interface HealthResponse {
  status: string
  model_loaded: boolean
  demo_mode: boolean
}

/** Response from GET /api/model-info. */
export interface ModelInfo {
  model: string
  classes: string[]
  n_classes: number
  parameters: number
  input_shape: number[]
  normalization: string
}

// ─────────────────────────────────────────────
// SESSION TYPES
// ─────────────────────────────────────────────

/** A single timestamped emotion detection result stored in session history. */
export interface EmotionDataPoint {
  /** Unix timestamp (ms) when this detection was recorded. */
  timestamp: number
  /** Dominant emotion at this point. */
  dominant: EmotionKey
  /** Confidence of dominant emotion. */
  confidence: number
  /** Full emotion probability distribution. */
  emotions: EmotionScores
}

/** Aggregated statistics for the current session. */
export interface SessionStats {
  /** Most frequently detected emotion this session. */
  dominantEmotion: EmotionKey | null
  /** Percentage of detections showing the dominant emotion. */
  dominantPercentage: number
  /**
   * Volatility score: fraction of consecutive detections where emotion changed.
   * 0 = completely stable, 1 = changes every frame.
   */
  volatilityScore: number
  /** How many consecutive seconds the current emotion streak has lasted. */
  currentStreakSeconds: number
  /** The emotion being counted in the current streak. */
  currentStreakEmotion: EmotionKey | null
  /** Total session duration in seconds. */
  sessionDurationSeconds: number
  /** Total number of face detections recorded. */
  totalDetections: number
  /** Timestamp of the highest happiness confidence reading. */
  happiestMoment: number | null
  /** Peak happiness confidence recorded. */
  peakHappiness: number
}

// ─────────────────────────────────────────────
// CAMERA TYPES
// ─────────────────────────────────────────────

/** State returned by the useCamera hook. */
export interface CameraState {
  /** Whether the webcam stream is active. */
  isStreamActive: boolean
  /** List of available video input devices. */
  cameras: MediaDeviceInfo[]
  /** Currently selected camera device ID. */
  selectedCameraId: string
  /** Error message if camera access failed. */
  error: string | null
  /** Start streaming from the selected camera. */
  startCamera: () => Promise<void>
  /** Stop streaming and release the webcam. */
  stopCamera: () => void
  /** Switch to a different camera by device ID. */
  switchCamera: (deviceId: string) => void
}
