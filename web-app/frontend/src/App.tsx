import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { CameraProvider } from '@/contexts/CameraContext'
import { DetectionProvider } from '@/contexts/DetectionContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { DetectPage } from '@/pages/DetectPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { AboutPage } from '@/pages/AboutPage'

export function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CameraProvider>
          <DetectionProvider>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
              </Route>

              {/* Protected routes (sidebar layout) */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="detect" element={<DetectPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="about" element={<AboutPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DetectionProvider>
        </CameraProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
