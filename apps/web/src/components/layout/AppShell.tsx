'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { BarChart2, Calculator } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/b50',        label: 'B50 成绩', icon: BarChart2  },
  { href: '/calculator', label: '计算器',   icon: Calculator },
]

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  variant,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  variant: 'sidebar' | 'bottom'
}) {
  if (variant === 'sidebar') {
    return (
      <Link
        href={href}
        className={cn(
          'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
          active
            ? 'text-primary font-semibold'
            : 'text-foreground/55 hover:text-foreground hover:bg-muted/50'
        )}
      >
        {active && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute inset-0 bg-primary/10 rounded-xl"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
          />
        )}
        <Icon size={16} className="relative flex-shrink-0" />
        <span className="relative">{label}</span>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl text-xs transition-colors',
        active ? 'text-primary font-semibold' : 'text-foreground/50'
      )}
    >
      {active && (
        <motion.span
          layoutId="bottom-active"
          className="absolute inset-0 bg-primary/10 rounded-xl"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
        />
      )}
      <Icon size={20} className="relative" />
      <span className="relative leading-none">{label}</span>
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="relative">

      {/* ════════════════════════════════════════════════
          Desktop: fixed left sidebar (lg+)
          ════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-52 z-50 border-r border-border/40 bg-background/55 backdrop-blur-2xl">

        {/* Logo */}
        <div className="px-5 h-14 flex items-center border-b border-border/40 flex-shrink-0">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="font-bold text-lg tracking-tight text-primary">maimai</span>
            <span className="text-foreground/50 font-normal text-lg tracking-tight">Hub</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname.startsWith(href)}
              variant="sidebar"
            />
          ))}
        </nav>

        {/* Theme toggle at bottom */}
        <div className="px-4 py-4 border-t border-border/40 flex-shrink-0">
          <ThemeToggle />
        </div>
      </aside>

      {/* ════════════════════════════════════════════════
          Content area (shifted right on desktop)
          ════════════════════════════════════════════════ */}
      <div className="lg:pl-52 flex flex-col min-h-dvh">

        {/* Mobile: slim top header */}
        <header className="lg:hidden sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md flex-shrink-0">
          <div className="h-14 px-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-primary">maimai</span>
              <span className="text-foreground/50 font-normal text-lg tracking-tight">Hub</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Page content — flex-1 so it fills the column */}
        <div className="flex-1 flex flex-col pb-16 lg:pb-0">
          {children}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          Mobile: fixed bottom tab bar
          ════════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-md">
        <div className="h-16 flex items-center gap-1 px-4">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname.startsWith(href)}
              variant="bottom"
            />
          ))}
        </div>
      </nav>

    </div>
  )
}
