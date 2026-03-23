import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseConfigured } from '@/lib/supabase'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-muted font-mono text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Loading...
        </div>
      </div>
    )
  }

  // If Supabase isn't configured, allow access (guest mode)
  if (!supabaseConfigured) return <>{children}</>

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
