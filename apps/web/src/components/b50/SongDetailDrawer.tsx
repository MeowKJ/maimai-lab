'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X, Calculator as CalcIcon, Music2, Gauge, Drum, ChartSpline } from 'lucide-react'
import type { DifficultyInfo, SongData, SongInfo, SongNotes } from '@/lib/api/types'
import { LevelIndex, FCType, FSType, RateType, SongType } from '@/lib/api/enum'
import { generateImageUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'
import { useSongCatalog } from '@/hooks/useSongCatalog'
import { songInfoToSong } from '@/lib/calculator/songSearch'
import { useUIStore } from '@/store/ui'
import { getVersionString } from '@/lib/api/tools'

// ─── Difficulty maps ──────────────────────────────────────────────────────────

const DIFF_COLOR: Record<LevelIndex, string> = {
  [LevelIndex.BASIC]:    '#4ade80',
  [LevelIndex.ADVANCED]: '#fbbf24',
  [LevelIndex.EXPERT]:   '#f87171',
  [LevelIndex.MASTER]:   '#c084fc',
  [LevelIndex.ReMASTER]: '#c4b5fd',
}

const DIFF_LABEL: Record<LevelIndex, string> = {
  [LevelIndex.BASIC]:    'BASIC',
  [LevelIndex.ADVANCED]: 'ADVANCED',
  [LevelIndex.EXPERT]:   'EXPERT',
  [LevelIndex.MASTER]:   'MASTER',
  [LevelIndex.ReMASTER]: 'Re:MASTER',
}

// ─── Badge configs ────────────────────────────────────────────────────────────

interface BadgeConfig { label: string; cls: string }

const RATE_CFG: Partial<Record<RateType, BadgeConfig>> = {
  [RateType.SSS_PLUS]: { label: 'SSS+', cls: 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 text-amber-950' },
  [RateType.SSS]:      { label: 'SSS',  cls: 'bg-amber-400 text-amber-950' },
  [RateType.SS_PLUS]:  { label: 'SS+',  cls: 'bg-white text-slate-600' },
  [RateType.SS]:       { label: 'SS',   cls: 'bg-white/80 text-slate-600' },
  [RateType.S_PLUS]:   { label: 'S+',   cls: 'bg-orange-200 text-orange-800' },
  [RateType.S]:        { label: 'S',    cls: 'bg-orange-100 text-orange-700' },
  [RateType.AAA]:      { label: 'AAA',  cls: 'bg-emerald-100 text-emerald-800' },
  [RateType.AA]:       { label: 'AA',   cls: 'bg-teal-100 text-teal-800' },
  [RateType.A]:        { label: 'A',    cls: 'bg-green-100 text-green-800' },
}

const FC_CFG: Partial<Record<FCType, BadgeConfig>> = {
  [FCType.AP_PLUS]: { label: 'AP+', cls: 'bg-gradient-to-r from-pink-500 via-violet-400 to-sky-400 text-white' },
  [FCType.AP]:      { label: 'AP',  cls: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950' },
  [FCType.FC_PLUS]: { label: 'FC+', cls: 'bg-gradient-to-r from-cyan-400 to-teal-300 text-cyan-950' },
  [FCType.FC]:      { label: 'FC',  cls: 'bg-cyan-400/80 text-cyan-950' },
}

const FS_CFG: Partial<Record<FSType, BadgeConfig>> = {
  [FSType.FDX_PLUS]:  { label: 'FDX+', cls: 'bg-gradient-to-r from-violet-500 to-purple-400 text-white' },
  [FSType.FDX]:       { label: 'FDX',  cls: 'bg-violet-500/80 text-white' },
  [FSType.FS_PLUS]:   { label: 'FS+',  cls: 'bg-gradient-to-r from-green-400 to-emerald-300 text-green-950' },
  [FSType.FS]:        { label: 'FS',   cls: 'bg-emerald-400/80 text-emerald-950' },
  [FSType.SYNC_PLAY]: { label: 'SYNC', cls: 'bg-white/30 text-foreground/70' },
}

// ─── Note maps ────────────────────────────────────────────────────────────────

const NOTE_ICON_MAP = {
  tap:   '/images/notes/tap.png',
  hold:  '/images/notes/hold.png',
  slide: '/images/notes/slide.png',
  touch: '/images/notes/touch.png',
  break: '/images/notes/break.png',
} as const

const NOTE_LABEL_MAP = {
  tap: 'Tap', hold: 'Hold', slide: 'Slide', touch: 'Touch', break: 'Break',
} as const

type NoteKey = keyof typeof NOTE_ICON_MAP

// ─── Animation variants ───────────────────────────────────────────────────────

const SPRING_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/** Stagger container — mobile gets a 0.18s delay so sheet is visible first */
const mobileContainerV = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.18 } },
}
const desktopContainerV = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
}

/** Generic section: fade + slide up */
const sectionV = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: SPRING_EASE } },
}

/** Cover image: scale up from slight shrink + fade */
const coverV = {
  hidden:  { opacity: 0, scale: 0.82 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: SPRING_EASE } },
}

/** Badge / small item: pop in with scale */
const badgeV = {
  hidden:  { opacity: 0, scale: 0.7 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.22, ease: SPRING_EASE } },
}

/** Badge container — faster stagger */
const badgeContainerV = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DrawerBadge({ cfg }: { cfg?: BadgeConfig }) {
  if (!cfg) return null
  return (
    <motion.span
      variants={badgeV}
      className={cn('px-2.5 py-1 rounded-full text-xs font-extrabold tracking-wide', cfg.cls)}
    >
      {cfg.label}
    </motion.span>
  )
}

function StarBadge({ count }: { count: number }) {
  if (!count) return null
  return (
    <motion.span
      variants={badgeV}
      className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-extrabold text-amber-400"
    >
      {count}★
    </motion.span>
  )
}

function RowItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/8 px-3 py-2.5">
      <p className="text-[11px] text-foreground/55 leading-none">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground leading-tight break-words">{value || '-'}</p>
    </div>
  )
}

function NoteItem({ label, icon, value }: { label: string; icon: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/8 px-2 py-2 flex items-center gap-2">
      <Image src={icon} alt={label} width={20} height={20} className="h-5 w-5 object-contain" unoptimized />
      <div className="min-w-0">
        <p className="text-[10px] text-foreground/50 leading-none">{label}</p>
        <p className="text-sm font-black tabular-nums text-foreground leading-tight">{value}</p>
      </div>
    </div>
  )
}

// ─── DX Score bar ─────────────────────────────────────────────────────────────

function DxScoreBar({
  dxPercent,
  diffColor,
  delayOffset = 0,
}: {
  dxPercent: number
  diffColor: string
  delayOffset?: number
}) {
  return (
    <div>
      <div className="flex justify-between mb-1.5 text-[11px]">
        <span className="text-foreground/55">DX 完成度</span>
        <span className="font-semibold text-foreground">{dxPercent.toFixed(2)}%</span>
      </div>
      <div className="h-[5px] rounded-full bg-white/12 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: diffColor }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(dxPercent, 100)}%` }}
          transition={{ duration: 1.0, delay: 0.35 + delayOffset, ease: SPRING_EASE }}
        />
      </div>
    </div>
  )
}

// ─── Logic helpers ────────────────────────────────────────────────────────────

function resolveDifficulty(song: SongData, songInfo: SongInfo | null): DifficultyInfo | null {
  if (!songInfo) return null
  const preferred = song.type === SongType.DX ? songInfo.difficulties.dx : songInfo.difficulties.standard
  const direct = preferred[song.level_index]
  if (direct) return direct
  const standardDirect = songInfo.difficulties.standard[song.level_index]
  if (standardDirect) return standardDirect
  const dxDirect = songInfo.difficulties.dx[song.level_index]
  if (dxDirect) return dxDirect
  const merged = [...songInfo.difficulties.standard, ...songInfo.difficulties.dx]
  return merged.find((d) => d.level === song.level) ?? null
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SongDetailDrawerProps {
  song: SongData
  rank?: number
  isOpen: boolean
  onClose: () => void
}

export function SongDetailDrawer({ song, rank, isOpen, onClose }: SongDetailDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { data: catalog } = useSongCatalog()
  const setSelectedSong = useUIStore((s) => s.setSelectedSong)
  const setIsSelectedDXType = useUIStore((s) => s.setIsSelectedDXType)
  const setSelectedLevelIndex = useUIStore((s) => s.setSelectedLevelIndex)

  useEffect(() => setMounted(true), [])

  const diffColor = DIFF_COLOR[song.level_index] ?? '#c084fc'
  const diffLabel = DIFF_LABEL[song.level_index] ?? 'MASTER'
  const coverUrl = generateImageUrl(song.id)

  const baseSongId = song.id >= 10000 ? song.id % 10000 : song.id
  const songInfo = catalog?.[song.id] ?? catalog?.[baseSongId] ?? null
  const difficultyInfo = useMemo(() => resolveDifficulty(song, songInfo), [song, songInfo])

  const notes: SongNotes = difficultyInfo?.notes ?? song.additionalData.notes
  const totalNotes = notes.total > 0
    ? notes.total
    : notes.tap + notes.hold + notes.slide + notes.touch + notes.break
  const dxMaxScore = totalNotes > 0 ? totalNotes * 3 : 0
  const dxPercent  = dxMaxScore > 0 ? (song.dxScore / dxMaxScore) * 100 : 0

  const noteDesigner = difficultyInfo?.note_designer || song.additionalData.note_designer || '-'
  const versionText  = song.additionalData.version || (songInfo ? getVersionString(songInfo.version) : '-') || '-'
  const genreText    = song.additionalData.genre || songInfo?.genre || '-'
  const bpmValue     = song.additionalData.bpm  || songInfo?.bpm  || 0
  const artistText   = songInfo?.artist || '-'

  const noteItems: Array<{ key: NoteKey; value: number }> = [
    { key: 'tap',   value: notes.tap   ?? 0 },
    { key: 'hold',  value: notes.hold  ?? 0 },
    { key: 'slide', value: notes.slide ?? 0 },
    { key: 'touch', value: notes.touch ?? 0 },
    { key: 'break', value: notes.break ?? 0 },
  ]

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function openInCalculator() {
    if (!songInfo) return
    const calculatorSong = songInfoToSong(songInfo)
    const useDx = song.type === SongType.DX
    const targetDiffs = useDx ? calculatorSong.difficulties.dx : calculatorSong.difficulties.standard
    const clampedIndex = targetDiffs.length > 0
      ? Math.min(song.level_index, targetDiffs.length - 1)
      : 0
    setSelectedSong(calculatorSong)
    setIsSelectedDXType(useDx)
    setSelectedLevelIndex(clampedIndex)
    onClose()
    router.push('/calculator')
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* ══ Mobile: Bottom Sheet ══ */}
          <motion.div
            key="mobile-sheet"
            className="fixed bottom-0 inset-x-0 z-[201] sm:hidden max-h-[92dvh] overflow-hidden rounded-t-3xl border border-white/15 bg-background/85 backdrop-blur-2xl shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
	          >
	            {/* Blurred cover background */}
	            <div className="absolute inset-0 pointer-events-none">
	              <Image
	                src={coverUrl}
	                alt=""
	                aria-hidden
	                fill
	                sizes="100vw"
	                className="object-cover"
	                style={{ transform: 'scale(1.6)', filter: 'blur(26px) saturate(1.7) brightness(0.42)' }}
	                unoptimized
	              />
	              <div className="absolute inset-0 bg-background/80" />
	              <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 88% 56% at 50% 0%, ${diffColor}24, transparent 74%)` }} />
	            </div>

            <div className="relative z-10 flex max-h-[92dvh] flex-col">
              {/* Handle */}
              <div className="flex items-center justify-center pt-3 pb-1">
                <div className="h-[3px] w-10 rounded-full bg-foreground/25" />
              </div>

              <button
                onClick={onClose}
                className="absolute right-4 top-3 rounded-full bg-white/10 p-1.5 hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X size={16} className="text-foreground/80" />
              </button>

              {/* ── Animated content ── */}
              <motion.div
                className="overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
                variants={mobileContainerV}
                initial="hidden"
                animate="visible"
              >
                {/* Cover + meta row */}
                <motion.div variants={sectionV} className="mt-2 flex gap-3">
                  <motion.div
	                    variants={coverV}
	                    className="relative h-[94px] w-[94px] shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/25 shadow-lg"
	                  >
	                    <Image src={coverUrl} alt={song.title} fill sizes="94px" className="object-cover" unoptimized />
	                  </motion.div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[15px] font-bold leading-snug">{song.title}</p>
                    <p className="mt-1 truncate text-xs text-foreground/65">{artistText}</p>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {rank ? <span className="rounded-full bg-white/10 px-2 py-[3px] text-[10px] font-bold">#{rank}</span> : null}
                      <span className="rounded-full px-2 py-[3px] text-[10px] font-extrabold text-white" style={{ background: diffColor }}>
                        {diffLabel}
                      </span>
                      <span className="text-sm font-black" style={{ color: diffColor }}>
                        {song.ds > 0 ? song.ds.toFixed(1) : song.level}
                      </span>
                      <span className={cn('rounded-full px-1.5 py-[2px] text-[10px] font-bold', song.type === SongType.DX ? 'bg-primary/25 text-primary' : 'bg-white/10 text-foreground/70')}>
                        {song.type}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Stats grid */}
                <motion.div variants={sectionV} className="mt-3 grid grid-cols-2 gap-2.5">
                  <RowItem label="达成率"  value={`${song.achievements.toFixed(4)}%`} />
                  <RowItem label="Rating"  value={song.ra} />
                  <RowItem label="DX Score" value={song.dxScore} />
                  <RowItem label="DX 达成"  value={dxMaxScore > 0 ? `${dxPercent.toFixed(2)}%` : '-'} />
                </motion.div>

                {/* DX Score bar */}
                {dxMaxScore > 0 && (
                  <motion.div
                    variants={sectionV}
                    className="mt-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2.5"
                  >
                    <DxScoreBar dxPercent={dxPercent} diffColor={diffColor} />
                  </motion.div>
                )}

                {/* Badges */}
                <motion.div
                  variants={badgeContainerV}
                  className="mt-3 flex flex-wrap items-center gap-2"
                >
                  <DrawerBadge cfg={RATE_CFG[song.rate as RateType]} />
                  <DrawerBadge cfg={FC_CFG[song.fc as FCType]} />
                  <DrawerBadge cfg={FS_CFG[song.fs as FSType]} />
                  <StarBadge count={song.starNumber} />
                </motion.div>

                {/* Chart details */}
                <motion.div variants={sectionV} className="mt-4 rounded-2xl border border-white/15 bg-white/6 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <ChartSpline size={14} className="text-primary" />
                    <p className="text-sm font-semibold">当前难度谱面详情</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <RowItem label="总物量 ALL" value={totalNotes} />
                    <RowItem label="谱师"       value={noteDesigner} />
                    <RowItem label="版本"        value={versionText} />
                    <RowItem label="分类"        value={genreText} />
                    <RowItem label="BPM"         value={bpmValue > 0 ? bpmValue : '-'} />
                    <RowItem label="乐曲ID"      value={song.id} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {noteItems.map((item) => (
                      <NoteItem
                        key={item.key}
                        label={NOTE_LABEL_MAP[item.key]}
                        icon={NOTE_ICON_MAP[item.key]}
                        value={item.value}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Calculator button */}
                <motion.button
                  variants={sectionV}
                  onClick={openInCalculator}
                  disabled={!songInfo}
                  className="mt-4 mb-1 w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                  whileHover={songInfo ? { scale: 1.015, y: -1 } : {}}
                  whileTap={songInfo ? { scale: 0.97 } : {}}
                >
                  <span className="inline-flex items-center gap-2">
                    <CalcIcon size={16} />
                    在计算器中打开这首乐曲
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* ══ Desktop: Large Popup ══ */}
          <div className="fixed inset-0 z-[201] hidden sm:flex items-center justify-center p-6">
            <motion.div
              key="desktop-modal"
              className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-background/82 shadow-2xl backdrop-blur-2xl"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25, ease: SPRING_EASE }}
              onClick={(e) => e.stopPropagation()}
            >
	              {/* Background */}
	              <div className="absolute inset-0 pointer-events-none">
	                <Image
	                  src={coverUrl}
	                  alt=""
	                  aria-hidden
	                  fill
	                  sizes="100vw"
	                  className="object-cover"
	                  style={{ transform: 'scale(1.8)', filter: 'blur(34px) saturate(1.8) brightness(0.36)' }}
	                  unoptimized
	                />
	                <div className="absolute inset-0 bg-background/84" />
	                <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${diffColor}26, transparent 72%)` }} />
	              </div>

              <button
                onClick={onClose}
                className="absolute right-5 top-5 z-20 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X size={18} className="text-foreground/85" />
              </button>

              {/* ── Animated content ── */}
              <motion.div
                className="relative z-10 p-6 lg:p-7"
                variants={desktopContainerV}
                initial="hidden"
                animate="visible"
              >
                {/* Header: cover + meta */}
                <div className="flex items-start gap-5">
                  <motion.div
	                    variants={coverV}
	                    className="relative h-[172px] w-[172px] shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/25 shadow-xl"
	                  >
	                    <Image src={coverUrl} alt={song.title} fill sizes="172px" className="object-cover" unoptimized />
	                  </motion.div>

                  <div className="min-w-0 flex-1">
                    <motion.div variants={sectionV} className="flex items-center gap-2 flex-wrap">
                      {rank ? <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-bold">#{rank}</span> : null}
                      <span className="rounded-full px-2.5 py-1 text-xs font-extrabold text-white" style={{ background: diffColor }}>
                        {diffLabel}
                      </span>
                      <span className={cn('rounded-full px-2 py-1 text-xs font-bold', song.type === SongType.DX ? 'bg-primary/25 text-primary' : 'bg-white/12 text-foreground/70')}>
                        {song.type}
                      </span>
                    </motion.div>

                    <motion.div variants={sectionV}>
                      <h3 className="mt-2 text-2xl font-black leading-tight text-foreground line-clamp-2">{song.title}</h3>
                      <p className="mt-1 text-sm text-foreground/70">{artistText}</p>
                    </motion.div>

                    <motion.div variants={sectionV} className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <RowItem label="达成率"   value={`${song.achievements.toFixed(4)}%`} />
                      <RowItem label="Rating"   value={song.ra} />
                      <RowItem label="DX Score" value={song.dxScore} />
                      <RowItem label="当前定数"  value={song.ds > 0 ? song.ds.toFixed(1) : song.level} />
                    </motion.div>

                    {/* DX Score bar */}
                    {dxMaxScore > 0 && (
                      <motion.div
                        variants={sectionV}
                        className="mt-3 rounded-xl border border-white/15 bg-white/8 px-3 py-2.5"
                      >
                        <DxScoreBar dxPercent={dxPercent} diffColor={diffColor} delayOffset={0.05} />
                      </motion.div>
                    )}

                    <motion.div variants={badgeContainerV} className="mt-3 flex flex-wrap items-center gap-2.5">
                      <DrawerBadge cfg={RATE_CFG[song.rate as RateType]} />
                      <DrawerBadge cfg={FC_CFG[song.fc as FCType]} />
                      <DrawerBadge cfg={FS_CFG[song.fs as FSType]} />
                      <StarBadge count={song.starNumber} />
                    </motion.div>
                  </div>
                </div>

                {/* Bottom sections */}
                <div className="mt-5 grid grid-cols-12 gap-4">
                  <motion.section variants={sectionV} className="col-span-12 xl:col-span-7 rounded-2xl border border-white/15 bg-white/7 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Drum size={15} className="text-primary" />
                      <p className="text-sm font-semibold">当前难度物量统计</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                      <RowItem label="总物量 ALL"  value={totalNotes} />
                      <RowItem label="DX 理论上限" value={dxMaxScore > 0 ? dxMaxScore : '-'} />
                      <RowItem label="DX 完成率"   value={dxMaxScore > 0 ? `${dxPercent.toFixed(2)}%` : '-'} />
                      {noteItems.map((item) => (
                        <NoteItem
                          key={item.key}
                          label={NOTE_LABEL_MAP[item.key]}
                          icon={NOTE_ICON_MAP[item.key]}
                          value={item.value}
                        />
                      ))}
                    </div>
                  </motion.section>

                  <motion.section variants={sectionV} className="col-span-12 xl:col-span-5 rounded-2xl border border-white/15 bg-white/7 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Music2 size={15} className="text-primary" />
                      <p className="text-sm font-semibold">乐曲与谱面信息</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <RowItem label="版本"   value={versionText} />
                      <RowItem label="分类"   value={genreText} />
                      <RowItem label="BPM"    value={bpmValue > 0 ? bpmValue : '-'} />
                      <RowItem label="乐曲ID" value={song.id} />
                      <RowItem label="谱师"   value={noteDesigner} />
                      <RowItem label="难度标识" value={song.level} />
                    </div>
                  </motion.section>
                </div>

                {/* Footer */}
                <motion.div
                  variants={sectionV}
                  className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/7 p-3.5"
                >
	                  <div className="flex items-center gap-2 text-sm text-foreground/75">
	                    <Gauge size={15} className="text-primary" />
	                    <span>可获取的信息会尽量全部展示，缺失字段会显示为 &quot;-&quot;</span>
	                  </div>
                  <motion.button
                    onClick={openInCalculator}
                    disabled={!songInfo}
                    className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                    whileHover={songInfo ? { y: -1, scale: 1.02 } : {}}
                    whileTap={songInfo ? { scale: 0.97 } : {}}
                  >
                    <span className="inline-flex items-center gap-2">
                      <CalcIcon size={15} />
                      跳转计算器
                    </span>
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
