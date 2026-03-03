'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'
import { SongSearch } from '@/components/calculator/SongSearch'
import { DifficultySelector } from '@/components/calculator/DifficultySelector'
import { NoteScoreSliders } from '@/components/calculator/NoteScoreSliders'
import { BreakNoteSliders } from '@/components/calculator/BreakNoteSliders'
import { ScoreSummaryCard } from '@/components/calculator/ScoreSummaryCard'
import { useUIStore } from '@/store/ui'
import {
  calcCriticalPerfect,
  calcFinalScore,
  calcStarNumber,
  calcTotalDXScore,
  parseClipboardData,
} from '@/lib/calculator/scoreCalc'
import { ClipboardPaste, RotateCcw } from 'lucide-react'

export default function CalculatorPage() {
  const {
    selectedSong,
    isSelectedDXType,
    selectedLevelIndex,
    hasTwoTypes,
    score,
    setSelectedSong,
    setIsSelectedDXType,
    setSelectedLevelIndex,
    setScore,
    resetScore,
  } = useUIStore()

  const diffList = selectedSong
    ? isSelectedDXType
      ? selectedSong.difficulties.dx
      : selectedSong.difficulties.standard
    : []

  const currentDiff = diffList[selectedLevelIndex] ?? null

  const { finalScore, starNumber } = useMemo(() => {
    if (!currentDiff) return { finalScore: 0, starNumber: 0 }
    const notes = currentDiff.notes
    const cp = calcCriticalPerfect(notes, score)
    const fs = calcFinalScore(notes, score, cp)
    const totalDX = calcTotalDXScore(notes)
    const stars = calcStarNumber(score, cp, totalDX)
    return { finalScore: fs, starNumber: stars }
  }, [currentDiff, score])

  const handlePasteFromClipboard = async () => {
    if (!currentDiff) return
    try {
      const text = await navigator.clipboard.readText()
      const parsed = parseClipboardData(text, currentDiff.notes)
      if (parsed) {
        setScore(parsed)
      } else {
        alert('剪切板数据格式不正确或与当前乐曲不匹配')
      }
    } catch {
      alert('读取剪切板失败')
    }
  }

  return (
    <main className="relative z-10 flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          <motion.h1
            className="text-2xl font-bold text-foreground"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            分数线计算器
          </motion.h1>

          {/* Step 1: Song search */}
          <motion.div
            className="relative z-40 rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <SongSearch onSelectSong={setSelectedSong} />
          </motion.div>

          <AnimatePresence>
            {selectedSong && (
              <motion.div
                key="song-selected"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Step 2: Difficulty selector */}
                <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6">
                  <DifficultySelector
                    song={selectedSong}
                    isSelectedDXType={isSelectedDXType}
                    hasTwoTypes={hasTwoTypes}
                    selectedLevelIndex={selectedLevelIndex}
                    onToggleType={() => setIsSelectedDXType(!isSelectedDXType)}
                    onSelectLevel={setSelectedLevelIndex}
                  />
                </div>

                {/* Step 3: Score input */}
                {currentDiff && (
                  <div className="space-y-4">
                    {/* Sticky summary card */}
                    <ScoreSummaryCard
                      song={selectedSong}
                      diff={currentDiff}
                      finalScore={finalScore}
                      starNumber={starNumber}
                      isSelectedDXType={isSelectedDXType}
                    />

                    {/* Toolbar: paste button */}
                    <div className="flex justify-end">
                      <motion.button
                        onClick={handlePasteFromClipboard}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <ClipboardPaste size={14} />
                        从剪切板导入
                      </motion.button>
                    </div>

                    {/* Note score inputs */}
                    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 space-y-6">
                      <NoteScoreSliders
                        notes={currentDiff.notes}
                        score={score}
                        onScoreChange={setScore}
                      />
                      <BreakNoteSliders
                        notes={currentDiff.notes}
                        score={score}
                        onScoreChange={setScore}
                      />
                    </div>

                    {/* Footer: hint + reset */}
                    <div className="flex items-center justify-between gap-4 px-1">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        长按 +/− 可快速连续调整，点击输入框可直接键入数值。CritPerf 由其余项自动反推，无需填写。
                        <span className="block mt-1 text-amber-500/80">
                          ⚠ 若谱面含 Touch Hold，因其分值仅计 1 个 Tap，计算结果可能存在微小误差。
                        </span>
                      </p>
                      <motion.button
                        onClick={resetScore}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <RotateCcw size={12} />
                        清空
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
    </main>
  )
}
