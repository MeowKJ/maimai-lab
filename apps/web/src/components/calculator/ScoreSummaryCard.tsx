'use client'

import { motion } from 'framer-motion'
import { generateImageUrl } from '@/lib/assets'
import { getRateImageCode } from '@/lib/ratingCode'
import { Star } from 'lucide-react'
import type { Song, Difficulty } from '@/lib/calculator/types'

interface ScoreSummaryCardProps {
  song: Song
  diff: Difficulty
  finalScore: number
  starNumber: number
  isSelectedDXType: boolean
}

const STAR_COLORS = ['#9ca3af', '#4ade80', '#4ade80', '#fbbf24', '#fbbf24', '#fbbf24']

export function ScoreSummaryCard({
  song,
  diff,
  finalScore,
  starNumber,
  isSelectedDXType,
}: ScoreSummaryCardProps) {
  const rateCode = getRateImageCode(finalScore)

  return (
    <motion.div
      className="sticky top-16 z-30"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-xl p-4">
        <div className="flex items-center gap-3">
          {/* Cover */}
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 ring-2 ring-primary/20">
            <img
              src={generateImageUrl(song.SongID)}
              alt={song.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{song.title}</p>
            <p className="text-xs text-muted-foreground">
              {diff.level_value} · {isSelectedDXType ? 'DX' : '标准'}
            </p>
            {/* Stars */}
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={i < starNumber ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}
                />
              ))}
            </div>
          </div>

          {/* Score + rate image */}
          <div className="text-right flex-shrink-0">
            <motion.div
              key={finalScore.toFixed(0)}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-2xl font-black text-primary tabular-nums"
            >
              {finalScore.toFixed(4)}
            </motion.div>
            <img
              src={`/assets/rank/${rateCode}`}
              alt={rateCode}
              className="h-5 object-contain ml-auto mt-0.5"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
