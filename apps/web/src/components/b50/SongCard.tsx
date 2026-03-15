'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { SongData } from '@/lib/api/types'
import { LevelIndex, FCType, FSType, RateType, SongType } from '@/lib/api/enum'
import { generateImageUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'
import { SongDetailDrawer } from './SongDetailDrawer'

// ─── Difficulty config ────────────────────────────────────────────────────────

const DIFF_COLOR: Record<LevelIndex, string> = {
  [LevelIndex.BASIC]:    '#4ade80',
  [LevelIndex.ADVANCED]: '#fbbf24',
  [LevelIndex.EXPERT]:   '#f87171',
  [LevelIndex.MASTER]:   '#c084fc',
  [LevelIndex.ReMASTER]: '#c4b5fd',
}

const DIFF_LABEL: Record<LevelIndex, string> = {
  [LevelIndex.BASIC]:    'BASIC',
  [LevelIndex.ADVANCED]: 'ADV',
  [LevelIndex.EXPERT]:   'EXP',
  [LevelIndex.MASTER]:   'MAS',
  [LevelIndex.ReMASTER]: 'Re:MAS',
}

// ─── Badges ───────────────────────────────────────────────────────────────────

interface BadgeConfig { label: string; cls: string }

const RATE_CFG: Partial<Record<RateType, BadgeConfig>> = {
  [RateType.SSS_PLUS]: { label: 'SSS+', cls: 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 text-amber-950 shadow-amber-400/40 shadow-sm' },
  [RateType.SSS]:      { label: 'SSS',  cls: 'bg-amber-400 text-amber-950 shadow-amber-400/30 shadow-sm' },
  [RateType.SS_PLUS]:  { label: 'SS+',  cls: 'bg-gradient-to-r from-slate-100 via-white to-slate-100 text-slate-600 shadow-sm' },
  [RateType.SS]:       { label: 'SS',   cls: 'bg-white/80 text-slate-600' },
  [RateType.S_PLUS]:   { label: 'S+',   cls: 'bg-orange-200/90 text-orange-800' },
  [RateType.S]:        { label: 'S',    cls: 'bg-orange-100/80 text-orange-700' },
  [RateType.AAA]:      { label: 'AAA',  cls: 'bg-emerald-100/80 text-emerald-800' },
  [RateType.AA]:       { label: 'AA',   cls: 'bg-teal-100/80 text-teal-800' },
  [RateType.A]:        { label: 'A',    cls: 'bg-green-100/80 text-green-800' },
}

const FC_CFG: Partial<Record<FCType, BadgeConfig>> = {
  [FCType.AP_PLUS]: { label: 'AP+', cls: 'bg-gradient-to-r from-pink-500 via-violet-400 to-sky-400 text-white shadow-violet-400/40 shadow-sm' },
  [FCType.AP]:      { label: 'AP',  cls: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 shadow-amber-400/30 shadow-sm' },
  [FCType.FC_PLUS]: { label: 'FC+', cls: 'bg-gradient-to-r from-cyan-400 to-teal-300 text-cyan-950' },
  [FCType.FC]:      { label: 'FC',  cls: 'bg-cyan-400/80 text-cyan-950' },
}

const FS_CFG: Partial<Record<FSType, BadgeConfig>> = {
  [FSType.FDX_PLUS]:   { label: 'FDX+', cls: 'bg-gradient-to-r from-violet-500 to-purple-400 text-white shadow-violet-400/30 shadow-sm' },
  [FSType.FDX]:        { label: 'FDX',  cls: 'bg-violet-500/80 text-white' },
  [FSType.FS_PLUS]:    { label: 'FS+',  cls: 'bg-gradient-to-r from-green-400 to-emerald-300 text-green-950' },
  [FSType.FS]:         { label: 'FS',   cls: 'bg-emerald-400/80 text-emerald-950' },
  [FSType.SYNC_PLAY]:  { label: 'SYNC', cls: 'bg-white/40 text-foreground/70 backdrop-blur-sm' },
}

function Badge({ cfg }: { cfg?: BadgeConfig }) {
  if (!cfg) return null
  return (
    <span className={cn('px-1.5 py-[3px] rounded-full text-[9px] font-extrabold tracking-wide leading-none', cfg.cls)}>
      {cfg.label}
    </span>
  )
}

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ count, mini }: { count: number; mini?: boolean }) {
  if (count === 0) return null
  return mini ? (
    <span className="text-[11px] font-bold leading-none select-none text-amber-400 drop-shadow-sm">
      <span className="text-[10px]">{count}</span>★
    </span>
  ) : (
    <span className="text-[11px] tracking-tighter leading-none select-none text-amber-400 drop-shadow-sm">
      {'★'.repeat(count)}
    </span>
  )
}

// ─── Song Card ────────────────────────────────────────────────────────────────

interface SongCardProps {
  song: SongData
  index: number
  rank: number
}

const LONG_PRESS_MS = 600
const HOLD_CANCEL_DISTANCE = 14

export function SongCard({ song, index, rank }: SongCardProps) {
  const [isHolding, setIsHolding] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdStartRef = useRef<{ x: number; y: number } | null>(null)
  const holdTriggeredRef = useRef(false)

  const diffColor = DIFF_COLOR[song.level_index] ?? '#c084fc'
  const diffLabel = DIFF_LABEL[song.level_index] ?? 'MAS'
  const coverUrl = generateImageUrl(song.id)

  const clearHoldTimer = useCallback(() => {
    if (!holdTimerRef.current) return
    clearTimeout(holdTimerRef.current)
    holdTimerRef.current = null
  }, [])

  const cancelHold = useCallback(() => {
    clearHoldTimer()
    holdStartRef.current = null
    setIsHolding(false)
  }, [clearHoldTimer])

  const startHold = useCallback((clientX: number, clientY: number) => {
    clearHoldTimer()
    holdTriggeredRef.current = false
    holdStartRef.current = { x: clientX, y: clientY }
    setIsHolding(true)

    holdTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true
      setIsHolding(false)
      setIsDetailOpen(true)
    }, LONG_PRESS_MS)
  }, [clearHoldTimer])

  useEffect(() => {
    return () => clearHoldTimer()
  }, [clearHoldTimer])

  return (
    <>
      <div
        className="group relative overflow-hidden rounded-2xl animate-card-in cursor-default select-none"
        style={{
          animationDelay: `${Math.min(index * 0.028, 0.85)}s`,
          touchAction: 'pan-y',
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse' && e.button !== 0) return
          startHold(e.clientX, e.clientY)
          if (e.currentTarget.setPointerCapture) {
            e.currentTarget.setPointerCapture(e.pointerId)
          }
        }}
        onPointerMove={(e) => {
          if (!isHolding || !holdStartRef.current) return
          const dx = e.clientX - holdStartRef.current.x
          const dy = e.clientY - holdStartRef.current.y
          if (Math.hypot(dx, dy) > HOLD_CANCEL_DISTANCE) {
            cancelHold()
          }
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
          cancelHold()
        }}
        onPointerCancel={cancelHold}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') cancelHold()
        }}
        onContextMenu={(e) => {
          if (isHolding || holdTriggeredRef.current) e.preventDefault()
        }}
      >
        <div
          className={cn(
            'relative h-full transition-[transform,opacity] duration-150 ease-out',
            isHolding && 'scale-[0.98] opacity-90'
          )}
        >
          {/* ── Layer 1: Ambient blurred cover ── */}
          <Image
            src={coverUrl}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover pointer-events-none"
            style={{ transform: 'scale(1.8)', filter: 'blur(28px) saturate(1.6) brightness(0.9)' }}
            unoptimized
          />

          {/* ── Layer 2: Frosted glass overlay ── */}
          <div className="absolute inset-0 bg-white/45 dark:bg-black/55 backdrop-blur-xl" />

          {/* ── Layer 3: Difficulty color radial wash ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 80% at 0% 50%, ${diffColor}22, transparent)`,
            }}
          />

          {/* ── Mobile droplet glow ── */}
          <div
            className="sm:hidden absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 68% 52% at 50% 20%, ${diffColor}30, transparent 74%)`,
            }}
          />

          {/* ── Layer 4: Top glass highlight ── */}
          <div className="hidden sm:block absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/75 to-transparent pointer-events-none" />

          {/* ── Layer 5: Left difficulty bar ── */}
          <div
            className="hidden sm:block absolute inset-y-0 left-0 w-[3px] pointer-events-none"
            style={{ background: `linear-gradient(to bottom, ${diffColor}, ${diffColor}70)` }}
          />

          {/* ── Layer 6: Outer border ── */}
          <div className="absolute inset-0 rounded-2xl border border-white/25 dark:border-white/12 pointer-events-none" />

          {/* ── Long press feedback glow ── */}
          <div
            className={cn(
              'absolute inset-0 pointer-events-none transition-opacity duration-150',
              isHolding ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              background: `radial-gradient(ellipse 64% 54% at 50% 38%, ${diffColor}26, transparent 72%)`,
            }}
          />

          {/* ── Hover lift overlay ── */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/[0.06] pointer-events-none" />

          {/* ══════════════════════════════════════════════════════════════
              Mobile mini layout (< sm): left cover + right info column
              ══════════════════════════════════════════════════════════════ */}
          <div className="relative z-10 sm:hidden flex gap-2.5 p-2.5 pl-3.5">

            {/* Cover thumbnail — left */}
            <div className="relative flex-shrink-0 w-[54px] h-[54px] rounded-xl overflow-hidden shadow-md ring-1 ring-white/30">
              <Image
                src={coverUrl}
                alt={song.title}
                fill
                sizes="54px"
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              {/* Rank */}
              <span className="absolute bottom-[3px] left-1 font-black text-white text-[8px] leading-none drop-shadow">
                #{rank}
              </span>
              {/* Diff chip */}
              <span
                className="absolute top-[3px] right-[3px] font-extrabold text-white text-[7px] leading-none px-[3px] py-[2px] rounded-[3px]"
                style={{ background: `${diffColor}dd`, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {diffLabel}
              </span>
            </div>

            {/* Info column — right */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">

              {/* Title + type */}
              <div className="flex items-start justify-between gap-1">
                <p className="text-[11px] font-bold truncate text-foreground leading-tight drop-shadow-sm">
                  {song.title}
                </p>
                <span
                  className={cn(
                    'flex-shrink-0 text-[7px] font-extrabold px-1 py-[2px] rounded-full leading-none',
                    song.type === SongType.DX
                      ? 'bg-primary/20 text-primary'
                      : 'bg-foreground/10 text-foreground/50'
                  )}
                >
                  {song.type}
                </span>
              </div>

              {/* DS */}
              <span
                className="text-[10px] font-extrabold leading-none"
                style={{ color: diffColor, textShadow: `0 1px 3px rgba(0,0,0,0.45), 0 0 6px ${diffColor}60` }}
              >
                {song.ds > 0 ? song.ds.toFixed(1) : song.level}
              </span>

              {/* Achievement + Ra */}
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[12px] font-black tabular-nums text-foreground leading-none drop-shadow-sm">
                  {song.achievements.toFixed(4)}
                  <span className="text-[9px] font-bold ml-0.5 opacity-70">%</span>
                </span>
                <span className="text-[9px] font-bold text-primary/70 tabular-nums leading-none">
                  Ra <span className="text-[11px] font-black text-primary">{song.ra}</span>
                </span>
              </div>

              {/* Stars + badges */}
              <div className="flex items-center justify-between gap-1">
                <Stars count={song.starNumber} mini />
                <div className="flex items-center gap-[2px]">
                  <Badge cfg={RATE_CFG[song.rate as RateType]} />
                  <Badge cfg={FC_CFG[song.fc as FCType]} />
                  <Badge cfg={FS_CFG[song.fs as FSType]} />
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              Desktop layout (sm+): horizontal cover + info column
              ══════════════════════════════════════════════════════════════ */}
          <div className="relative z-10 hidden sm:flex gap-3 p-3 pl-4">

            {/* Cover thumbnail */}
            <div className="relative flex-shrink-0 w-[76px] h-[76px] rounded-xl overflow-hidden shadow-lg ring-1 ring-white/30 group-hover:ring-white/50 transition-all duration-200">
              <Image
                src={coverUrl}
                alt={song.title}
                fill
                sizes="76px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
              {/* Bottom gradient for badges readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

              {/* Rank badge */}
              <span className="absolute bottom-[5px] left-[5px] font-black text-white text-[9px] leading-none drop-shadow">
                #{rank}
              </span>

              {/* Diff chip */}
              <span
                className="absolute top-[5px] right-[5px] font-extrabold text-white text-[8px] leading-none px-1 py-[2px] rounded-[4px]"
                style={{ background: `${diffColor}dd`, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {diffLabel}
              </span>
            </div>

            {/* Info column */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">

              {/* Row 1: Title + type */}
              <div className="flex items-start justify-between gap-1">
                <p className="text-[13px] font-bold truncate text-foreground leading-tight drop-shadow-sm">
                  {song.title}
                </p>
                <span
                  className={cn(
                    'flex-shrink-0 text-[8px] font-extrabold px-1.5 py-[3px] rounded-full leading-none',
                    song.type === SongType.DX
                      ? 'bg-primary/20 text-primary backdrop-blur-sm'
                      : 'bg-foreground/10 text-foreground/50'
                  )}
                >
                  {song.type}
                </span>
              </div>

              {/* Row 2: Difficulty level */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="text-[11px] font-extrabold leading-none"
                  style={{ color: diffColor, textShadow: `0 1px 3px rgba(0,0,0,0.45), 0 0 8px ${diffColor}60` }}
                >
                  {song.ds > 0 ? song.ds.toFixed(1) : song.level}
                </span>
              </div>

              {/* Row 3: Achievement (hero number) */}
              <div className="flex items-baseline justify-between gap-1 mt-1">
                <span className="text-[16px] font-black tabular-nums text-foreground leading-none drop-shadow-sm">
                  {song.achievements.toFixed(4)}
                  <span className="text-[11px] font-bold ml-0.5 opacity-70">%</span>
                </span>
                <span className="text-[10px] font-bold text-primary/70 tabular-nums leading-none">
                  Ra <span className="text-[13px] font-black text-primary">{song.ra}</span>
                </span>
              </div>

              {/* Row 4: Stars + badges */}
              <div className="flex items-center justify-between gap-1 mt-1.5">
                <Stars count={song.starNumber} />
                <div className="flex items-center gap-[3px] flex-wrap justify-end">
                  <Badge cfg={RATE_CFG[song.rate as RateType]} />
                  <Badge cfg={FC_CFG[song.fc as FCType]} />
                  <Badge cfg={FS_CFG[song.fs as FSType]} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom subtle shadow line ── */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-black/15 to-transparent pointer-events-none" />
        </div>
      </div>
      <SongDetailDrawer
        song={song}
        rank={rank}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  )
}
