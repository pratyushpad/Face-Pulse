import { Monitor, Camera, Activity, Clock, Settings } from 'lucide-react'

interface NavbarProps {
  onOpenSettings: () => void
}

const NAV_ITEMS = [
  { href: '#detect', label: 'Detect', icon: Camera },
  { href: '#analytics', label: 'Analytics', icon: Activity },
  { href: '#history', label: 'History', icon: Clock },
]

export function Navbar({ onOpenSettings }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-nav bg-base border-b border-border-subtle flex items-center px-6 z-[100]">
      <div className="max-w-content w-full mx-auto flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-text-primary font-semibold text-base no-underline">
          <Monitor className="w-5 h-5 text-accent" />
          EmoVision
        </a>

        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 text-text-secondary text-[13px] font-medium rounded-[6px] no-underline transition-colors duration-150 hover:text-text-primary hover:bg-white/5 cursor-pointer"
            >
              <Icon className="w-4 h-4" />
              {label}
            </a>
          ))}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-text-secondary text-[13px] font-medium rounded-[6px] border-none bg-transparent transition-colors duration-150 hover:text-text-primary hover:bg-white/5 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        <button
          onClick={onOpenSettings}
          className="md:hidden bg-transparent border-none text-text-primary cursor-pointer p-1"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </nav>
  )
}
