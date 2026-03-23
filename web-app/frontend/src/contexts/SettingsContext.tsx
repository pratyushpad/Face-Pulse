import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { AppSettings } from '@/types'

const DEFAULT_SETTINGS: AppSettings = {
  sensitivity: 1,
  modelType: 'fast',
  showBoundingBox: true,
  showHud: true,
  darkMode: true,
  cameraId: '',
}

interface SettingsContextValue {
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => void
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
  }, [])

  // Close settings on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && settingsOpen) setSettingsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [settingsOpen])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, settingsOpen, setSettingsOpen }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
