import type { ChangeEvent } from 'react'

interface ControlsProps {
  isDetecting: boolean
  isStreamActive: boolean
  cameras: MediaDeviceInfo[]
  selectedCameraId: string
  error: string | null
  onStart: () => void
  onStop: () => void
  onSwitchCamera: (deviceId: string) => void
  onSnapshot: () => void
  onReset: () => void
}

export function Controls({
  isDetecting,
  isStreamActive,
  cameras,
  selectedCameraId,
  error,
  onStart,
  onStop,
  onSwitchCamera,
  onSnapshot,
  onReset,
}: ControlsProps) {
  const handleCameraChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    onSwitchCamera(e.target.value)
  }

  return (
    <div className="w-full">
      {/* Error banner */}
      {error && (
        <div className="mb-3 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={isDetecting ? onStop : onStart}
          className={[
            'flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200',
            isDetecting
              ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
              : 'bg-accent/20 border border-accent/50 text-accent hover:bg-accent/30 hover:shadow-glow',
          ].join(' ')}
        >
          {isDetecting ? (
            <>
              <span className="inline-block w-2 h-2 rounded-sm bg-red-400" />
              Stop
            </>
          ) : (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
              Start Detection
            </>
          )}
        </button>

        <button
          onClick={onSnapshot}
          disabled={!isStreamActive}
          title="Save snapshot"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-white/70 hover:text-white hover:border-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          📸 Snapshot
        </button>

        <button
          onClick={onReset}
          title="Clear session history"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-white/70 hover:text-white hover:border-white/30 transition-all duration-200"
        >
          ↺ Reset
        </button>

        {cameras.length > 1 && (
          <div className="ml-auto">
            <select
              value={selectedCameraId}
              onChange={handleCameraChange}
              className="px-3 py-2 rounded-lg text-sm font-mono bg-surface border border-border text-white/70 hover:border-accent/50 focus:outline-none focus:border-accent transition-colors cursor-pointer"
            >
              {cameras.map((cam, i) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {isDetecting && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono text-white/40">LIVE</span>
          </div>
        )}
      </div>
    </div>
  )
}
