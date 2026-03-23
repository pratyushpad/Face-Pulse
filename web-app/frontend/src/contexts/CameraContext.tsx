import { createContext, useContext, useState, useCallback } from 'react'
import { useCamera } from '@/hooks/useCamera'

interface CameraContextValue {
  videoRef: React.RefObject<HTMLVideoElement>
  stream: MediaStream | null
  isStreamActive: boolean
  cameras: MediaDeviceInfo[]
  selectedCameraId: string
  cameraIdx: number
  error: string | null
  startCamera: () => Promise<void>
  stopCamera: () => void
  switchCamera: (deviceId: string) => void
  handleStart: () => Promise<void>
  handleStop: () => void
  handleSwitchCamera: () => void
}

const CameraContext = createContext<CameraContextValue | undefined>(undefined)

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const [cameraIdx, setCameraIdx] = useState(0)

  const {
    videoRef,
    stream,
    isStreamActive,
    cameras,
    selectedCameraId,
    error,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera()

  const handleStart = useCallback(async () => {
    await startCamera()
  }, [startCamera])

  const handleStop = useCallback(() => {
    stopCamera()
  }, [stopCamera])

  const handleSwitchCamera = useCallback(() => {
    if (cameras.length < 2) return
    const nextIdx = (cameraIdx + 1) % cameras.length
    setCameraIdx(nextIdx)
    switchCamera(cameras[nextIdx].deviceId)
  }, [cameras, cameraIdx, switchCamera])

  return (
    <CameraContext.Provider
      value={{
        videoRef,
        stream,
        isStreamActive,
        cameras,
        selectedCameraId,
        cameraIdx,
        error,
        startCamera,
        stopCamera,
        switchCamera,
        handleStart,
        handleStop,
        handleSwitchCamera,
      }}
    >
      {children}
    </CameraContext.Provider>
  )
}

export function useCamera2() {
  const ctx = useContext(CameraContext)
  if (!ctx) throw new Error('useCamera2 must be used within CameraProvider')
  return ctx
}
