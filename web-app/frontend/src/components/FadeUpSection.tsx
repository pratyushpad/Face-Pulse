import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface FadeUpSectionProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function FadeUpSection({ children, delay = 0, className = '' }: FadeUpSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
