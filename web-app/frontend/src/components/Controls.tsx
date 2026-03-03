/**
 * Controls — action bar with start/stop, snapshot, reset, and camera select.
 *
 * Sits at the top of the page and is always visible.
 * Passes all actions up to the parent via callbacks.
 */

import type { ChangeEvent } from 'react'

interface ControlsProps {
  /** Whether the detection loop is currently running. */
  isDetecting: boolean
  /** Whether the webcam stream is active. */
  isStreamActive: boolean
  /** List of available camera devices. */
  cameras: MediaDeviceInfo[]
  /** Currently active camera device ID. */
  selectedCameraId: string
  /** Error message from camera or detection. */
  error: string | null
  /** Start the webcam + detection. */
  onStart: () => void
  /** Stop the detection loop. */
  onStop: () => void
  /** Switch to a different camera device. */
  onSwitchCamera: (deviceId: string) => void
  /** Capture a snapshot of the current frame + overlay. */
  onSnapshot: () => void
  /** Clear all session history. */
  onReset: () => void
}

/**
 * Control bar component for managing detection state and camera input.
 *
 * Renders a horizontal strip with all primary actions. The Start/Stop button
 * changes appearance and text based on current detection state.
 */
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
  /** Handle camera select dropdown change. */
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
        {/* Start / Stop detection button */}
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

        {/* Snapshot button — only usable when stream is active */}
        <button
          onClick={onSnapshot}
          disabled={!isStreamActive}
          title="Save snapshot"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-white/70 hover:text-white hover:border-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          📸 Snapshot
        </button>

        {/* Reset session button */}
        <button
          onClick={onReset}
          title="Clear session history"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-white/70 hover:text-white hover:border-white/30 transition-all duration-200"
        >
          ↺ Reset
        </button>

        {/* Camera select dropdown */}
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

        {/* Live indicator dot */}
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
