'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Hash, Music2, Clock, X } from 'lucide-react'
import { isValidNumber } from '@/lib/api/dataProvider'

interface SearchFormProps {
  onSearch: (username: string) => void
  initialValue?: string
  isLoading?: boolean
}

const TAGS = ['B15 · B35 成绩', '段位 · 阶级', '水鱼 · 落雪']
const STORAGE_KEY = 'maimai-recent-searches'
const MAX_RECENTS = 5

function loadRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecent(username: string): string[] {
  const list = loadRecents().filter(s => s !== username)
  list.unshift(username)
  const next = list.slice(0, MAX_RECENTS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

function removeRecent(username: string): string[] {
  const list = loadRecents().filter(s => s !== username)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return list
}

export function SearchForm({ onSearch, initialValue = '', isLoading = false }: SearchFormProps) {
  const [value, setValue] = useState(initialValue)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showRecents, setShowRecents] = useState(false)
  const isQQ = isValidNumber(value)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setRecentSearches(loadRecents())
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    const trimmed = value.trim()
    setRecentSearches(saveRecent(trimmed))
    setShowRecents(false)
    onSearch(trimmed)
  }

  const handleSelectRecent = (username: string) => {
    setValue(username)
    setShowRecents(false)
    setRecentSearches(saveRecent(username))
    onSearch(username)
  }

  const handleRemoveRecent = (e: React.MouseEvent, username: string) => {
    e.stopPropagation()
    setRecentSearches(removeRecent(username))
  }

  const handleFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setShowRecents(true)
  }

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => setShowRecents(false), 150)
  }

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Hero */}
      <div className="text-center mb-8">
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-5"
          style={{ background: 'linear-gradient(135deg in srgb, var(--primary), var(--accent))' }}
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.08, type: 'spring', bounce: 0.45 }}
        >
          <Music2 className="w-7 h-7 text-white" />
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-6xl font-black tracking-tighter leading-none mb-3"
          style={{
            background: 'linear-gradient(135deg in srgb, var(--primary) 0%, var(--accent) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          maimai B50
        </motion.h1>

        <motion.p
          className="text-foreground/45 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
        >
          输入水鱼用户名 或 落雪 QQ 号查询成绩
        </motion.p>
      </div>

      {/* Glass card */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 -z-10 rounded-3xl opacity-35 blur-2xl"
          style={{
            background: 'radial-gradient(ellipse 90% 90% at 50% 60%, var(--primary), transparent)',
            transform: 'scale(1.15)',
          }}
        />

        <div className="bg-white/65 dark:bg-black/45 backdrop-blur-2xl border border-white/55 dark:border-white/12 rounded-3xl p-5 shadow-2xl overflow-visible">
          {/* Top shine */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2.5">
              {/* Input wrapper — relative so dropdown anchors here */}
              <div
                className="flex-1 flex items-center gap-2.5 rounded-2xl bg-black/5 dark:bg-white/6 border border-black/8 dark:border-white/10 px-4 py-3 transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 relative"
                onBlur={handleBlur}
              >
                <span className="flex-shrink-0">
                  {isQQ
                    ? <Hash size={16} className="text-accent" />
                    : <Search size={16} className="text-muted-foreground" />
                  }
                </span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onFocus={handleFocus}
                  placeholder="用户名 / QQ号"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 text-foreground min-w-0"
                  autoComplete="off"
                  autoFocus
                />

                {/* Recent searches dropdown */}
                <AnimatePresence>
                  {showRecents && recentSearches.length > 0 && (
                    <motion.div
                      key="recents"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {recentSearches.map((search) => (
                        <button
                          key={search}
                          type="button"
                          onClick={() => handleSelectRecent(search)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary/8 transition-colors text-left group"
                        >
                          <Clock size={13} className="text-muted-foreground flex-shrink-0" />
                          <span className="flex-1 text-sm text-foreground truncate">{search}</span>
                          <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">
                            {isValidNumber(search) ? '落雪' : '水鱼'}
                          </span>
                          <span
                            role="button"
                            onClick={(e) => handleRemoveRecent(e, search)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/8 dark:hover:bg-white/10"
                          >
                            <X size={11} className="text-muted-foreground" />
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                type="submit"
                disabled={!value.trim() || isLoading}
                className="flex-shrink-0 h-[46px] px-5 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                style={{
                  background: 'linear-gradient(135deg in srgb, var(--primary), var(--accent))',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                {isLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : '查询'}
              </motion.button>
            </div>

            {/* Provider hint */}
            <AnimatePresence>
              {value && (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 border-t border-black/6 dark:border-white/8 text-xs text-center text-muted-foreground">
                    将查询{' '}
                    <span
                      className="font-semibold"
                      style={{ color: isQQ ? 'var(--accent)' : 'var(--primary)' }}
                    >
                      {isQQ ? '落雪咖啡屋 (lxns.net)' : '水鱼查分器 (diving-fish.com)'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </motion.div>

      {/* Feature tags */}
      <motion.div
        className="flex items-center justify-center gap-2 mt-5 flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.38 }}
      >
        {TAGS.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-full text-[11px] text-muted-foreground bg-background/60 border border-border/60 backdrop-blur-sm"
          >
            {tag}
          </span>
        ))}
      </motion.div>
    </motion.div>
  )
}
