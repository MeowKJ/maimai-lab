import type React from 'react'

// Rating value → CSS style for the rating number (color-coded tiers)
export function getRatingStyle(rating: number): React.CSSProperties {
  if (rating >= 15000) {
    return {
      background: 'linear-gradient(90deg, #f97316, #facc15, #4ade80, #60a5fa, #c084fc, #f97316)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      filter: 'drop-shadow(0 0 10px rgba(250,204,21,0.5))',
    }
  }
  if (rating >= 14500) return { color: '#fde68a', textShadow: '0 0 16px #fbbf2480, 0 0 4px #fbbf24' }
  if (rating >= 14000) return { color: '#fbbf24', textShadow: '0 0 12px #fbbf2450' }
  if (rating >= 13000) return { color: '#e2e8f0', textShadow: '0 0 8px rgba(255,255,255,0.25)' }
  if (rating >= 12000) return { color: '#cd9b6a' }
  if (rating >= 10000) return { color: '#c084fc', textShadow: '0 0 10px #c084fc50' }
  if (rating >= 8000)  return { color: '#f87171', textShadow: '0 0 8px #f8717150' }
  if (rating >= 6000)  return { color: '#fb923c' }
  if (rating >= 4000)  return { color: '#fbbf24' }
  if (rating >= 2000)  return { color: '#4ade80' }
  if (rating >= 1000)  return { color: '#60a5fa' }
  return { color: '#e5e7eb' }
}

// Course rank (段位) labels
export const COURSE_RANK_LABELS: Record<number, string> = {
  1: '初段', 2: '二段', 3: '三段', 4: '四段', 5: '五段',
  6: '六段', 7: '七段', 8: '八段', 9: '九段', 10: '十段', 11: '伝説',
}

// Class rank (阶级) labels
export const CLASS_RANK_LABELS: Record<number, string> = {
  1: 'B', 2: 'A', 3: 'S', 4: 'SS', 5: 'SSS', 6: 'SSS+', 7: '神',
}

// Maps DX rating value to the image asset code string
export function getImgCodeFromDxRating(rating: number): string {
  if (rating >= 15000) return '14'
  if (rating >= 14500) return '13'
  if (rating >= 14000) return '12'
  if (rating >= 13000) return '11'
  if (rating >= 12000) return '10'
  if (rating >= 10000) return '9'
  if (rating >= 8000) return '8'
  if (rating >= 6000) return '7'
  if (rating >= 4000) return '6'
  if (rating >= 2000) return '5'
  if (rating >= 1000) return '4'
  if (rating >= 500) return '3'
  if (rating >= 200) return '2'
  if (rating >= 100) return '1'
  return '1'
}

// Maps achievement rate to the rank image string for calculator
export function getRateImageCode(rate: number): string {
  if (rate >= 100.5) return 'sssp'
  if (rate >= 100) return 'sss'
  if (rate >= 99.5) return 'ssp'
  if (rate >= 99) return 'ss'
  if (rate >= 98) return 'sp'
  if (rate >= 97) return 's'
  if (rate >= 94) return 'aaa'
  if (rate >= 90) return 'aa'
  if (rate >= 80) return 'a'
  if (rate >= 75) return 'bbb'
  if (rate >= 70) return 'bb'
  if (rate >= 60) return 'b'
  return 'd'
}

// Trophy color CSS mapping
export const TROPHY_COLORS: Record<string, string> = {
  normal: '#9ca3af',
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#fbbf24',
  rainbow: 'linear-gradient(135deg, #f87171, #fb923c, #facc15, #4ade80, #60a5fa, #a78bfa)',
}

// Difficulty index → CSS color token
export const DIFF_COLORS = [
  'var(--color-diff-basic)',
  'var(--color-diff-advanced)',
  'var(--color-diff-expert)',
  'var(--color-diff-master)',
  'var(--color-diff-remaster)',
] as const

export const DIFF_NAMES = ['Basic', 'Advanced', 'Expert', 'Master', 'Re:Master'] as const

export const DIFF_BG_CLASSES = [
  'bg-diff-basic',
  'bg-diff-advanced',
  'bg-diff-expert',
  'bg-diff-master',
  'bg-diff-remaster',
] as const
