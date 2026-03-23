interface LoadingScreenProps {
  progress: number
  message: string
  error: string | null
}

export function LoadingScreen({ progress, message, error }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-base flex flex-col items-center justify-center z-[200]">
      <div className="flex items-center gap-2 mb-12 text-xl font-semibold">
        <svg
          className="w-6 h-6 text-accent"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        EmoVision
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
