import type { SongInfo } from '@/lib/api/types'
import type { Song } from './types'

export async function fetchAliases(): Promise<AliasEntry[]> {
  const response = await fetch('/api/aliases')
  if (!response.ok) throw new Error('Failed to fetch aliases')
  const data = await response.json()
  return data.content as AliasEntry[]
}

export interface AliasEntry {
  SongID: number
  Alias: string[]
}

export interface SearchIndex {
  songs: SongInfo[]
  aliasMap: Map<number, string[]>
}

/** Convert SongInfo (catalog) to the Song shape used by the calculator */
export function songInfoToSong(info: SongInfo): Song {
  return {
    SongID: info.id,
    title: info.title,
    artist: info.artist,
    genre: info.genre,
    bpm: info.bpm,
    map: null,
    version: info.version,
    difficulties: {
      standard: (info.difficulties?.standard ?? []).map((d) => ({
        type: d.type,
        level: d.level,
        level_value: d.level_value,
        note_designer: d.note_designer,
        notes: {
          total: d.notes.total,
          tap: d.notes.tap,
          hold: d.notes.hold,
          slide: d.notes.slide,
          touch: d.notes.touch,
          break: d.notes.break,
        },
      })),
      dx: (info.difficulties?.dx ?? []).map((d) => ({
        type: d.type,
        level: d.level,
        level_value: d.level_value,
        note_designer: d.note_designer,
        notes: {
          total: d.notes.total,
          tap: d.notes.tap,
          hold: d.notes.hold,
          slide: d.notes.slide,
          touch: d.notes.touch,
          break: d.notes.break,
        },
      })),
    },
  }
}

/** Build a search index from the song catalog + alias entries */
export function buildSearchIndex(
  catalog: Record<number, SongInfo>,
  aliases: AliasEntry[]
): SearchIndex {
  const aliasMap = new Map<number, string[]>()
  for (const entry of aliases) {
    // Normalize: DX variants (id > 10000) map to base id
    const baseId = entry.SongID > 10000 ? entry.SongID % 10000 : entry.SongID
    const existing = aliasMap.get(baseId)
    if (existing) {
      for (const a of entry.Alias) {
        if (!existing.includes(a)) existing.push(a)
      }
    } else {
      aliasMap.set(baseId, [...entry.Alias])
    }
  }
  return { songs: Object.values(catalog), aliasMap }
}

interface ScoredSong {
  song: SongInfo
  score: number
}

/** Instant client-side search. Returns up to 10 Song results sorted by relevance. */
export function searchInIndex(query: string, index: SearchIndex): Song[] {
  const q = query.trim()
  if (!q) return []

  const lower = q.toLowerCase()
  const numericId = /^\d+$/.test(q) ? Number(q) : null

  const scored: ScoredSong[] = []

  for (const song of index.songs) {
    let score = 0
    const titleLower = song.title.toLowerCase()
    const aliases = index.aliasMap.get(song.id) ?? []

    // ID matching
    if (numericId !== null) {
      if (song.id === numericId) score += 150
      else if (String(song.id).includes(q)) score += 100
    }

    // Title matching
    if (titleLower === lower) score += 120
    else if (titleLower.includes(lower)) score += 80

    // Artist matching
    if (song.artist.toLowerCase().includes(lower)) score += 40

    // Alias matching
    for (const alias of aliases) {
      const aliasLower = alias.toLowerCase()
      if (aliasLower === lower) { score += 120; break }
      if (aliasLower.includes(lower)) { score += 60; break }
    }

    if (score > 0) scored.push({ song, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 10).map((s) => songInfoToSong(s.song))
}
