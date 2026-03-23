import { Routes, Route, Navigate } from 'react-router-dom'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { CameraProvider } from '@/contexts/CameraContext'
import { DetectionProvider } from '@/contexts/DetectionContext'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { DetectPage } from '@/pages/DetectPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { AboutPage } from '@/pages/AboutPage'

export function App() {
  return (
    <SettingsProvider>
      <CameraProvider>
        <DetectionProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
            </Route>

            {/* App routes (sidebar layout) */}
            <Route element={<AppLayout />}>
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
  )
}
