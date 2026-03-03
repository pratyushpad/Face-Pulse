/**
 * Application-wide constants for EmoVision.
 * All magic numbers, colors, and configuration values live here.
 */

import type { EmotionKey } from '../types'

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

/** FastAPI backend base URL, injected via Vite env variable. */
export const BACKEND_URL: string =
  (import.meta.env.VITE_BACKEND_URL as string) ?? 'http://localhost:8000'

// ─────────────────────────────────────────────
// DETECTION
// ─────────────────────────────────────────────

/** How often (ms) to send a webcam frame to the backend for analysis. */
export const DETECTION_INTERVAL_MS: number = 500

/** Maximum number of data points to keep in the session history buffer. */
export const MAX_HISTORY_POINTS: number = 120

/** How often (ms) to recompute session summary statistics. */
export const SESSION_STATS_INTERVAL_MS: number = 5_000

// ─────────────────────────────────────────────
// CANVAS / BOUNDING BOX
// ─────────────────────────────────────────────

/** Primary color for the face bounding box and accent elements. */
export const BBOX_COLOR: string = '#3b82f6'

/** Shadow blur radius for the glowing bounding box effect. */
export const BBOX_SHADOW_BLUR: number = 20

/** Stroke width for the bounding box rectangle. */
export const BBOX_LINE_WIDTH: number = 2

/** Corner accent length (in px) for the bracket-style box corners. */
export const BBOX_CORNER_LENGTH: number = 16

// ─────────────────────────────────────────────
// EMOTIONS
// ─────────────────────────────────────────────

/** All emotion keys the app supports (superset of 5-class and 7-class models). */
export const ALL_EMOTION_KEYS: EmotionKey[] = [
  'angry',
  'disgust',
  'fear',
  'happy',
  'neutral',
  'sad',
  'surprise',
]

/**
 * Color assigned to each emotion for charts and UI highlights.
 * Matches the design spec exactly.
 */
export const EMOTION_COLORS: Record<string, string> = {
  happy: '#22c55e',
  sad: '#3b82f6',
  angry: '#ef4444',
  fear: '#a855f7',
  surprise: '#f59e0b',
  disgust: '#f97316',
  neutral: '#6b7280',
}

/** Human-friendly display labels for each emotion key. */
export const EMOTION_LABELS: Record<string, string> = {
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  fear: 'Fear',
  surprise: 'Surprise',
  disgust: 'Disgust',
  neutral: 'Neutral',
}

/** Emoji associated with each emotion for display in the summary panel. */
export const EMOTION_EMOJIS: Record<string, string> = {
  happy: '😄',
  sad: '😢',
  angry: '😠',
  fear: '😨',
  surprise: '😲',
  disgust: '🤢',
  neutral: '😐',
}

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────

/** App background color (darkest layer). */
export const COLOR_BACKGROUND: string = '#0a0a0f'

/** Card / surface background color. */
export const COLOR_SURFACE: string = '#13131a'

/** Subtle border color for cards and dividers. */
export const COLOR_BORDER: string = '#1e1e2e'

/** Chart text color (muted gray for axis labels). */
export const CHART_TEXT_COLOR: string = '#9ca3af'

/** Chart grid line color. */
export const CHART_GRID_COLOR: string = '#1e1e2e'
