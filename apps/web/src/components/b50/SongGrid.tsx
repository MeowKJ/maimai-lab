'use client'

import type { SongData } from '@/lib/api/types'
import { SongCard } from './SongCard'

interface SongGridProps {
  b15: SongData[]
  b35: SongData[]
}

function SongSection({
  title,
  songs,
  color,
  startRank,
  emptyText = '暂无成绩',
}: {
  title: string
  songs: SongData[]
  color: string
  startRank: number
  emptyText?: string
}) {
  const sum = songs.reduce((acc, s) => acc + s.ra, 0)

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full" style={{ background: color }} />
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <span className="text-sm text-muted-foreground">({songs.length} 首)</span>
        </div>
        <div className="text-sm font-semibold text-muted-foreground">
          总计 <span className="text-foreground font-bold">{sum}</span>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="flex items-center justify-center py-10 rounded-2xl border border-dashed border-white/20 text-foreground/35 text-sm">
          {emptyText}
        </div>
      ) : (
        /* Plain grid — animations handled by CSS animate-card-in in SongCard */
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {songs.map((song, i) => (
            <SongCard
              key={`${song.id}-${song.type}-${song.level_index}`}
              song={song}
              index={i}
              rank={startRank + i}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function SongGrid({ b15, b35 }: SongGridProps) {
  return (
    <div>
      <SongSection
        title="Best 15 (现版本)"
        songs={b15}
        color="var(--primary)"
        startRank={1}
        emptyText="当前账号暂无现版本成绩（B15 = 0）"
      />
      <SongSection
        title="Best 35 (旧版本)"
        songs={b35}
        color="var(--accent)"
        startRank={1}
      />
    </div>
  )
}
