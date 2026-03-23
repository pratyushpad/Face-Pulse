interface LoadingScreenProps {
  progress: number
  message: string
  error: string | null
}

export function LoadingScreen({ progress, message, error }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-base flex flex-col items-center justify-center z-[200]">
      <div className="flex items-center gap-2.5 mb-12">
        {/* FacePulse scan logo */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent" aria-hidden="true">
          <path d="M2 6 L2 2 L6 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 2 L22 2 L22 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 18 L2 22 L6 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 22 L22 22 L22 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="10" r="1.2" fill="currentColor" />
          <circle cx="15" cy="10" r="1.2" fill="currentColor" />
          <path d="M9.5 14.5 Q12 16.5 14.5 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </svg>
        <span className="text-xl font-semibold text-text-primary">FacePulse</span>
      </div>

      <p className="font-mono text-[13px] text-text-secondary mb-4">
        {message}
      </p>

      <div className="w-[280px] h-[2px] bg-elevated rounded-[1px] overflow-hidden">
        <div
          className="h-full rounded-[1px] transition-[width] duration-400 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: error ? 'var(--color-danger, #ef4444)' : 'var(--color-accent, #60a5fa)',
          }}
        />
      </div>

      {error && (
        <p className="mt-4 text-danger text-sm font-mono">{error}</p>
      )}
    </div>
  )
}
