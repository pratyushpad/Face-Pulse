import { Play, Square, RefreshCw } from 'lucide-react'


interface ControlsProps {
  isDetecting: boolean
  isStreamActive: boolean
  cameras?: MediaDeviceInfo[]
  hasMultipleCameras: boolean
  error: string | null
  onStart: () => void
  onStop: () => void
  onSwitch: () => void
}

export function Controls({
  isDetecting,
  isStreamActive,
  hasMultipleCameras,
  error,
  onStart,
  onStop,
  onSwitch,
}: ControlsProps) {
  return (
    <div>
      {error && (
        <div className="mb-3 px-4 py-2.5 rounded-[6px] bg-danger/10 border border-danger/30 text-danger text-sm font-mono">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        {!isDetecting ? (
          <button
            onClick={onStart}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-[6px] cursor-pointer transition-colors duration-150 bg-accent border border-accent text-black hover:bg-accent-hover hover:border-accent-hover"
          >
            <Play className="w-[14px] h-[14px]" />
            Start Detection
          </button>
        ) : (
          <button
            onClick={onStop}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-[6px] cursor-pointer transition-colors duration-150 bg-transparent border border-border-default text-text-primary hover:bg-white/5"
          >
            <Square className="w-[14px] h-[14px]" />
            Stop
          </button>
        )}

        {hasMultipleCameras && (
          <button
            onClick={onSwitch}
            disabled={!isStreamActive}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-[6px] cursor-pointer transition-colors duration-150 bg-transparent border border-border-default text-text-primary hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-[14px] h-[14px]" />
            Switch
          </button>
        )}

        {isDetecting && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] font-mono text-text-muted">DETECTING</span>
          </div>
        )}
      </div>
    </div>
  )
}
