import { AnimatePresence, motion } from 'framer-motion'
import { ALL_EMOTIONS, EMOTION_LABELS, EMOTION_COLORS } from '@/constants'
import type { DetectionResult } from '@/types'

interface EmotionDisplayProps {
  result: DetectionResult | null
  faceDetected: boolean
}

export function EmotionDisplay({ result, faceDetected }: EmotionDisplayProps) {
  const emotion = faceDetected && result ? result.emotion : null
  const confidence = faceDetected && result ? result.confidence : 0
  const expressions = faceDetected && result ? result.expressions : null

  return (
    <div className="mt-8">
      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted">
        Detected Emotion
      </span>

      <div className="flex items-baseline gap-4 mt-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={emotion ?? 'none'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-[36px] md:text-[48px] lg:text-[72px] font-semibold leading-none tracking-[-0.02em] capitalize"
          >
            {emotion ? EMOTION_LABELS[emotion] : '—'}
          </motion.span>
        </AnimatePresence>

        {emotion && (
          <span className="font-mono text-sm text-text-secondary">
            {Math.round(confidence * 100)}%
          </span>
        )}
      </div>

      {emotion && (
        <div className="mt-3 h-1 bg-elevated rounded-[2px] overflow-hidden max-w-[200px]">
          <div
            className="h-full bg-text-secondary transition-[width] duration-300 ease-out"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      )}

      {/* All 7 emotion confidence bars */}
      <div className="mt-6 flex flex-col gap-2">
        {ALL_EMOTIONS.map((e) => {
          const val = expressions ? expressions[e] ?? 0 : 0
          const isDominant = e === emotion
          return (
            <div key={e} className="grid grid-cols-[80px_1fr_40px] items-center gap-3">
              <span className="text-[12px] font-medium text-text-secondary capitalize">
                {EMOTION_LABELS[e]}
              </span>
              <div className="h-[6px] bg-elevated rounded-[3px] overflow-hidden">
                <div
                  className="h-full rounded-[3px] transition-[width] duration-300 ease-out"
                  style={{ width: `${val * 100}%`, backgroundColor: EMOTION_COLORS[e], opacity: isDominant ? 1 : 0.45 }}
                />
              </div>
              <span className="font-mono text-[11px] text-text-muted text-right">
                {Math.round(val * 100)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
