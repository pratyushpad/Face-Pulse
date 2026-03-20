import { EMOTION_COLORS, EMOTION_EMOJIS, EMOTION_LABELS } from '../constants'
import type { EmotionKey } from '../types'

interface EmotionBadgeProps {
  emotion: EmotionKey
  confidence?: number
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2',
}

export function EmotionBadge({ emotion, confidence, size = 'md' }: EmotionBadgeProps) {
  const color = EMOTION_COLORS[emotion] ?? '#6b7280'
  const emoji = EMOTION_EMOJIS[emotion] ?? '🙂'
  const label = EMOTION_LABELS[emotion] ?? emotion

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono border ${SIZE_CLASSES[size]}`}
      style={{
        backgroundColor: color + '18',
        borderColor: color + '50',
        color,
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      {confidence !== undefined && (
        <span style={{ color: color + 'aa' }}>{Math.round(confidence * 100)}%</span>
      )}
    </span>
  )
}
