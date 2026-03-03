'use client'

import { useTheme } from 'next-themes'
import { useUIStore, type AccentColor } from '@/store/ui'
import { Moon, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const ACCENT_PRESETS: { key: AccentColor; label: string; color: string }[] = [
  { key: 'blue',  label: '蓝',  color: 'oklch(0.52 0.22 250)' },
  { key: 'green', label: '绿',  color: 'oklch(0.56 0.20 155)' },
  { key: 'gold',  label: '金',  color: 'oklch(0.72 0.18 85)'  },
  { key: 'cyan',  label: '青',  color: 'oklch(0.62 0.18 200)' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { accentColor, setAccentColor } = useUIStore()

  return (
    <div className="flex items-center gap-2">
      {/* Accent color dots */}
      <div className="flex items-center gap-1.5">
        {ACCENT_PRESETS.map(({ key, label, color }) => (
          <motion.button
            key={key}
            onClick={() => setAccentColor(key)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            title={label}
            className={cn(
              'w-5 h-5 rounded-full ring-offset-background transition-all',
              accentColor === key
                ? 'ring-2 ring-offset-2 ring-foreground/50'
                : 'opacity-60 hover:opacity-100'
            )}
            style={{ background: color }}
          />
        ))}
      </div>

      {/* Light/dark toggle */}
      <motion.button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-8 h-8 flex items-center justify-center rounded-full text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === 'dark' ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={16} />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={16} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
