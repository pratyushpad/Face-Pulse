/**
 * ModelInfo — deep-dive into the model architecture and training at /model.
 */

import { useEffect, useState } from 'react'
import { FadeUpSection } from '../components/FadeUpSection'
import { GlowCard } from '../components/GlowCard'
import { BACKEND_URL, EMOTION_COLORS, EMOTION_EMOJIS, EMOTION_LABELS } from '../constants'
import type { ModelInfo as ModelInfoType } from '../types'

const MODELS = [
  {
    name: 'MLP (Pixel Features)',
    type: 'Baseline',
    params: '~2.4M',
    accuracy: '51%',
    notes: 'Raw 48×48 grayscale pixels flattened → 3 dense layers. Struggles with spatial patterns.',
    color: '#6b7280',
  },
  {
    name: 'MLP (Landmark Features)',
    type: 'Structured',
    params: '~180K',
    accuracy: '54%',
    notes: 'dlib 68-point facial landmarks → distances + angles. Compact but loses texture info.',
    color: '#f59e0b',
  },
  {
    name: 'CNN (Scratch)',
    type: 'Convolutional',
    params: '~1.1M',
    accuracy: '62%',
    notes: '3× Conv→BN→Pool blocks → flatten → dense. Learns spatial filters from scratch.',
    color: '#3b82f6',
  },
  {
    name: 'VGG16 Transfer',
    type: 'Transfer Learning',
    params: '~15M',
    accuracy: '67%',
    notes:
      'VGG16 ImageNet weights frozen, custom classification head fine-tuned on FER2013. Best performer.',
    color: '#22c55e',
  },
]

const EMOTION_METRICS = [
  { emotion: 'happy', trainAcc: 88, valAcc: 82 },
  { emotion: 'surprise', trainAcc: 75, valAcc: 70 },
  { emotion: 'neutral', trainAcc: 68, valAcc: 63 },
  { emotion: 'sad', trainAcc: 62, valAcc: 58 },
  { emotion: 'angry', trainAcc: 58, valAcc: 53 },
  { emotion: 'fear', trainAcc: 52, valAcc: 47 },
]

const ARCHITECTURE_STEPS = [
  { label: 'Input', desc: '48×48 grayscale → 48×48×3 (replicated channels)', tag: 'Preprocessing' },
  {
    label: 'VGG16 Base',
    desc: 'Block 1–4 frozen (ImageNet weights). Block 5 fine-tuned.',
    tag: 'Feature Extractor',
  },
  { label: 'Global Avg Pool', desc: 'Reduces 7×7×512 → 512-dim feature vector', tag: 'Pooling' },
  { label: 'Dense 256', desc: 'FC layer with ReLU + Dropout 0.5', tag: 'Head' },
  { label: 'Output', desc: 'Softmax over 5 emotion classes', tag: 'Output' },
]

export function ModelInfo() {
  const [modelInfo, setModelInfo] = useState<ModelInfoType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/model-info`, {
          signal: AbortSignal.timeout(4000),
        })
        if (res.ok) {
          const data = await res.json()
          setModelInfo(data)
        }
      } catch {
        // backend offline — show static info
      } finally {
        setLoading(false)
      }
    }
    fetchInfo()
  }, [])

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <main className="px-4 md:px-6 py-8 max-w-screen-2xl mx-auto space-y-8">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <FadeUpSection>
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-1">
            Architecture
          </p>
          <h1 className="text-2xl font-black tracking-tight">Model Information</h1>
          <p className="text-sm text-white/40 mt-1">
            FER2013 · VGG16 Transfer Learning · 20 training epochs
          </p>
        </FadeUpSection>

        {/* ── Live model info from backend ───────────────────────────────── */}
        {!loading && modelInfo && (
          <FadeUpSection delay={0.05}>
            <GlowCard className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6" glowColor="#22c55e">
              {[
                { label: 'Model', value: modelInfo.model },
                { label: 'Classes', value: modelInfo.n_classes?.toString() ?? '5' },
                {
                  label: 'Parameters',
                  value: modelInfo.parameters
                    ? `${(modelInfo.parameters / 1_000_000).toFixed(1)}M`
                    : 'N/A',
                },
                { label: 'Normalization', value: modelInfo.normalization },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-mono text-white/40 uppercase tracking-wider mb-1">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold font-mono text-white truncate">
                    {item.value}
                  </p>
                </div>
              ))}
            </GlowCard>
          </FadeUpSection>
        )}

        {/* ── Dataset info ───────────────────────────────────────────────── */}
        <FadeUpSection delay={0.08}>
          <div className="grid md:grid-cols-2 gap-6">
            <GlowCard className="p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-4">
                FER2013 Dataset
              </h2>
              <div className="space-y-3 text-sm text-white/70 leading-relaxed">
                <p>
                  The <span className="text-white font-medium">Facial Expression Recognition 2013</span>{' '}
                  dataset contains 35,887 grayscale face images at 48×48 pixels, collected from the
                  web using Google Image Search.
                </p>
                <p>
                  Images span 7 emotion categories. The 5-class subset (angry, fear, happy, sad,
                  surprise) is used here — "disgust" and "neutral" were merged to reduce class
                  imbalance.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { label: 'Total images', value: '35,887' },
                    { label: 'Training set', value: '28,709' },
                    { label: 'Validation', value: '3,589' },
                    { label: 'Test set', value: '3,589' },
                  ].map((s) => (
                    <div key={s.label} className="bg-background rounded-lg px-3 py-2">
                      <p className="text-xs font-mono text-white/40">{s.label}</p>
                      <p className="text-sm font-bold text-white">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlowCard>

            {/* Emotion class metrics */}
            <GlowCard className="p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-4">
                Per-Class Accuracy (VGG16)
              </h2>
              <div className="space-y-3">
                {EMOTION_METRICS.map((m) => {
                  const color = EMOTION_COLORS[m.emotion] ?? '#6b7280'
                  return (
                    <div key={m.emotion}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/60">
                          {EMOTION_EMOJIS[m.emotion]} {EMOTION_LABELS[m.emotion] ?? m.emotion}
                        </span>
                        <span className="text-xs font-mono" style={{ color }}>
                          val {m.valAcc}%
                        </span>
                      </div>
                      <div className="flex gap-1 h-1.5">
                        <div className="flex-1 bg-white/8 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full opacity-60"
                            style={{ width: `${m.trainAcc}%`, backgroundColor: color }}
                          />
                        </div>
                        <div className="flex-1 bg-white/8 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${m.valAcc}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
                <p className="text-xs text-white/25 font-mono mt-2">
                  Left bar = train · Right bar = validation
                </p>
              </div>
            </GlowCard>
          </div>
        </FadeUpSection>

        {/* ── Architecture layers ────────────────────────────────────────── */}
        <FadeUpSection delay={0.1}>
          <GlowCard className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-mono uppercase tracking-widest text-white/40">
                VGG16 Architecture (Fine-Tuned)
              </p>
            </div>
            <div className="flex flex-col">
              {ARCHITECTURE_STEPS.map((step, i) => (
                <div
                  key={step.label}
                  className="flex items-start gap-4 px-5 py-4 border-b border-border/50 last:border-0"
                >
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-xs font-mono text-accent">
                      {i + 1}
                    </div>
                    {i < ARCHITECTURE_STEPS.length - 1 && (
                      <div className="w-px h-4 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{step.label}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent/70">
                        {step.tag}
                      </span>
                    </div>
                    <p className="text-sm text-white/50 mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>
        </FadeUpSection>

        {/* ── Model comparison table ─────────────────────────────────────── */}
        <FadeUpSection delay={0.12}>
          <GlowCard className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-mono uppercase tracking-widest text-white/40">
                All 4 Models — Comparison
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Model', 'Type', 'Parameters', 'Val Accuracy', 'Notes'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-mono uppercase tracking-wider text-white/40"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {MODELS.map((m) => (
                    <tr key={m.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 font-medium text-white/90">{m.name}</td>
                      <td className="px-5 py-3">
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded-full border"
                          style={{
                            color: m.color,
                            backgroundColor: m.color + '15',
                            borderColor: m.color + '40',
                          }}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-white/60">{m.params}</td>
                      <td
                        className="px-5 py-3 font-mono font-bold"
                        style={{ color: m.color }}
                      >
                        {m.accuracy}
                      </td>
                      <td className="px-5 py-3 text-white/50 text-xs max-w-xs">{m.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlowCard>
        </FadeUpSection>

        {/* ── Training details ───────────────────────────────────────────── */}
        <FadeUpSection delay={0.14}>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                label: 'Training Config',
                items: [
                  ['Epochs', '20'],
                  ['Batch size', '64'],
                  ['Optimizer', 'Adam (lr=1e-4)'],
                  ['Loss', 'Categorical Cross-Entropy'],
                  ['Callback', 'ModelCheckpoint (best val_acc)'],
                ],
              },
              {
                label: 'Data Augmentation',
                items: [
                  ['Horizontal flip', 'Yes'],
                  ['Rotation range', '±10°'],
                  ['Width / height shift', '10%'],
                  ['Zoom range', '10%'],
                  ['Shear range', '5%'],
                ],
              },
              {
                label: 'Preprocessing',
                items: [
                  ['Face detection', 'Haar cascade (OpenCV)'],
                  ['Resize', '48×48 grayscale'],
                  ['Normalization', 'StandardScaler (μ=0, σ=1)'],
                  ['VGG input', '48×48×3 (channels replicated)'],
                  ['Fallback norm', '/255 if scaler unavailable'],
                ],
              },
            ].map((section) => (
              <GlowCard key={section.label} className="p-5">
                <p className="text-xs font-mono uppercase tracking-wider text-white/40 mb-3">
                  {section.label}
                </p>
                <dl className="space-y-2">
                  {section.items.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="text-xs text-white/50">{k}</dt>
                      <dd className="text-xs font-mono text-white/80 text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              </GlowCard>
            ))}
          </div>
        </FadeUpSection>

      </main>

      <footer className="border-t border-border px-6 py-3 text-center mt-8">
        <p className="text-xs text-white/25 font-mono">
          Trained on FER2013 · Pratyush Padhy · UCI CS '28
        </p>
      </footer>
    </div>
  )
}
