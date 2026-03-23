import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Camera, Activity, Clock, Info, Settings, LogOut } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Sidebar, SidebarBody, SidebarLinkItem } from '@/components/ui/sidebar'
import { SettingsPanel } from '@/components/SettingsPanel'
import { Footer } from '@/components/Footer'
import { LoadingScreen } from '@/components/LoadingScreen'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useCamera2 } from '@/contexts/CameraContext'
import { useDetection } from '@/contexts/DetectionContext'

export function AppLayout() {
  const { user, signOut } = useAuth()
  const { settings, updateSettings, settingsOpen, setSettingsOpen } = useSettings()
  const { videoRef, cameras, switchCamera, selectedCameraId } = useCamera2()
  const { modelsLoaded, loadingProgress, loadingMessage, loadError, isDetecting } = useDetection()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

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

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? 'U'

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
    <div className="flex h-screen bg-base overflow-hidden">
      {/* Hidden video element — keeps stream alive across page navigation */}
      <video
        ref={videoRef}
        className="hidden"
        muted
        playsInline
        autoPlay
      />

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="h-full">
          {/* Top: Logo + Nav */}
          <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            <div className="px-2 py-2 mb-4">
              <Logo size={20} showText={sidebarOpen} />
            </div>

            {/* Nav links */}
            {navLinks.map((link) => (
              <SidebarLinkItem key={link.href} link={link} />
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom: Settings + Sign Out + User */}
          <div className="flex flex-col gap-1 border-t border-border-subtle pt-3">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2.5 px-2 py-2 rounded-[6px] text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors duration-150 w-full cursor-pointer"
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="text-[13px] font-medium whitespace-pre text-left">Settings</span>
              )}
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-2 py-2 rounded-[6px] text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors duration-150 w-full cursor-pointer"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="text-[13px] font-medium whitespace-pre text-left">Sign Out</span>
              )}
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2.5 px-2 py-2 mt-1">
              <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-semibold text-accent">{avatarLetter}</span>
              </div>
              {sidebarOpen && (
                <span className="text-[12px] text-text-muted truncate max-w-[160px]">
                  {user?.email ?? 'Guest'}
                </span>
              )}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
            className="p-1.5 rounded-[6px] text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors duration-150 cursor-pointer"
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
    </div>
  )
}
