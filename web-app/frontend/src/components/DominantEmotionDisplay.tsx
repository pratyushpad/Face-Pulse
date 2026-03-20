import { motion, AnimatePresence } from 'framer-motion'
import { EMOTION_COLORS, EMOTION_EMOJIS, EMOTION_LABELS } from '../constants'
import type { EmotionKey } from '../types'

interface DominantEmotionDisplayProps {
  emotion: EmotionKey | null
  confidence: number
  isDetecting: boolean
}

export function DominantEmotionDisplay({
  emotion,
  confidence,
  isDetecting,
}: DominantEmotionDisplayProps) {
  const color = emotion ? (EMOTION_COLORS[emotion] ?? '#6b7280') : '#374151'
  const emoji = emotion ? (EMOTION_EMOJIS[emotion] ?? '🙂') : isDetecting ? '👁' : '😶'
  const label = emotion
    ? (EMOTION_LABELS[emotion] ?? emotion)
    : isDetecting
    ? 'Analyzing…'
    : 'No face detected'
  const pct = Math.round(confidence * 100)

  return (
    <div className="flex items-center gap-5 px-5 py-4">
      <AnimatePresence mode="wait">
        <motion.span
          key={emotion ?? 'idle'}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          className="text-5xl leading-none select-none flex-shrink-0"
        >
          {emoji}
        </motion.span>
      </AnimatePresence>

      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.p
            key={label}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="text-xl font-bold tracking-tight truncate"
            style={{ color: emotion ? color : '#6b7280' }}
          >
            {label}
          </motion.p>
        </AnimatePresence>

        {emotion ? (
          <div className="mt-2">
            <div className="flex justify-between text-xs font-mono text-white/40 mb-1">
              <span>Confidence</span>
              <span style={{ color }}>{pct}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-white/25 font-mono mt-1">
            {isDetecting ? 'Position your face in the camera' : 'Start detection to begin'}
          </p>
        )}
      </div>

      {isDetecting && (
        <div className="flex items-center gap-1.5 text-xs font-mono text-white/40 flex-shrink-0">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          LIVE
        </div>
      )}
    </div>
  )
}
