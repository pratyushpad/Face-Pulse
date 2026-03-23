import { useState, lazy, Suspense } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseConfigured } from '@/lib/supabase'
import { Logo } from '@/components/Logo'

const MeshGradient = lazy(() =>
  import('@paper-design/shaders-react').then((m) => ({ default: m.MeshGradient }))
)

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, signOut, user } = useAuth()
  const navigate = useNavigate()

  // No auto-redirect — let user see the page and choose what to do

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
      if (!supabaseConfigured) {
        setError('Supabase not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to web-app/frontend/.env then restart the dev server.')
      } else {
        setError(err)
      }
    } else if (mode === 'signup') {
      setMessage('Account created. Check your email to verify, then sign in.')
      setMode('login')
    }
  }

  // Already signed in — show account panel instead of the form
  if (user) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Suspense fallback={<div className="absolute inset-0 bg-base" />}>
            <MeshGradient className="w-full h-full" colors={['#000000', '#0a0a0a', '#0f172a', '#1e3a5f']} speed={0.3} />
          </Suspense>
        </div>
        <div className="relative z-10 w-full max-w-[380px] mx-4">
          <div className="flex justify-center mb-7"><Logo size={26} showText /></div>
          <div className="relative">
            <div className="absolute -inset-[2px] rounded-[20px] bg-accent/15 blur-2xl opacity-70 pointer-events-none" />
            <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[18px] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.09)]">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full pointer-events-none" />
              <p className="text-[13px] text-text-muted mb-1">Signed in as</p>
              <p className="text-[15px] font-medium text-text-primary mb-6 truncate">{user.email}</p>
              <button
                onClick={() => navigate('/detect')}
                className="w-full px-4 py-2.5 text-[13px] font-medium bg-accent text-black rounded-[8px] hover:bg-accent-hover transition-colors duration-150 mb-3 shadow-[0_0_20px_rgba(96,165,250,0.25)] hover:shadow-[0_0_32px_rgba(96,165,250,0.45)]"
              >
                Open App
              </button>
              <button
                onClick={async () => { await signOut(); }}
                className="w-full px-4 py-2.5 text-[13px] font-medium bg-transparent border border-white/10 text-text-secondary rounded-[8px] hover:text-text-primary hover:bg-white/5 transition-colors duration-150 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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

      {/* Radial depth behind card */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(30,58,95,0.35)_0%,transparent_70%)] pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[380px] mx-4">
        {/* Logo above card */}
        <div className="flex justify-center mb-7">
          <Logo size={26} showText />
        </div>

        {/* Glass card wrapper with glow halo */}
        <div className="relative">
          {/* Blue glow halo */}
          <div className="absolute -inset-[2px] rounded-[20px] bg-accent/15 blur-2xl opacity-70 pointer-events-none" />

          {/* Glass panel */}
          <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[18px] p-8
                          shadow-[0_8px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.09)]">

            {/* Shine edge — top inset highlight */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full pointer-events-none" />

            <h1 className="text-[20px] font-semibold mb-1 text-text-primary">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-[13px] text-text-muted mb-7">
              {mode === 'login'
                ? 'Sign in to access your emotion analytics'
                : 'Start tracking your emotion sessions'}
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-[8px] bg-danger/10 border border-danger/25 text-danger text-[12.5px] leading-[1.5]">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-5 px-4 py-3 rounded-[8px] bg-success/10 border border-success/25 text-success text-[12.5px] leading-[1.5]">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="px-3 py-2.5 text-[13px] bg-white/[0.06] border border-white/10 rounded-[8px]
                             text-text-primary placeholder:text-text-muted/50 outline-none
                             focus:border-accent/50 focus:bg-white/[0.09] transition-all duration-150"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
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
                    className="w-full px-3 py-2.5 pr-10 text-[13px] bg-white/[0.06] border border-white/10 rounded-[8px]
                               text-text-primary placeholder:text-text-muted/50 outline-none
                               focus:border-accent/50 focus:bg-white/[0.09] transition-all duration-150"
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
                className="mt-1 px-4 py-2.5 text-[13px] font-medium bg-accent text-black rounded-[8px]
                           hover:bg-accent-hover transition-all duration-150 cursor-pointer
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-[0_0_20px_rgba(96,165,250,0.25)]
                           hover:shadow-[0_0_32px_rgba(96,165,250,0.45)]"
              >
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/[0.07] text-center">
              <span className="text-[13px] text-text-muted">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError(null)
                  setMessage(null)
                }}
                className="text-[13px] text-accent hover:text-accent-hover transition-colors cursor-pointer"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
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
