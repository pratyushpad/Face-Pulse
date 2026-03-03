/**
 * GlowButton — animated button with multiple variants.
 */

import { motion } from 'framer-motion'

type Variant = 'primary' | 'ghost' | 'danger' | 'success' | 'accent-outline'

interface GlowButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: Variant
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-accent hover:bg-accent-light text-white shadow-glow',
  ghost:
    'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-border',
  danger:
    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30',
  success:
    'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30',
  'accent-outline':
    'bg-transparent hover:bg-accent/10 text-accent border border-accent/50 hover:border-accent',
}

export function GlowButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button',
}: GlowButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ duration: 0.1 }}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </motion.button>
  )
}
