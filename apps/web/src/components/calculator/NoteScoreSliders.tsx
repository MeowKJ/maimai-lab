'use client'

import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { BasicNoteType, BasicScore, ScoreState, NoteCounts } from '@/lib/calculator/types'
import { calcCriticalPerfect, calcMax } from '@/lib/calculator/scoreCalc'

// ── Hold-to-repeat ──────────────────────────────────────────────
function useHoldRepeat(callback: () => void) {
  const cbRef = useRef(callback)
  cbRef.current = callback
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    cbRef.current()
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => cbRef.current(), 80)
    }, 350)
  }, [])

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  return { start, stop }
}

// ── Shared number stepper (exported for Break component) ─────────
export function NumberInput({
  value,
  max,
  onChange,
}: {
  value: number
  max: number
  onChange: (v: number) => void
}) {
  const dec = () => onChange(Math.max(0, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))
  const holdDec = useHoldRepeat(dec)
  const holdInc = useHoldRepeat(inc)

  return (
    <div className="flex items-center gap-1">
      <button
        onMouseDown={holdDec.start}
        onMouseUp={holdDec.stop}
        onMouseLeave={holdDec.stop}
        onTouchStart={(e) => { e.preventDefault(); holdDec.start() }}
        onTouchEnd={holdDec.stop}
        disabled={value <= 0}
        className="select-none w-8 h-8 rounded-lg bg-muted hover:bg-muted-foreground/20 active:scale-90 text-muted-foreground text-sm font-bold flex items-center justify-center transition-all disabled:opacity-25"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10)
          if (!isNaN(v)) onChange(Math.max(0, Math.min(max, v)))
        }}
        onFocus={(e) => e.target.select()}
        className="w-14 h-8 text-center text-sm font-mono font-semibold rounded-lg border border-border bg-card text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onMouseDown={holdInc.start}
        onMouseUp={holdInc.stop}
        onMouseLeave={holdInc.stop}
        onTouchStart={(e) => { e.preventDefault(); holdInc.start() }}
        onTouchEnd={holdInc.stop}
        disabled={value >= max}
        className="select-none w-8 h-8 rounded-lg bg-muted hover:bg-muted-foreground/20 active:scale-90 text-muted-foreground text-sm font-bold flex items-center justify-center transition-all disabled:opacity-25"
      >
        +
      </button>
    </div>
  )
}

// ── Config ───────────────────────────────────────────────────────
const SCORE_ROWS = [
  { key: 'prefect' as const, label: 'Perfect', color: '#f59e0b' },
  { key: 'great'   as const, label: 'Great',   color: '#ec4899' },
  { key: 'good'    as const, label: 'Good',    color: '#4ade80' },
  { key: 'miss'    as const, label: 'Miss',    color: '#9ca3af' },
]

const NOTE_TYPES: { type: BasicNoteType; label: string; accent: string }[] = [
  { type: 'tap',   label: 'Tap',   accent: '#60a5fa' },
  { type: 'hold',  label: 'Hold',  accent: '#fb923c' },
  { type: 'slide', label: 'Slide', accent: '#a78bfa' },
  { type: 'touch', label: 'Touch', accent: '#f472b6' },
]

// ── Component ────────────────────────────────────────────────────
interface NoteScoreSlidersProps {
  notes: NoteCounts
  score: ScoreState
  onScoreChange: (score: ScoreState) => void
}

export function NoteScoreSliders({ notes, score, onScoreChange }: NoteScoreSlidersProps) {
  const critPerf = calcCriticalPerfect(notes, score)

  const update = (noteType: BasicNoteType, key: keyof BasicScore, value: number) => {
    onScoreChange({ ...score, [noteType]: { ...score[noteType], [key]: value } })
  }

  const visibleTypes = NOTE_TYPES.filter(({ type }) => notes[type] > 0)

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-4">步骤三：设置分数</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleTypes.map(({ type, label, accent }) => {
          const total = notes[type]
          const cpCount = critPerf[type]
          const cpPct = total > 0 ? (cpCount / total) * 100 : 0

          return (
            <div key={type} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b border-border"
                style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
              >
                <span className="text-sm font-bold" style={{ color: accent }}>{label}</span>
                <span className="text-xs text-muted-foreground font-mono">共 {total}</span>
              </div>

              <div className="px-4 py-3 space-y-2.5">
                {/* CP row — read-only */}
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
                    {cpCount}
                  </span>
                </div>

                {/* Score input rows */}
                {SCORE_ROWS.map(({ key, label: sLabel, color }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs w-16 font-medium" style={{ color }}>{sLabel}</span>
                    <div className="flex-1 flex justify-end">
                      <NumberInput
                        value={score[type][key]}
                        max={calcMax(type, notes, score, score[type][key])}
                        onChange={(v) => update(type, key, v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
