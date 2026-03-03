'use client'

import { motion } from 'framer-motion'
import type { SongData } from '@/lib/api/types'

function calcStats(songs: SongData[]) {
  if (songs.length === 0) return { max: 0, min: 0, avg: 0, sum: 0, range: 0, stdDev: 0 }
  const ratings = songs.map((s) => s.ra)
  const sum = ratings.reduce((a, b) => a + b, 0)
  const avg = sum / ratings.length
  const max = Math.max(...ratings)
  const min = Math.min(...ratings)
  const range = max - min
  const stdDev = Math.sqrt(ratings.reduce((acc, r) => acc + (r - avg) ** 2, 0) / ratings.length)
  return { max, min, avg, sum, range, stdDev }
}

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="tabular-nums"
    >
      {value.toFixed(decimals)}
    </motion.span>
  )
}

function StatCard({ label, value, decimals = 0, accent = false }: {
  label: string; value: number; decimals?: number; accent?: boolean
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border/50 shadow-sm"
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ duration: 0.15 }}
    >
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>
        <AnimatedNumber value={value} decimals={decimals} />
      </div>
    </motion.div>
  )
}

interface StatsPanelProps {
  b15: SongData[]
  b35: SongData[]
}

export function StatsPanel({ b15, b35 }: StatsPanelProps) {
  const s15 = calcStats(b15)
  const s35 = calcStats(b35)

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-lg font-bold text-foreground">统计数据</h2>

      {/* B15 stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground">B15 (现版本)</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <StatCard label="总计" value={s15.sum} accent />
          <StatCard label="最高" value={s15.max} />
          <StatCard label="最低" value={s15.min} />
          <StatCard label="平均" value={s15.avg} decimals={1} />
          <StatCard label="极差" value={s15.range} />
          <StatCard label="标准差" value={s15.stdDev} decimals={2} />
        </div>
      </div>

      {/* B35 stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full bg-accent" />
          <h3 className="text-sm font-semibold text-muted-foreground">B35 (旧版本)</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <StatCard label="总计" value={s35.sum} accent />
          <StatCard label="最高" value={s35.max} />
          <StatCard label="最低" value={s35.min} />
          <StatCard label="平均" value={s35.avg} decimals={1} />
          <StatCard label="极差" value={s35.range} />
          <StatCard label="标准差" value={s35.stdDev} decimals={2} />
        </div>
      </div>

      {/* Total */}
      <motion.div
        className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20"
        whileHover={{ scale: 1.01 }}
      >
        <span className="text-sm font-medium text-foreground">B50 总 Rating</span>
        <span className="text-2xl font-black text-primary">
          <AnimatedNumber value={s15.sum + s35.sum} />
        </span>
      </motion.div>
    </motion.div>
  )
}
