import { cn } from '@/lib/utils'
import { Link, useLocation } from 'react-router-dom'
import React, { useState, createContext, useContext } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export interface SidebarLink {
  label: string
  href: string
  icon: React.JSX.Element | React.ReactNode
  badge?: React.ReactNode
}

interface SidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider')
  return context
}

export const SidebarProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [open, setOpen] = useState(false)

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const Sidebar = ({
  children,
}: {
  children: React.ReactNode
}) => (
  <SidebarProvider>
    {children}
  </SidebarProvider>
)

export const SidebarBody = (props: React.ComponentProps<'div'>) => (
  <>
    <DesktopSidebar {...props} />
    <MobileSidebar {...props} />
  </>
)

// CSS-only hover: no JavaScript state, no framer-motion width animation.
// overflow-hidden + w-14 hover:w-60 transition-[width] is handled entirely by the browser —
// immune to the spurious mouseleave events that framer-motion width animation triggers.
export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    className={cn(
      'h-full px-3 py-4 hidden md:flex md:flex-col bg-surface border-r border-border-subtle flex-shrink-0 overflow-hidden w-14 hover:w-60 transition-[width] duration-200 ease-in-out group',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar()
  return (
    <>
      <div
        className="h-12 px-4 flex md:hidden items-center justify-between bg-surface border-b border-border-subtle w-full"
        {...props}
      >
        <span className="text-[15px] font-semibold text-text-primary">FacePulse</span>
        <button
          className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={cn(
              'fixed inset-0 bg-base z-[200] flex flex-col p-6',
              className
            )}
          >
            <button
              className="absolute right-5 top-5 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export const SidebarLinkItem = ({
  link,
  className,
}: {
  link: SidebarLink
  className?: string
}) => {
  const location = useLocation()
  const isActive = location.pathname === link.href

  return (
    <Link
      to={link.href}
      title={link.label}
      className={cn(
        'flex items-center gap-2.5 px-2 py-2 rounded-[6px] transition-colors duration-150 relative',
        isActive
          ? 'bg-hover-overlay text-text-primary'
          : 'text-text-secondary hover:text-text-primary hover:bg-hover-overlay',
        className
      )}
    >
      <span className={cn('flex-shrink-0', isActive ? 'text-accent' : '')}>
        {link.icon}
      </span>

      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[13px] font-medium whitespace-nowrap flex-1">
        {link.label}
      </span>

      {link.badge && (
        <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {link.badge}
        </span>
      )}

      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-accent rounded-r-full" />
      )}
    </Link>
  )
}
