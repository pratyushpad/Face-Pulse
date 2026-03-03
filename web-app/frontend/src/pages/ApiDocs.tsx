/**
 * ApiDocs — API documentation page at /api.
 *
 * Documents all endpoints, provides code examples, and lets users
 * try the detect-image endpoint by uploading a photo.
 */

import { useState, useRef, useEffect } from 'react'
import { FadeUpSection } from '../components/FadeUpSection'
import { GlowCard } from '../components/GlowCard'
import { GlowButton } from '../components/GlowButton'
import { EmotionBadge } from '../components/EmotionBadge'
import { BACKEND_URL } from '../constants'
import type { DetectionResult, EmotionKey } from '../types'

type Language = 'curl' | 'python' | 'javascript'

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/health',
    description: 'Health check. Returns model load status and whether demo mode is active.',
    request: null,
    responseExample: `{
  "status": "ok",
  "model_loaded": true,
  "demo_mode": false
}`,
  },
  {
    method: 'GET',
    path: '/api/model-info',
    description: 'Returns metadata about the loaded emotion model (class names, parameter count, input shape, normalization type).',
    request: null,
    responseExample: `{
  "model": "vgg16_transfer",
  "classes": ["angry", "fear", "happy", "sad", "surprise"],
  "n_classes": 5,
  "parameters": 14714688,
  "input_shape": [48, 48, 3],
  "normalization": "standard_scaler"
}`,
  },
  {
    method: 'POST',
    path: '/api/detect',
    description:
      'Classify emotion from a base64-encoded webcam frame. Runs Haar cascade face detection → VGG16 inference → softmax probabilities.',
    request: `{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB..."
}`,
    responseExample: `{
  "emotions": {
    "angry": 0.03,
    "fear": 0.02,
    "happy": 0.87,
    "sad": 0.04,
    "surprise": 0.04
  },
  "dominant": "happy",
  "confidence": 0.87,
  "face_detected": true,
  "face_box": { "x": 120, "y": 80, "w": 200, "h": 200 }
}`,
  },
  {
    method: 'POST',
    path: '/api/detect-image',
    description:
      'Classify emotion from an uploaded image file (JPEG, PNG). Multipart form data. Useful for testing without a webcam.',
    request: 'Content-Type: multipart/form-data\nField: file (image/jpeg or image/png)',
    responseExample: `{
  "emotions": { "happy": 0.72, "surprise": 0.18, ... },
  "dominant": "happy",
  "confidence": 0.72,
  "face_detected": true,
  "face_box": { "x": 45, "y": 30, "w": 160, "h": 160 }
}`,
  },
]

const CODE_EXAMPLES: Record<Language, string> = {
  curl: `# Health check
curl ${BACKEND_URL}/api/health

# Detect from base64 image
curl -X POST ${BACKEND_URL}/api/detect \\
  -H "Content-Type: application/json" \\
  -d '{"image": "data:image/jpeg;base64,<BASE64_DATA>"}'

# Detect from file upload
curl -X POST ${BACKEND_URL}/api/detect-image \\
  -F "file=@/path/to/face.jpg"`,

  python: `import requests, base64

BASE = "${BACKEND_URL}"

# Health check
r = requests.get(f"{BASE}/api/health")
print(r.json())

# Detect from base64 frame
with open("face.jpg", "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

r = requests.post(f"{BASE}/api/detect",
    json={"image": f"data:image/jpeg;base64,{b64}"})
print(r.json())

# Detect from file upload (easier)
with open("face.jpg", "rb") as f:
    r = requests.post(f"{BASE}/api/detect-image",
        files={"file": ("face.jpg", f, "image/jpeg")})
print(r.json())`,

  javascript: `const BASE = "${BACKEND_URL}";

// Health check
const health = await fetch(\`\${BASE}/api/health\`);
console.log(await health.json());

// Detect from base64 (webcam frame)
const canvas = document.querySelector("canvas");
const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
const resp = await fetch(\`\${BASE}/api/detect\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ image: dataUrl }),
});
console.log(await resp.json());

// Detect from file upload
const formData = new FormData();
formData.append("file", fileInput.files[0]);
const r = await fetch(\`\${BASE}/api/detect-image\`, {
  method: "POST",
  body: formData,
});
console.log(await r.json());`,
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'text-green-400 bg-green-500/10 border-green-500/30',
    POST: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  }
  return (
    <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${colors[method] ?? 'text-white/50 bg-white/5 border-border'}`}>
      {method}
    </span>
  )
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {})
  }
  return (
    <div className="relative group">
      <pre className="bg-black/40 border border-border rounded-lg p-4 text-xs font-mono text-white/70 overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-mono bg-surface border border-border rounded text-white/40 hover:text-white hover:border-accent/50 opacity-0 group-hover:opacity-100 transition-all"
      >
        {copied ? '✓ copied' : 'copy'}
      </button>
    </div>
  )
}

export function ApiDocs() {
  const [language, setLanguage] = useState<Language>('curl')
  const [tryResult, setTryResult] = useState<DetectionResult | null>(null)
  const [tryError, setTryError] = useState<string | null>(null)
  const [tryLoading, setTryLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Revoke Object URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleTry() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setTryLoading(true)
    setTryError(null)
    setTryResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${BACKEND_URL}/api/detect-image`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(err.detail ?? 'Request failed')
      }
      const data = await res.json()
      setTryResult(data as DetectionResult)
    } catch (e) {
      setTryError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setTryLoading(false)
    }
  }

  function handleFileChange() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setTryResult(null)
    setTryError(null)
    const url = URL.createObjectURL(file)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
  }

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <main className="px-4 md:px-6 py-8 max-w-screen-2xl mx-auto space-y-8">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <FadeUpSection>
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-1">
            Reference
          </p>
          <h1 className="text-2xl font-black tracking-tight">API Documentation</h1>
          <p className="text-sm text-white/40 mt-1 font-mono">
            Base URL: <span className="text-accent">{BACKEND_URL}</span>
          </p>
        </FadeUpSection>

        {/* ── Endpoints ──────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {ENDPOINTS.map((ep, i) => (
            <FadeUpSection key={ep.path} delay={i * 0.06}>
              <GlowCard className="overflow-hidden">
                {/* Header */}
                <div className="flex items-start gap-3 px-5 py-4 border-b border-border flex-wrap gap-y-2">
                  <MethodBadge method={ep.method} />
                  <code className="text-sm font-mono text-white">{ep.path}</code>
                  <p className="text-sm text-white/50 flex-1 min-w-full md:min-w-0">
                    {ep.description}
                  </p>
                </div>

                <div className="p-5 grid md:grid-cols-2 gap-5">
                  {/* Request */}
                  {ep.request && (
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-white/40 mb-2">
                        Request Body
                      </p>
                      <CodeBlock code={ep.request} />
                    </div>
                  )}

                  {/* Response */}
                  <div className={!ep.request ? 'md:col-span-2' : ''}>
                    <p className="text-xs font-mono uppercase tracking-wider text-white/40 mb-2">
                      Response
                    </p>
                    <CodeBlock code={ep.responseExample} />
                  </div>
                </div>
              </GlowCard>
            </FadeUpSection>
          ))}
        </div>

        {/* ── Code examples ──────────────────────────────────────────────── */}
        <FadeUpSection delay={0.2}>
          <GlowCard className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
              <p className="text-xs font-mono uppercase tracking-widest text-white/40">
                Code Examples
              </p>
              <div className="flex gap-1">
                {(['curl', 'python', 'javascript'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                      language === lang
                        ? 'bg-accent text-white'
                        : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              <CodeBlock code={CODE_EXAMPLES[language]} />
            </div>
          </GlowCard>
        </FadeUpSection>

        {/* ── Try it ─────────────────────────────────────────────────────── */}
        <FadeUpSection delay={0.22}>
          <GlowCard className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-mono uppercase tracking-widest text-white/40">
                Try it — POST /api/detect-image
              </p>
            </div>
            <div className="p-5">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* File picker */}
                <div className="flex flex-col gap-3 flex-shrink-0">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <GlowButton
                    variant="ghost"
                    onClick={() => fileRef.current?.click()}
                  >
                    Choose Image
                  </GlowButton>
                  <GlowButton
                    disabled={!fileRef.current?.files?.length || tryLoading}
                    onClick={handleTry}
                  >
                    {tryLoading ? 'Analyzing…' : 'Detect Emotion →'}
                  </GlowButton>
                </div>

                {/* Preview */}
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Selected"
                    className="h-32 w-32 object-cover rounded-lg border border-border flex-shrink-0"
                  />
                )}

                {/* Result */}
                {tryError && (
                  <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 font-mono">
                    Error: {tryError}
                  </div>
                )}

                {tryResult && (
                  <div className="flex-1 space-y-3">
                    {tryResult.face_detected ? (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-white/40">Result:</span>
                          {tryResult.dominant && (
                            <EmotionBadge
                              emotion={tryResult.dominant as EmotionKey}
                              confidence={tryResult.confidence}
                              size="md"
                            />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {Object.entries(tryResult.emotions)
                            .sort(([, a], [, b]) => b - a)
                            .map(([emotion, prob]) => (
                              <div key={emotion} className="flex items-center gap-2">
                                <span className="text-xs font-mono text-white/50 w-14">
                                  {emotion}
                                </span>
                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-accent"
                                    style={{ width: `${Math.round(prob * 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-white/50 w-8 text-right">
                                  {Math.round(prob * 100)}%
                                </span>
                              </div>
                            ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-white/50 font-mono">
                        No face detected in this image.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </GlowCard>
        </FadeUpSection>

      </main>

      <footer className="border-t border-border px-6 py-3 text-center mt-8">
        <p className="text-xs text-white/25 font-mono">
          EmoVision API · FastAPI + Uvicorn · MIT License
        </p>
      </footer>
    </div>
  )
}
