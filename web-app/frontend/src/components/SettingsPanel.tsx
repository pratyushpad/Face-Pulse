import { X } from 'lucide-react'
import type { AppSettings } from '@/types'

interface SettingsPanelProps {
  isOpen: boolean
  settings: AppSettings
  cameras: MediaDeviceInfo[]
  onClose: () => void
  onUpdate: (partial: Partial<AppSettings>) => void
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <label className="relative w-10 h-[22px] flex-shrink-0 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="hidden"
      />
      <span
        className={`absolute inset-0 rounded-[11px] border transition-colors duration-150 ${
          checked
            ? 'bg-accent border-accent'
            : 'bg-elevated border-border-default'
        }`}
      />
      <span
        className={`absolute top-[3px] left-[3px] w-4 h-4 bg-text-primary rounded-full transition-transform duration-150 ${
          checked ? 'translate-x-[18px]' : ''
        }`}
      />
    </label>
  )
}

const SENSITIVITY_LABELS = ['Low', 'Medium', 'High']

export function SettingsPanel({
  isOpen,
  settings,
  cameras,
  onClose,
  onUpdate,
}: SettingsPanelProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[150] transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[360px] max-w-[100vw] bg-surface border-l border-border-subtle z-[151] flex flex-col transition-transform duration-250 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded bg-transparent border-none text-text-secondary cursor-pointer transition-colors duration-150 hover:text-text-primary hover:bg-hover-overlay"
            aria-label="Close settings"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-7">
          {/* Sensitivity */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Detection Sensitivity
            </span>
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={settings.sensitivity}
              onChange={(e) => onUpdate({ sensitivity: parseInt(e.target.value) })}
              className="w-full h-1 bg-elevated rounded-[2px] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between">
              {SENSITIVITY_LABELS.map((label, i) => (
                <span
                  key={label}
                  className={`text-[11px] cursor-pointer ${
                    settings.sensitivity === i ? 'text-accent' : 'text-text-muted'
                  }`}
                  onClick={() => onUpdate({ sensitivity: i })}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Model type */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Detection Model
            </span>
            <select
              value={settings.modelType}
              onChange={(e) => onUpdate({ modelType: e.target.value as 'fast' | 'accurate' })}
              className="w-full px-3 py-2 font-sans text-[13px] text-text-primary bg-elevated border border-border-default rounded-[6px] cursor-pointer appearance-none outline-none transition-colors duration-150 hover:border-text-muted focus:border-accent"
            >
              <option value="fast">Fast (Lightweight)</option>
              <option value="accurate">Accurate (Full Model)</option>
            </select>
            <p className="text-[12px] text-text-muted">
              Fast uses a smaller input size for better performance.
            </p>
          </div>

          {/* Display toggles */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Display
            </span>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-text-primary">Face bounding box</span>
              <Toggle
                checked={settings.showBoundingBox}
                onChange={(v) => onUpdate({ showBoundingBox: v })}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-text-primary">HUD overlay (FPS / latency)</span>
              <Toggle
                checked={settings.showHud}
                onChange={(v) => onUpdate({ showHud: v })}
              />
            </div>

          </div>

          {/* Camera selector */}
          {cameras.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted">
                Camera Device
              </span>
              <select
                value={settings.cameraId}
                onChange={(e) => onUpdate({ cameraId: e.target.value })}
                className="w-full px-3 py-2 font-sans text-[13px] text-text-primary bg-elevated border border-border-default rounded-[6px] cursor-pointer appearance-none outline-none transition-colors duration-150 hover:border-text-muted focus:border-accent"
              >
                {cameras.map((cam, i) => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
