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
  animate: boolean
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider')
  return context
}

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => {
  const [openState, setOpenState] = useState(false)
  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => (
  <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
    {children}
  </SidebarProvider>
)

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => (
  <>
    <DesktopSidebar {...props} />
    <MobileSidebar {...(props as React.ComponentProps<'div'>)} />
  </>
)

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar()
  return (
    <motion.div
      className={cn(
        'h-full px-3 py-4 hidden md:flex md:flex-col bg-surface border-r border-border-subtle flex-shrink-0 overflow-hidden',
        className
      )}
      animate={{
        width: animate ? (open ? '240px' : '56px') : '240px',
      }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

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
  const { open, animate } = useSidebar()
  const location = useLocation()
  const isActive = location.pathname === link.href

  return (
    <Link
      to={link.href}
      title={!open ? link.label : undefined}
      className={cn(
        'flex items-center gap-2.5 px-2 py-2 rounded-[6px] group/sidebar transition-colors duration-150 relative',
        isActive
          ? 'bg-white/5 text-text-primary'
          : 'text-text-secondary hover:text-text-primary hover:bg-white/3',
        className
      )}
    >
      <span className={cn('flex-shrink-0', isActive ? 'text-accent' : '')}>
        {link.icon}
      </span>

      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-[13px] font-medium whitespace-pre !p-0 !m-0 flex-1"
      >
        {link.label}
      </motion.span>

      {link.badge && open && (
        <span className="ml-auto">{link.badge}</span>
      )}

      {isActive && (
        <motion.span
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-accent rounded-r-full"
        />
      )}
    </Link>
  )
}
