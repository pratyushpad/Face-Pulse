import { useRef, useEffect, useCallback } from 'react'
import type { DetectionResult, AppSettings } from '@/types'
import { useCamera2 } from '@/contexts/CameraContext'

interface CameraFeedProps {
  latestResult: DetectionResult | null
  faceDetected: boolean
  isDetecting: boolean
  fps: number
  latency: number
  settings: AppSettings
}

export function CameraFeed({
  latestResult,
  faceDetected,
  isDetecting,
  fps,
  latency,
  settings,
}: CameraFeedProps) {
  const { stream } = useCamera2()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)

  // Sync the shared MediaStream to this visible video element
  useEffect(() => {
    const video = localVideoRef.current
    if (!video) return
    if (stream) {
      video.srcObject = stream
      video.play().catch(() => {})
    } else {
      video.srcObject = null
    }
  }, [stream])

  const draw = useCallback(() => {
    const video = localVideoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) {
      animRef.current = requestAnimationFrame(draw)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = video.getBoundingClientRect()
    if (rect.width > 0 && (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height))) {
      canvas.width = Math.floor(rect.width)
      canvas.height = Math.floor(rect.height)
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // HUD overlay
    if (settings.showHud && isDetecting) {
      ctx.save()
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.textAlign = 'right'
      ctx.fillText(`${fps} FPS`, canvas.width - 8, 18)
      ctx.fillText(`${latency}ms`, canvas.width - 8, 32)
      ctx.restore()
    }

    // No face status
    if (isDetecting && !faceDetected && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      ctx.save()
      ctx.font = '500 12px "JetBrains Mono", monospace'
      ctx.fillStyle = 'rgba(163, 163, 163, 0.8)'
      ctx.textAlign = 'left'
      ctx.fillText('No face detected', 10, 24)
      ctx.restore()
    }

    // Face bounding box
    if (settings.showBoundingBox && isDetecting && latestResult && faceDetected) {
      const box = latestResult.faceBox
      const scaleX = video.videoWidth > 0 ? canvas.width / video.videoWidth : 1
      const scaleY = video.videoHeight > 0 ? canvas.height / video.videoHeight : 1

      const bx = box.x * scaleX
      const by = box.y * scaleY
      const bw = box.width * scaleX
      const bh = box.height * scaleY

      ctx.save()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, by, bw, bh)

      const labelText = `${latestResult.emotion} ${Math.round(latestResult.confidence * 100)}%`
      ctx.font = '12px "JetBrains Mono", monospace'
      const tw = ctx.measureText(labelText).width
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(bx, by - 18, tw + 8, 18)
      ctx.fillStyle = '#f5f5f5'
      ctx.fillText(labelText, bx + 4, by - 5)
      ctx.restore()
    }

    animRef.current = requestAnimationFrame(draw)
  }, [latestResult, faceDetected, isDetecting, fps, latency, settings.showBoundingBox, settings.showHud])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [draw])

  return (
    <div className="relative w-full aspect-[4/3] bg-surface border border-border-default rounded-[6px] overflow-hidden">
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
      />

      {!isDetecting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted">
          <svg className="w-12 h-12 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <p className="text-[13px]">Camera feed will appear here</p>
        </div>
      )}
    </div>
  )
}
