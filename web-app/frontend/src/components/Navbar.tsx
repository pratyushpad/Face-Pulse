import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BACKEND_URL } from '../constants'

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/detect', label: 'Detect' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/model', label: 'Model' },
  { path: '/api', label: 'API' },
]

type BackendStatus = 'checking' | 'ok' | 'demo' | 'offline'

const STATUS_CONFIG: Record<
  BackendStatus,
  { color: string; bg: string; dot: string; label: string }
> = {
  ok: {
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/30',
    dot: 'bg-green-400',
    label: 'Model loaded',
  },
  demo: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    dot: 'bg-yellow-400',
    label: 'Demo mode',
  },
  offline: {
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    dot: 'bg-red-400',
    label: 'Offline',
  },
  checking: {
    color: 'text-white/30',
    bg: 'bg-white/5 border-border',
    dot: 'bg-white/30',
    label: 'Connecting…',
  },
}

export function Navbar() {
  const location = useLocation()
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking')

  useEffect(() => {
    async function checkHealth(): Promise<void> {
      try {
        const res = await fetch(`${BACKEND_URL}/api/health`, {
          signal: AbortSignal.timeout(3000),
        })
        if (!res.ok) throw new Error('non-ok')
        const data = await res.json()
        setBackendStatus(data.demo_mode ? 'demo' : 'ok')
      } catch {
        setBackendStatus('offline')
      }
    }
    checkHealth()
  }, [])

  const cfg = STATUS_CONFIG[backendStatus]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <nav className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-sm font-bold group-hover:bg-accent/30 transition-colors">
            E
          </div>
          <span className="text-white font-bold tracking-tight">EmoVision</span>
        </Link>

        <div className="flex items-center gap-0.5">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 bg-white/10 rounded-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${cfg.bg} ${cfg.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </div>
          <a
            href="https://github.com/Pratyushpad27/fer2013-emotion-detection"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white/70 transition-colors text-xs font-mono hidden sm:block"
          >
            GitHub ↗
          </a>
        </div>
      </nav>
    </header>
  )
}
