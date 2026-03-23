import { useState, useRef, useCallback, useEffect } from 'react'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isStreamActive, setIsStreamActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Ref to avoid stale closure in listCameras
  const selectedCameraIdRef = useRef<string>('')
  useEffect(() => {
    selectedCameraIdRef.current = selectedCameraId
  }, [selectedCameraId])

  const listCameras = useCallback(async (): Promise<void> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === 'videoinput')
      setCameras(videoDevices)
      if (videoDevices.length > 0 && !selectedCameraIdRef.current) {
        setSelectedCameraId(videoDevices[0].deviceId)
      }
    } catch (err) {
      console.error('Could not enumerate media devices:', err)
    }
  }, [])

  const stopCamera = useCallback((): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStream(null)
    setIsStreamActive(false)
  }, [])

  const startCamera = useCallback(async (): Promise<void> => {
    setError(null)
    try {
      stopCamera()

      const constraints: MediaStreamConstraints = {
        video: selectedCameraId
          ? { deviceId: { exact: selectedCameraId }, width: 640, height: 480 }
          : { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = mediaStream

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }

      setStream(mediaStream)
      setIsStreamActive(true)
      await listCameras()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Camera access denied'
      console.error('Camera error:', err)
      setError(message)
      setIsStreamActive(false)
    }
  }, [selectedCameraId, stopCamera, listCameras])

  const switchCamera = useCallback(
    (deviceId: string): void => {
      setSelectedCameraId(deviceId)
    },
    []
  )

  // Restart stream when camera changes
  useEffect(() => {
    if (isStreamActive && selectedCameraId) {
      startCamera()
    }
  }, [selectedCameraId, startCamera]) // isStreamActive intentionally omitted

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    videoRef,
    stream,
    isStreamActive,
    cameras,
    selectedCameraId,
    error,
    startCamera,
    stopCamera,
    switchCamera,
  }
}
