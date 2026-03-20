import { motion } from 'framer-motion'

interface GlowCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  onClick?: () => void
}

export function GlowCard({
  children,
  className = '',
  glowColor,
  onClick,
}: GlowCardProps) {
  const shadowColor = glowColor ?? '#3b82f6'

  return (
    <motion.div
      onClick={onClick}
      className={`bg-surface border border-border rounded-xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
      whileHover={{
        boxShadow: `0 0 30px ${shadowColor}30`,
        borderColor: `${shadowColor}60`,
      }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}
