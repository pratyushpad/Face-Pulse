/**
 * Landing — hero page at "/" showcasing EmoVision.
 */

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FadeUpSection } from '../components/FadeUpSection'
import { GlowCard } from '../components/GlowCard'
import { AnimatedCounter } from '../components/AnimatedCounter'

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Camera Capture',
    description:
      'Your browser accesses the webcam via the getUserMedia API. No video data is ever uploaded — frames are processed locally before sending.',
    icon: '📷',
    color: '#3b82f6',
  },
  {
    step: '02',
    title: 'AI Inference',
    description:
      'OpenCV detects the face region. A VGG16 network fine-tuned on FER2013 classifies the 48×48 grayscale crop into one of 5 emotion categories.',
    icon: '🧠',
    color: '#a855f7',
  },
  {
    step: '03',
    title: 'Live Results',
    description:
      'Softmax confidence scores stream back in real time. The UI renders animated bar charts, a live timeline, and session statistics.',
    icon: '📊',
    color: '#22c55e',
  },
]

const TECH_STACK = [
  { label: 'TensorFlow / Keras', tag: 'ML' },
  { label: 'VGG16 Transfer Learning', tag: 'Architecture' },
  { label: 'FER2013 Dataset', tag: 'Data' },
  { label: 'FastAPI + Uvicorn', tag: 'Backend' },
  { label: 'OpenCV Haar Cascade', tag: 'Vision' },
  { label: 'React + TypeScript', tag: 'Frontend' },
  { label: 'Chart.js + Framer Motion', tag: 'UI' },
  { label: '4 Models Compared', tag: 'Research' },
]

const EMOTION_DEMO = [
  { label: 'Happy', emoji: '😄', pct: 87, color: '#22c55e' },
  { label: 'Surprise', emoji: '😲', pct: 62, color: '#f59e0b' },
  { label: 'Neutral', emoji: '😐', pct: 51, color: '#6b7280' },
  { label: 'Sad', emoji: '😢', pct: 38, color: '#3b82f6' },
  { label: 'Angry', emoji: '😠', pct: 24, color: '#ef4444' },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-white font-sans">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 max-w-screen-2xl mx-auto">
        {/* Ambient glow */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, #3b82f640 0%, #a855f720 50%, transparent 80%)',
          }}
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-mono mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            FER2013 · VGG16 Transfer Learning · &lt;500ms Inference
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6"
          >
            Real-Time{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 50%, #ec4899 100%)',
              }}
            >
              Emotion
            </span>{' '}
            Detection
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            I trained 4 neural networks on FER2013 (35K face images) and deployed the best one —
            a fine-tuned VGG16 — as a real-time webcam app.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <Link
              to="/detect"
              className="px-7 py-3 bg-accent hover:bg-accent-light text-white font-semibold rounded-xl shadow-glow transition-all hover:shadow-glow-md hover:scale-105 active:scale-95"
            >
              Try Live Demo →
            </Link>
            <Link
              to="/api"
              className="px-7 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-border font-semibold rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              View API Docs
            </Link>
          </motion.div>
        </div>

        {/* Demo bar chart preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="relative z-10 mt-16 max-w-xl mx-auto"
        >
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-mono uppercase tracking-widest text-white/40">
                Emotion Distribution
              </p>
              <span className="text-xs font-mono text-green-400 flex items-center gap-1.5">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-green-400"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                LIVE
              </span>
            </div>
            <div className="space-y-3">
              {EMOTION_DEMO.map((e, i) => (
                <div key={e.label} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{e.emoji}</span>
                  <span className="text-xs font-mono text-white/50 w-14">{e.label}</span>
                  <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: e.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${e.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + i * 0.1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs font-mono w-8 text-right" style={{ color: e.color }}>
                    {e.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <FadeUpSection>
        <div className="border-y border-border bg-surface/50">
          <div className="max-w-screen-2xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 5, suffix: '', label: 'Emotion Classes', note: 'angry · fear · happy · sad · surprise' },
              { value: 35887, suffix: '+', label: 'Training Images', note: 'FER2013 dataset' },
              { value: 500, suffix: 'ms', label: 'Max Latency', note: 'real-time inference' },
              { value: 4, suffix: '', label: 'Models Compared', note: 'MLP · CNN · VGG16' },
            ].map((stat, i) => (
              <FadeUpSection key={stat.label} delay={i * 0.08}>
                <p className="text-4xl font-black text-accent font-mono">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={1200} />
                </p>
                <p className="text-sm font-semibold text-white/80 mt-1">{stat.label}</p>
                <p className="text-xs font-mono text-white/30 mt-0.5">{stat.note}</p>
              </FadeUpSection>
            ))}
          </div>
        </div>
      </FadeUpSection>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-6 py-20">
        <FadeUpSection className="text-center mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
            Pipeline
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">How it works</h2>
        </FadeUpSection>

        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <FadeUpSection key={step.step} delay={i * 0.12}>
              <GlowCard className="p-6 h-full" glowColor={step.color}>
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: step.color + '18', border: `1px solid ${step.color}40` }}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-xs font-mono text-white/30 mb-1">{step.step}</p>
                    <h3 className="text-base font-bold mb-2" style={{ color: step.color }}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-white/55 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </GlowCard>
            </FadeUpSection>
          ))}
        </div>
      </section>

      {/* ── Tech stack ─────────────────────────────────────────────────────── */}
      <FadeUpSection>
        <div className="border-t border-border bg-surface/30">
          <div className="max-w-screen-2xl mx-auto px-6 py-16">
            <p className="text-center text-xs font-mono uppercase tracking-widest text-white/30 mb-8">
              Built with
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {TECH_STACK.map((t) => (
                <span
                  key={t.label}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full text-sm text-white/70 hover:text-white hover:border-accent/40 transition-colors"
                >
                  <span className="text-xs font-mono text-accent/60">{t.tag}</span>
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </FadeUpSection>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <FadeUpSection>
        <section className="max-w-screen-2xl mx-auto px-6 py-24 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-black tracking-tight mb-4">
              Try it yourself
            </h2>
            <p className="text-white/50 mb-10 leading-relaxed">
              Open your webcam, and the model runs inference on every frame.
              All processing happens server-side — nothing is stored.
            </p>
            <Link
              to="/detect"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-light text-white font-semibold rounded-xl shadow-glow transition-all hover:shadow-glow-md hover:scale-105 active:scale-95 text-base"
            >
              Start Detecting
              <span>→</span>
            </Link>
          </div>
        </section>
      </FadeUpSection>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-5 text-center">
        <p className="text-xs text-white/25 font-mono">
          Built by Pratyush Padhy · UCI CS '28 · FER2013 CNN + VGG16 Transfer Learning
        </p>
      </footer>
    </div>
  )
}
