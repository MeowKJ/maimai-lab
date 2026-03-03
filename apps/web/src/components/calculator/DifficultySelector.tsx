'use client'

import { motion } from 'framer-motion'
import type { Song, Difficulty } from '@/lib/calculator/types'
import { cn } from '@/lib/utils'

const DIFF_CONFIG = [
  { name: 'Basic',     color: '#22c55e', textColor: 'text-white' },
  { name: 'Advanced',  color: '#f59e0b', textColor: 'text-white' },
  { name: 'Expert',    color: '#ef4444', textColor: 'text-white' },
  { name: 'Master',    color: '#a855f7', textColor: 'text-white' },
  { name: 'Re:Master', color: '#e9d5ff', textColor: 'text-purple-900' },
]

interface DifficultySelectorProps {
  song: Song
  isSelectedDXType: boolean
  hasTwoTypes: boolean
  selectedLevelIndex: number
  onToggleType: () => void
  onSelectLevel: (index: number) => void
}

export function DifficultySelector({
  song,
  isSelectedDXType,
  hasTwoTypes,
  selectedLevelIndex,
  onToggleType,
  onSelectLevel,
}: DifficultySelectorProps) {
  const diffList: Difficulty[] = isSelectedDXType
    ? song.difficulties.dx
    : song.difficulties.standard

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">步骤二：选择铺面</h2>
        <p className="text-xs text-muted-foreground">{song.title}</p>
      </div>

      {/* DX / Standard toggle */}
      {hasTwoTypes && (
        <div className="flex rounded-xl overflow-hidden border border-border p-1 bg-muted w-fit">
          {(['DX', '标准'] as const).map((label, i) => {
            const active = i === 0 ? isSelectedDXType : !isSelectedDXType
            return (
              <button
                key={label}
                onClick={onToggleType}
                className={cn(
                  'relative px-5 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="type-indicator"
                    className="absolute inset-0 bg-background rounded-lg shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Difficulty buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {DIFF_CONFIG.map((config, index) => {
          const diff = diffList[index]
          if (!diff) return null
          const active = selectedLevelIndex === index

          return (
            <motion.button
              key={index}
              onClick={() => onSelectLevel(index)}
              className={cn(
                'py-2 px-3 rounded-xl text-sm font-bold transition-all border-2',
                active ? 'shadow-lg scale-105' : 'opacity-70 hover:opacity-100'
              )}
              style={{
                backgroundColor: active ? config.color : `${config.color}20`,
                borderColor: config.color,
                color: active ? 'white' : config.color,
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div>{config.name}</div>
              <div className="text-xs font-mono mt-0.5">{diff.level_value}</div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
