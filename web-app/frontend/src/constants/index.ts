// All 7 emotions returned by face-api.js
export const ALL_EMOTIONS = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'fearful',
  'disgusted',
  'surprised',
] as const

export type EmotionKey = (typeof ALL_EMOTIONS)[number]

export const EMOTION_LABELS: Record<EmotionKey, string> = {
  neutral: 'Neutral',
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  fearful: 'Fearful',
  disgusted: 'Disgusted',
  surprised: 'Surprised',
}

// Models CDN
export const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'

// Detection
export const DETECTION_INTERVAL_MS = 150
export const TIMELINE_SAMPLE_MS = 1000
export const MAX_TIMELINE_POINTS = 60
export const MAX_HISTORY_ENTRIES = 200

// Sensitivity → face detection score threshold
export const SENSITIVITY_MAP: Record<number, number> = {
  0: 0.3,  // low
  1: 0.5,  // medium
  2: 0.7,  // high
}

// Model type → input size
export const INPUT_SIZE_MAP: Record<string, number> = {
  fast: 224,
  accurate: 416,
}

// Per-emotion colors for charts and UI
export const EMOTION_COLORS: Record<EmotionKey, string> = {
  neutral:   '#94a3b8', // slate-400
  happy:     '#60a5fa', // blue-400
  sad:       '#818cf8', // indigo-400
  angry:     '#f87171', // red-400
  fearful:   '#a78bfa', // violet-400
  disgusted: '#34d399', // emerald-400
  surprised: '#fbbf24', // amber-400
}

// Read a CSS variable from the current theme at call time
export function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
