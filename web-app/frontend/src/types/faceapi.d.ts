/* Type declarations for face-api.js loaded from CDN */
declare namespace faceapi {
  namespace nets {
    const tinyFaceDetector: { loadFromUri(url: string): Promise<void> }
    const faceExpressionNet: { loadFromUri(url: string): Promise<void> }
    const faceLandmark68Net: { loadFromUri(url: string): Promise<void> }
  }

  class TinyFaceDetectorOptions {
    constructor(options?: { inputSize?: number; scoreThreshold?: number })
  }

  interface Box {
    x: number
    y: number
    width: number
    height: number
  }

  interface FaceDetection {
    box: Box
    score: number
  }

  interface FaceExpressions {
    neutral: number
    happy: number
    sad: number
    angry: number
    fearful: number
    disgusted: number
    surprised: number
    [key: string]: number
  }

  interface WithFaceExpressions {
    detection: FaceDetection
    expressions: FaceExpressions
  }

  interface DetectTask {
    withFaceExpressions(): Promise<WithFaceExpressions | undefined>
  }

  function detectSingleFace(
    input: HTMLVideoElement | HTMLCanvasElement,
    options?: TinyFaceDetectorOptions
  ): DetectTask

  function matchDimensions(
    canvas: HTMLCanvasElement,
    reference: HTMLVideoElement,
    displaySize?: boolean
  ): { width: number; height: number }

  function resizeResults<T>(result: T, dimensions: { width: number; height: number }): T
}
