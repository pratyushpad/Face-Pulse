import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import type { DetectionResult } from '../types'
import {
  BBOX_COLOR,
  BBOX_SHADOW_BLUR,
  BBOX_LINE_WIDTH,
  BBOX_CORNER_LENGTH,
  EMOTION_COLORS,
  EMOTION_LABELS,
} from '../constants'

export interface CameraFeedHandle {
  takeSnapshot: () => void
}

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>
  latestResult: DetectionResult | null
  isDetecting: boolean
}

export const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(
  ({ videoRef, latestResult, isDetecting }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animFrameRef = useRef<number | null>(null)
    const frameCountRef = useRef(0)
    const lastFpsTimestampRef = useRef(Date.now())
    const fpsRef = useRef(0)

    useImperativeHandle(ref, () => ({
      takeSnapshot: () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return

        const snap = document.createElement('canvas')
        snap.width = video.videoWidth || canvas.width
        snap.height = video.videoHeight || canvas.height

        const ctx = snap.getContext('2d')
        if (!ctx) return

        ctx.drawImage(video, 0, 0, snap.width, snap.height)
        if (canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(canvas, 0, 0, snap.width, snap.height)
        }

        snap.toBlob((blob) => {
          if (!blob) return
          const url = URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = `emovision_snapshot_${Date.now()}.png`
          anchor.click()
          URL.revokeObjectURL(url)
        }, 'image/png')
      },
    }))

    const drawFrame = useCallback(() => {
      const video = videoRef.current
      const canvas = canvasRef.current

      animFrameRef.current = requestAnimationFrame(drawFrame)

      if (!video || !canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Sync canvas size to video display size
      const rect = video.getBoundingClientRect()
      if (
        rect.width > 0 &&
        (canvas.width !== Math.floor(rect.width) ||
          canvas.height !== Math.floor(rect.height))
      ) {
        canvas.width = Math.floor(rect.width)
        canvas.height = Math.floor(rect.height)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // FPS counter
      frameCountRef.current++
      const now = Date.now()
      if (now - lastFpsTimestampRef.current >= 1000) {
        fpsRef.current = frameCountRef.current
        frameCountRef.current = 0
        lastFpsTimestampRef.current = now
      }

      ctx.save()
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.textAlign = 'right'
      ctx.fillText(`${fpsRef.current} fps`, canvas.width - 10, 20)
      ctx.restore()

      if (!latestResult || !latestResult.face_detected || !latestResult.face_box) {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && isDetecting) {
          ctx.save()
          ctx.font = '500 13px Inter, sans-serif'
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'
          ctx.textAlign = 'left'
          ctx.fillText('No face detected', 12, 28)
          ctx.restore()
        }
        return
      }

      const { face_box, dominant, confidence } = latestResult

      // Scale bounding box from video source to display dimensions
      const scaleX =
        video.videoWidth > 0 ? canvas.width / video.videoWidth : 1
      const scaleY =
        video.videoHeight > 0 ? canvas.height / video.videoHeight : 1

      const bx = face_box.x * scaleX
      const by = face_box.y * scaleY
      const bw = face_box.w * scaleX
      const bh = face_box.h * scaleY

      const emotionColor = EMOTION_COLORS[dominant] ?? BBOX_COLOR
      const cl = BBOX_CORNER_LENGTH

      // Draw bracket-style bounding box corners
      ctx.save()
      ctx.shadowBlur = BBOX_SHADOW_BLUR
      ctx.shadowColor = emotionColor
      ctx.strokeStyle = emotionColor
      ctx.lineWidth = BBOX_LINE_WIDTH
      ctx.lineCap = 'square'

      ctx.beginPath()
      ctx.moveTo(bx, by + cl)
      ctx.lineTo(bx, by)
      ctx.lineTo(bx + cl, by)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(bx + bw - cl, by)
      ctx.lineTo(bx + bw, by)
      ctx.lineTo(bx + bw, by + cl)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(bx, by + bh - cl)
      ctx.lineTo(bx, by + bh)
      ctx.lineTo(bx + cl, by + bh)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(bx + bw - cl, by + bh)
      ctx.lineTo(bx + bw, by + bh)
      ctx.lineTo(bx + bw, by + bh - cl)
      ctx.stroke()

      ctx.restore()

      // Emotion label badge above bounding box
      const emotionName = EMOTION_LABELS[dominant] ?? dominant
      const labelText = `${emotionName}  ${(confidence * 100).toFixed(0)}%`

      ctx.save()
      ctx.font = 'bold 13px "JetBrains Mono", monospace'

      const textWidth = ctx.measureText(labelText).width
      const padX = 8
      const padY = 5
      const labelHeight = 22
      const labelWidth = textWidth + padX * 2
      const labelX = bx
      const labelY = Math.max(0, by - labelHeight - 6)

      ctx.shadowBlur = 12
      ctx.shadowColor = emotionColor
      ctx.fillStyle = emotionColor + 'dd'
      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 4)
      } else {
        ctx.rect(labelX, labelY, labelWidth, labelHeight)
      }
      ctx.fill()

      ctx.shadowBlur = 0
      ctx.fillStyle = '#ffffff'
      ctx.fillText(labelText, labelX + padX, labelY + labelHeight - padY)
      ctx.restore()
    }, [videoRef, latestResult, isDetecting])

    useEffect(() => {
      animFrameRef.current = requestAnimationFrame(drawFrame)
      return () => {
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current)
        }
      }
    }, [drawFrame])

    return (
      <div className="relative w-full h-full overflow-hidden rounded-xl bg-black border border-border min-h-[320px]">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full block object-cover min-h-[320px]"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
        />
        {!isDetecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
            <div className="text-center">
              <p className="text-white/60 text-sm font-mono">
                Detection paused
              </p>
              <p className="text-white/30 text-xs mt-1">
                Press Start to begin
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }
)

CameraFeed.displayName = 'CameraFeed'
