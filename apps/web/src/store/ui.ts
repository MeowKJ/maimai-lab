'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song, ScoreState } from '@/lib/calculator/types'
import { DEFAULT_SCORE } from '@/lib/calculator/types'

export type AccentColor = 'blue' | 'green' | 'gold' | 'cyan'

interface UIStore {
  // Theme
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void

  // Calculator
  selectedSong: Song | null
  isSelectedDXType: boolean
  selectedLevelIndex: number
  score: ScoreState
  hasTwoTypes: boolean
  setSelectedSong: (song: Song | null) => void
  setIsSelectedDXType: (v: boolean) => void
  setSelectedLevelIndex: (i: number) => void
  setScore: (score: ScoreState) => void
  resetScore: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      accentColor: 'blue',
      setAccentColor: (color) => set({ accentColor: color }),

      selectedSong: null,
      isSelectedDXType: true,
      selectedLevelIndex: 0,
      score: DEFAULT_SCORE,
      hasTwoTypes: false,

      setSelectedSong: (song) => {
        if (!song) {
          set({ selectedSong: null, score: DEFAULT_SCORE, selectedLevelIndex: 0, hasTwoTypes: false })
          return
        }
        const hasBoth =
          song.difficulties.dx.length > 0 &&
          song.difficulties.standard.length > 0
        const isDX = song.difficulties.dx.length > 0
        set({
          selectedSong: song,
          score: DEFAULT_SCORE,
          selectedLevelIndex: 0,
          hasTwoTypes: hasBoth,
          isSelectedDXType: isDX,
        })
      },
      setIsSelectedDXType: (v) => set({ isSelectedDXType: v, selectedLevelIndex: 0, score: DEFAULT_SCORE }),
      setSelectedLevelIndex: (i) => set({ selectedLevelIndex: i, score: DEFAULT_SCORE }),
      setScore: (score) => set({ score }),
      resetScore: () => set({ score: DEFAULT_SCORE }),
    }),
    {
      name: 'maimai-ui',
      // Only persist accent color across sessions
      partialize: (state) => ({ accentColor: state.accentColor }),
    }
  )
)
