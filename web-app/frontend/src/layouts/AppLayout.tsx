import { useEffect, lazy, Suspense } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Camera, Activity, Clock, Info, Settings } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Sidebar, SidebarBody, SidebarLinkItem } from '@/components/ui/sidebar'
import { SettingsPanel } from '@/components/SettingsPanel'
import { Footer } from '@/components/Footer'
import { LoadingScreen } from '@/components/LoadingScreen'
import { useSettings } from '@/contexts/SettingsContext'
import { useCamera2 } from '@/contexts/CameraContext'
import { useDetection } from '@/contexts/DetectionContext'

const MeshGradient = lazy(() =>
  import('@paper-design/shaders-react').then((m) => ({ default: m.MeshGradient }))
)

export function AppLayout() {
  const { settings, updateSettings, settingsOpen, setSettingsOpen } = useSettings()
  const { videoRef, cameras, switchCamera, selectedCameraId } = useCamera2()
  const { modelsLoaded, loadingProgress, loadingMessage, loadError, isDetecting } = useDetection()

  // Sync camera selection from settings
  useEffect(() => {
    if (settings.cameraId && settings.cameraId !== selectedCameraId) {
      switchCamera(settings.cameraId)
    }
  }, [settings.cameraId, selectedCameraId, switchCamera])

  const navLinks = [
    {
      label: 'Detect',
      href: '/detect',
      icon: <Camera className="w-5 h-5 flex-shrink-0" />,
      badge: isDetecting ? (
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse flex-shrink-0" />
      ) : undefined,
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Activity className="w-5 h-5 flex-shrink-0" />,
    },
    {
      label: 'History',
      href: '/history',
      icon: <Clock className="w-5 h-5 flex-shrink-0" />,
    },
    {
      label: 'About',
      href: '/about',
      icon: <Info className="w-5 h-5 flex-shrink-0" />,
    },
  ]

  if (!modelsLoaded) {
    return (
      <LoadingScreen
        progress={loadingProgress}
        message={loadingMessage}
        error={loadError}
      />
    )
  }

  return (
    <div className="flex h-screen bg-base overflow-hidden relative">
      {/* Animated mesh gradient background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <Suspense fallback={null}>
          <MeshGradient
            className="w-full h-full"
            colors={['#000000', '#0a0a0a', '#0f172a', '#1e3a5f']}
            speed={0.15}
          />
        </Suspense>
      </div>
      {/* Content above gradient */}
      <div className="relative z-10 flex flex-col md:flex-row h-full w-full">
      {/* Hidden video element — keeps stream alive across page navigation */}
      <video
        ref={videoRef}
        className="hidden"
        muted
        playsInline
        autoPlay
      />

      <Sidebar>
        <SidebarBody className="md:h-full">
          {/* Top: Logo + Nav */}
          <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
            {/* Logo — links to home, text shown via CSS group-hover */}
            <Link to="/" className="flex items-center gap-2 px-2 py-2 mb-4 min-w-0">
              <Logo size={20} showText={false} className="flex-shrink-0" />
              <span className="text-[13px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-text-primary">
                FacePulse
              </span>
            </Link>

            {/* Nav links */}
            {navLinks.map((link) => (
              <SidebarLinkItem key={link.href} link={link} />
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom: Settings */}
          <div className="flex flex-col gap-1 border-t border-border-subtle pt-3">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2.5 px-2 py-2 rounded-[6px] text-text-secondary hover:text-text-primary hover:bg-hover-overlay transition-colors duration-150 w-full cursor-pointer"
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className="text-[13px] font-medium whitespace-nowrap text-left opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                Settings
              </span>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main content area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="hidden md:flex h-11 items-center justify-end px-5 border-b border-border-subtle bg-base gap-3 flex-shrink-0">
          {isDetecting && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[11px] font-mono text-text-muted">DETECTING</span>
            </div>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-[6px] text-text-muted hover:text-text-primary hover:bg-hover-overlay transition-colors duration-150 cursor-pointer"
            aria-label="Open settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
          <Footer />
        </main>
      </div>

      {/* Settings slide-over panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        settings={settings}
        cameras={cameras}
        onClose={() => setSettingsOpen(false)}
        onUpdate={updateSettings}
      />
      </div>{/* end z-10 wrapper */}
    </div>
  )
}
