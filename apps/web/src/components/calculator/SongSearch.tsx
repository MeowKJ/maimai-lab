'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2 } from 'lucide-react'
import { useSongSearch } from '@/hooks/useSongSearch'
import { generateImageUrl } from '@/lib/assets'
import type { Song } from '@/lib/calculator/types'

interface SongSearchProps {
  onSelectSong: (song: Song) => void
}

export function SongSearch({ onSelectSong }: SongSearchProps) {
  const { search, isReady } = useSongSearch()
  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState<Song[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Run search with debounce
  const runSearch = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setCandidates([])
        setOpen(false)
        return
      }
      const results = search(q)
      setCandidates(results)
      setOpen(results.length > 0)
      setActiveIndex(-1)
    },
    [search]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(val), 200)
  }

  const handleSelect = (song: Song) => {
    setQuery(song.title)
    setCandidates([])
    setOpen(false)
    onSelectSong(song)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, candidates.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(candidates[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">步骤一：选取乐曲</h2>
        <p className="text-xs text-muted-foreground">输入别名、歌曲名或 ID 即时搜索</p>
      </div>

      <div ref={containerRef} className="relative">
        <div className="relative">
          {isReady ? (
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          ) : (
            <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin pointer-events-none" />
          )}
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => candidates.length > 0 && setOpen(true)}
            placeholder={isReady ? '乐曲名 / 别名 / ID' : '数据加载中...'}
            disabled={!isReady}
            className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-border bg-card outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
        </div>

        <AnimatePresence>
          {open && candidates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{ transformOrigin: 'top' }}
              className="absolute z-50 top-full mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden"
            >
              {candidates.map((song, i) => (
                <button
                  key={song.SongID}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(song) }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    i === activeIndex ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/50 text-foreground'
                  } ${i > 0 ? 'border-t border-border/50' : ''}`}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={generateImageUrl(song.SongID)}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                  </div>
                  <span className="text-xs text-muted-foreground/60 flex-shrink-0">#{song.SongID}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
