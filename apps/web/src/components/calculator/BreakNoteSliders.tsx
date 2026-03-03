'use client'

import { motion } from 'framer-motion'
import type { BreakScore, ScoreState, NoteCounts } from '@/lib/calculator/types'
import { calcCriticalPerfect, calcMax } from '@/lib/calculator/scoreCalc'
import { NumberInput } from './NoteScoreSliders'

const BREAK_GROUPS = [
  {
    label: 'Perfect',
    color: '#f59e0b',
    rows: [
      { key: 'prefect'  as const, label: 'P-50' },
      { key: 'prefect1' as const, label: 'P-100' },
    ],
  },
  {
    label: 'Great',
    color: '#ec4899',
    rows: [
      { key: 'great'  as const, label: 'G-600' },
      { key: 'great1' as const, label: 'G-700' },
      { key: 'great2' as const, label: 'G-850' },
    ],
  },
  {
    label: 'Good / Miss',
    color: '#9ca3af',
    rows: [
      { key: 'good' as const, label: 'Good' },
      { key: 'miss' as const, label: 'Miss' },
    ],
  },
]

interface BreakNoteSlidersProps {
  notes: NoteCounts
  score: ScoreState
  onScoreChange: (score: ScoreState) => void
}

export function BreakNoteSliders({ notes, score, onScoreChange }: BreakNoteSlidersProps) {
  const critPerf = calcCriticalPerfect(notes, score)
  const total = notes.break
  const cpPct = total > 0 ? (critPerf.break / total) * 100 : 0

  const update = (key: keyof BreakScore, value: number) => {
    onScoreChange({ ...score, break: { ...score.break, [key]: value } })
  }

  if (total === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-border"
        style={{ borderLeftColor: '#eab308', borderLeftWidth: 3 }}
      >
        <span className="text-sm font-bold text-yellow-500">Break</span>
        <span className="text-xs text-muted-foreground font-mono">共 {total}</span>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* CP row */}
        <div className="flex items-center gap-3">
          <span className="text-xs w-16 font-semibold text-amber-500">CritPerf</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${cpPct}%` }}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
          <span className="text-xs font-mono w-10 text-right font-semibold text-amber-500">
            {critPerf.break}
          </span>
        </div>

        {/* Grouped score rows */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BREAK_GROUPS.map(({ label, color, rows }) => (
            <div key={label}>
              <div
                className="text-xs font-semibold mb-2.5 pb-1.5 border-b border-border"
                style={{ color }}
              >
                {label}
              </div>
              <div className="space-y-2">
                {rows.map(({ key, label: rowLabel }) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground flex-shrink-0">{rowLabel}</span>
                    <NumberInput
                      value={score.break[key]}
                      max={calcMax('break', notes, score, score.break[key])}
                      onChange={(v) => update(key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
