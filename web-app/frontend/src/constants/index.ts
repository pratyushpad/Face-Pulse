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

// Design tokens
export const COLOR = {
  base: '#0a0a0a',
  surface: '#111111',
  elevated: '#1a1a1a',
  borderSubtle: 'rgba(255,255,255,0.07)',
  borderDefault: 'rgba(255,255,255,0.12)',
  textPrimary: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textMuted: '#525252',
  accent: '#60a5fa',
  accentHover: '#3b82f6',
  danger: '#ef4444',
  success: '#22c55e',
} as const

// Chart.js theme
export const CHART_GRID = 'rgba(255,255,255,0.05)'
export const CHART_TICK = '#525252'
export const CHART_TOOLTIP_BG = '#1a1a1a'
export const CHART_TOOLTIP_BORDER = 'rgba(255,255,255,0.1)'
