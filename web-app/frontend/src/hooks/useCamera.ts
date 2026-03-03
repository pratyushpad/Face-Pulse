/**
 * useCamera — manages webcam access, device enumeration, and stream lifecycle.
 *
 * Usage:
 *   const { videoRef, isStreamActive, cameras, startCamera, stopCamera, ... } = useCamera()
 *   <video ref={videoRef} autoPlay muted playsInline />
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import type { CameraState } from '../types'

/**
 * Custom hook for managing the browser webcam stream.
 *
 * Handles getUserMedia, device enumeration, camera switching,
 * and stream cleanup on unmount.
 *
 * @returns CameraState — videoRef and all camera control functions.
 */
export function useCamera(): CameraState & {
  videoRef: React.RefObject<HTMLVideoElement>
} {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isStreamActive, setIsStreamActive] = useState(false)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Ref mirrors selectedCameraId so listCameras can read the current value
  // without adding it to its dependency array (breaks the circular dep chain).
  const selectedCameraIdRef = useRef<string>('')
  useEffect(() => {
    selectedCameraIdRef.current = selectedCameraId
  }, [selectedCameraId])

  /** Enumerate available video input devices and update the cameras list. */
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

  /** Stop the current stream and release the camera. */
  const stopCamera = useCallback((): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreamActive(false)
  }, [])

  /**
   * Request camera access and attach the stream to the video element.
   * Lists available cameras after stream starts (permissions now granted).
   */
  const startCamera = useCallback(async (): Promise<void> => {
    setError(null)
    try {
      // Stop any existing stream first
      stopCamera()

      const constraints: MediaStreamConstraints = {
        video: selectedCameraId
          ? { deviceId: { exact: selectedCameraId }, width: 640, height: 480 }
          : { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsStreamActive(true)

      // Enumerate cameras now that permissions are granted (labels become available)
      await listCameras()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Camera access denied'
      console.error('Camera error:', err)
      setError(message)
      setIsStreamActive(false)
    }
  }, [selectedCameraId, stopCamera, listCameras])

  /**
   * Switch to a different camera by device ID.
   * Stops the current stream and restarts with the new device.
   *
   * @param deviceId - The deviceId from a MediaDeviceInfo object.
   */
  const switchCamera = useCallback(
    (deviceId: string): void => {
      setSelectedCameraId(deviceId)
    },
    []
  )

  // When selectedCameraId changes (user switched camera), restart the stream.
  // startCamera is a safe dep here: it only changes when selectedCameraId changes,
  // so both fire together and the effect runs exactly once per camera switch.
  useEffect(() => {
    if (isStreamActive && selectedCameraId) {
      startCamera()
    }
  }, [selectedCameraId, startCamera]) // isStreamActive intentionally omitted — adding it would re-run on stream start/stop

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    videoRef,
    isStreamActive,
    cameras,
    selectedCameraId,
    error,
    startCamera,
    stopCamera,
    switchCamera,
  }
}
