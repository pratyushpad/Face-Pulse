import type { EmotionKey } from '../types'

// API
export const BACKEND_URL: string =
  (import.meta.env.VITE_BACKEND_URL as string) ?? 'http://localhost:8000'

// Detection loop
export const DETECTION_INTERVAL_MS: number = 500
export const MAX_HISTORY_POINTS: number = 120
export const SESSION_STATS_INTERVAL_MS: number = 5_000

// Canvas bounding box
export const BBOX_COLOR: string = '#3b82f6'
export const BBOX_SHADOW_BLUR: number = 20
export const BBOX_LINE_WIDTH: number = 2
export const BBOX_CORNER_LENGTH: number = 16

// Emotion keys, colors, labels, emojis
export const ALL_EMOTION_KEYS: EmotionKey[] = [
  'angry',
  'disgust',
  'fear',
  'happy',
  'neutral',
  'sad',
  'surprise',
]

export const EMOTION_COLORS: Record<string, string> = {
  happy: '#22c55e',
  sad: '#3b82f6',
  angry: '#ef4444',
  fear: '#a855f7',
  surprise: '#f59e0b',
  disgust: '#f97316',
  neutral: '#6b7280',
}

export const EMOTION_LABELS: Record<string, string> = {
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  fear: 'Fear',
  surprise: 'Surprise',
  disgust: 'Disgust',
  neutral: 'Neutral',
}

export const EMOTION_EMOJIS: Record<string, string> = {
  happy: '😄',
  sad: '😢',
  angry: '😠',
  fear: '😨',
  surprise: '😲',
  disgust: '🤢',
  neutral: '😐',
}

// Design tokens
export const COLOR_BACKGROUND: string = '#0a0a0f'
export const COLOR_SURFACE: string = '#13131a'
export const COLOR_BORDER: string = '#1e1e2e'
export const CHART_TEXT_COLOR: string = '#9ca3af'
export const CHART_GRID_COLOR: string = '#1e1e2e'
