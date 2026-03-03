/**
 * CameraFeed — displays the live webcam stream with an emotion overlay canvas.
 *
 * - <video> element receives its stream externally via videoRef (managed by useCamera)
 * - <canvas> is drawn via requestAnimationFrame at ~60fps
 * - Face bounding box and emotion label are drawn from the latest detection result
 * - FPS counter displayed in the top-right corner
 * - Exposes takeSnapshot() via forwardRef / useImperativeHandle
 */

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

/** Imperative actions exposed by CameraFeed via ref. */
export interface CameraFeedHandle {
  /** Capture current video frame + canvas overlay and download as PNG. */
  takeSnapshot: () => void
}

interface CameraFeedProps {
  /** Ref to the live <video> element (provided by useCamera hook). */
  videoRef: React.RefObject<HTMLVideoElement>
  /** Most recent backend detection result to render on the canvas. */
  latestResult: DetectionResult | null
  /** Whether the detection loop is currently running. */
  isDetecting: boolean
}

/**
 * Camera feed display component with canvas overlay for bounding boxes.
 *
 * Uses requestAnimationFrame to continuously redraw the canvas overlay on top
 * of the live video feed. Face bounding box coordinates come from the backend
 * and are scaled to match the video's displayed dimensions.
 */
export const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(
  ({ videoRef, latestResult, isDetecting }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animFrameRef = useRef<number | null>(null)
    const frameCountRef = useRef(0)
    const lastFpsTimestampRef = useRef(Date.now())
    // Use a ref instead of state so FPS updates don't recreate the rAF callback
    const fpsRef = useRef(0)

    // Expose snapshot function to parent via ref
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

        // Composite: video frame first, then overlay
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

    /**
     * Core render loop — called every animation frame.
     *
     * Syncs canvas dimensions to the video's rendered display size,
     * then draws the FPS counter, face bounding box, and emotion label.
     */
    const drawFrame = useCallback(() => {
      const video = videoRef.current
      const canvas = canvasRef.current

      // Always re-queue the next frame, even if we return early
      animFrameRef.current = requestAnimationFrame(drawFrame)

      if (!video || !canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Sync canvas intrinsic size to the video's rendered display size
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

      // ── FPS counter ──────────────────────────────────────────────────────
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

      // ── No face / detection paused state ─────────────────────────────────
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

      // Scale face_box from video source dimensions to canvas display dimensions
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

      // ── Bracket-style bounding box corners ───────────────────────────────
      ctx.save()
      ctx.shadowBlur = BBOX_SHADOW_BLUR
      ctx.shadowColor = emotionColor
      ctx.strokeStyle = emotionColor
      ctx.lineWidth = BBOX_LINE_WIDTH
      ctx.lineCap = 'square'

      // Top-left corner
      ctx.beginPath()
      ctx.moveTo(bx, by + cl)
      ctx.lineTo(bx, by)
      ctx.lineTo(bx + cl, by)
      ctx.stroke()

      // Top-right corner
      ctx.beginPath()
      ctx.moveTo(bx + bw - cl, by)
      ctx.lineTo(bx + bw, by)
      ctx.lineTo(bx + bw, by + cl)
      ctx.stroke()

      // Bottom-left corner
      ctx.beginPath()
      ctx.moveTo(bx, by + bh - cl)
      ctx.lineTo(bx, by + bh)
      ctx.lineTo(bx + cl, by + bh)
      ctx.stroke()

      // Bottom-right corner
      ctx.beginPath()
      ctx.moveTo(bx + bw - cl, by + bh)
      ctx.lineTo(bx + bw, by + bh)
      ctx.lineTo(bx + bw, by + bh - cl)
      ctx.stroke()

      ctx.restore()

      // ── Emotion label badge above the bounding box ────────────────────────
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

      // Badge background with glow
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

      // Badge text
      ctx.shadowBlur = 0
      ctx.fillStyle = '#ffffff'
      ctx.fillText(labelText, labelX + padX, labelY + labelHeight - padY)
      ctx.restore()
    }, [videoRef, latestResult, isDetecting])

    // Start the rAF drawing loop on mount, clean up on unmount
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
        {/* Live video element — stream attached by useCamera hook */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full block object-cover min-h-[320px]"
        />
        {/* Canvas overlay for bounding box + labels */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
        />
        {/* Paused overlay */}
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
