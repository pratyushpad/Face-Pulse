import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Activity, Clock, ArrowRight, Shield, Monitor } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const MeshGradient = lazy(() =>
  import('@paper-design/shaders-react').then((m) => ({ default: m.MeshGradient }))
)

const features = [
  {
    icon: Camera,
    title: 'Real-time Detection',
    description: 'Face-api.js runs entirely in your browser. No server, no latency, no data upload.',
    href: '/detect',
  },
  {
    icon: Activity,
    title: 'Live Analytics',
    description: 'Session timelines, emotion distributions, and live confidence charts.',
    href: '/dashboard',
  },
  {
    icon: Clock,
    title: 'Session History',
    description: 'Every emotion event logged. Export as CSV or JSON. Filter and search your records.',
    href: '/history',
  },
]

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Shader background — hero only */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Suspense fallback={<div className="absolute inset-0 bg-base" />}>
          <MeshGradient
            className="w-full h-full"
            colors={['#000000', '#0a0a0a', '#0f172a', '#1e3a5f']}
            speed={0.2}
          />
        </Suspense>
        {/* Fade out the shader toward the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-base to-transparent" />
      </div>

      {/* Nav bar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-2.5">
          <Monitor className="w-5 h-5 text-accent" />
          <span className="text-[15px] font-semibold text-text-primary">EmoVision</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/detect"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-[6px] bg-accent border border-accent text-black hover:bg-accent-hover transition-colors duration-150"
            >
              Open App
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-[6px] bg-accent border border-accent text-black hover:bg-accent-hover transition-colors duration-150"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-32 max-w-[760px] mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border-default text-[12px] text-text-muted mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          All processing runs locally in your browser
        </div>

        <h1 className="text-[56px] font-semibold leading-[1.1] tracking-[-0.03em] text-text-primary max-[768px]:text-[36px]">
          Real-time Emotion<br />
          <span className="text-accent">Analysis</span>
        </h1>

        <p className="text-[17px] text-text-secondary mt-6 max-w-[520px] leading-[1.6]">
          Powered by face-api.js and TensorFlow.js. Detects 7 emotions with live confidence scoring,
          session analytics, and persistent history.
        </p>

        <div className="flex items-center gap-3 mt-10 flex-wrap justify-center">
          <Link
            to={user ? '/detect' : '/login'}
            className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-medium rounded-[8px] bg-accent border border-accent text-black hover:bg-accent-hover transition-colors duration-150"
          >
            Start Detecting
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-medium rounded-[8px] bg-transparent border border-border-default text-text-primary hover:bg-white/5 transition-colors duration-150"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="relative z-10 max-w-[1100px] mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <Link
              key={f.href}
              to={user ? f.href : '/login'}
              className="group flex flex-col gap-4 p-6 bg-surface border border-border-subtle rounded-[10px] hover:border-border-default transition-colors duration-200"
            >
              <div className="w-9 h-9 rounded-[8px] bg-accent/10 border border-accent/20 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-text-secondary leading-[1.6]">{f.description}</p>
              </div>
              <div className="flex items-center gap-1 text-[12px] text-text-muted group-hover:text-accent transition-colors duration-150 mt-auto">
                Open
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>

        {/* Privacy badge */}
        <div className="flex items-center justify-center gap-2 mt-10 text-[13px] text-text-muted">
          <Shield className="w-4 h-4" />
          <span>No data leaves your device — camera frames are never uploaded</span>
        </div>
      </section>
    </div>
  )
}
