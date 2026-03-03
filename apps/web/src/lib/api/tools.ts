import type { SongData, SongInfo, Best50SongsData } from './types'
import { SongType } from './enum'

export async function getTotalSongsInfo(): Promise<SongInfo[] | null> {
  try {
    const response = await fetch(
      'https://maimai.lxns.net/api/v0/maimai/song/list?notes=true'
    )
    if (!response.ok) return null
    const data = await response.json()
    return data.songs as SongInfo[]
  } catch {
    return null
  }
}

export async function getCachedTotalSongsInfo(): Promise<Record<number, SongInfo> | null> {
  const songs = await getTotalSongsInfo()
  if (!songs) return null
  return songs.reduce<Record<number, SongInfo>>((acc, song) => {
    acc[song.id] = song
    return acc
  }, {})
}

export function enrichSongData(
  song: SongData,
  totalSongsInfoMap: Record<number, SongInfo>
): SongData {
  // ALWAYS return the song — never filter it out.
  // If catalog lookup fails, return raw data so the song still appears.
  const songInfo = totalSongsInfoMap[song.id]
  if (!songInfo) return song

  const difficulties =
    song.type === SongType.DX
      ? (songInfo.difficulties?.dx ?? [])
      : (songInfo.difficulties?.standard ?? [])

  const diff = difficulties[song.level_index]
  if (!diff) return song

  song.ds = diff.level_value

  // Compute star rating from DX score percentage
  const maxScore = diff.notes.total * 3
  const pct = maxScore > 0 ? (song.dxScore / maxScore) * 100 : 0
  song.starNumber =
    pct >= 97 ? 5
    : pct >= 95 ? 4
    : pct >= 93 ? 3
    : pct >= 90 ? 2
    : pct >= 85 ? 1
    : 0

  song.additionalData.bpm           = songInfo.bpm
  song.additionalData.version       = getVersionString(songInfo.version)
  song.additionalData.genre         = songInfo.genre
  song.additionalData.note_designer = diff.note_designer
  song.additionalData.notes         = diff.notes

  return song
}

export function enrichBest50Songs(
  best50Songs: Best50SongsData,
  totalSongsInfoMap: Record<number, SongInfo>
): Best50SongsData {
  return {
    b15: best50Songs.b15.map((s) => enrichSongData(s, totalSongsInfoMap)),
    b35: best50Songs.b35.map((s) => enrichSongData(s, totalSongsInfoMap)),
  }
}

export function getVersionString(version: number): string {
  const versions = [
    { title: 'maimai',         version: 10000 },
    { title: 'maimai PLUS',    version: 11000 },
    { title: 'GreeN',          version: 12000 },
    { title: 'GreeN PLUS',     version: 13000 },
    { title: 'ORANGE',         version: 14000 },
    { title: 'ORANGE PLUS',    version: 15000 },
    { title: 'PiNK',           version: 16000 },
    { title: 'PiNK PLUS',      version: 17000 },
    { title: 'MURASAKi',       version: 18000 },
    { title: 'MURASAKi PLUS',  version: 18500 },
    { title: 'MiLK',           version: 19000 },
    { title: 'MiLK PLUS',      version: 19500 },
    { title: 'FiNALE',         version: 19900 },
    { title: '舞萌DX',         version: 20000 },
    { title: '舞萌DX 2021',    version: 21000 },
    { title: '舞萌DX 2022',    version: 22000 },
    { title: '舞萌DX 2023',    version: 23000 },
    { title: '舞萌DX 2024',    version: 24000 },
  ]

  for (let i = 0; i < versions.length - 1; i++) {
    if (version >= versions[i].version && version < versions[i + 1].version) {
      return versions[i].title
    }
  }
  if (version >= versions[versions.length - 1].version) return versions[versions.length - 1].title
  if (version < versions[0].version) return versions[0].title
  return ''
}
