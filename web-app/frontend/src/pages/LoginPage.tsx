import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Monitor, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const MeshGradient = lazy(() =>
  import('@paper-design/shaders-react').then((m) => ({ default: m.MeshGradient }))
)

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/detect', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const err = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password)

    setLoading(false)

    if (err) {
      setError(err)
    } else if (mode === 'signup') {
      setMessage('Account created. Check your email to verify, then log in.')
      setMode('login')
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Shader background */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="absolute inset-0 bg-base" />}>
          <MeshGradient
            className="w-full h-full"
            colors={['#000000', '#0a0a0a', '#0f172a', '#1e3a5f']}
            speed={0.3}
          />
        </Suspense>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[380px] mx-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <Monitor className="w-6 h-6 text-accent" />
          <span className="text-xl font-semibold text-text-primary">EmoVision</span>
        </div>

        <div className="bg-surface/80 backdrop-blur-md border border-border-subtle rounded-[12px] p-7">
          <h1 className="text-xl font-semibold mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-[13px] text-text-muted mb-6">
            {mode === 'login'
              ? 'Sign in to access your emotion analytics'
              : 'Start tracking your emotion sessions'}
          </p>

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-[6px] bg-danger/10 border border-danger/30 text-danger text-[13px] font-mono">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 px-4 py-2.5 rounded-[6px] bg-success/10 border border-success/30 text-success text-[13px]">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="px-3 py-2.5 text-[13px] bg-elevated border border-border-default rounded-[6px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors duration-150"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 text-[13px] bg-elevated border border-border-default rounded-[6px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 px-4 py-2.5 text-[13px] font-medium bg-accent border border-accent text-black rounded-[6px] hover:bg-accent-hover hover:border-accent-hover transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-border-subtle text-center">
            <span className="text-[13px] text-text-muted">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }}
              className="text-[13px] text-accent hover:text-accent-hover transition-colors cursor-pointer"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-[12px] text-text-muted mt-5">
          Continue without an account?{' '}
          <Link to="/detect" className="text-text-secondary hover:text-text-primary transition-colors">
            Skip login
          </Link>
        </p>
      </div>
    </div>
  )
}
