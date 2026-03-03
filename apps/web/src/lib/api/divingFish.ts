import type { Beat50ApiData, Best50SongsData, UserData } from './types'
import type { RawFishResponse, RawFishSong } from './fish'
import { ApiType } from './enum'
import EnumMapper from './enumMapper'
import { enrichBest50Songs } from './tools'

const API_URL = 'https://www.diving-fish.com/api/maimaidxprober/query/player'

function mapRawSongDataFish(rawSong: RawFishSong) {
  return {
    achievements: rawSong.achievements,
    fc: EnumMapper.getFCType(rawSong.fc as string),
    fs: EnumMapper.getFSType(rawSong.fs as string),
    level: rawSong.level,
    level_index: rawSong.level_index,
    level_label: rawSong.level_label,
    ds: rawSong.ds,
    ra: rawSong.ra,
    rate: EnumMapper.getRateType(rawSong.rate),
    id: rawSong.song_id % 10000,
    title: rawSong.title,
    type: EnumMapper.getSongType(rawSong.type),
    dxScore: rawSong.dxScore,
    starNumber: 0,
    additionalData: {
      notes: { tap: 0, hold: 0, slide: 0, break: 0, touch: 0, total: 0 },
      note_designer: '',
      version: '',
      bpm: 0,
      genre: '',
    },
  }
}

export async function fetchDivingFishB50(
  username: string,
  songCatalog: Record<number, import('./types').SongInfo> | null
): Promise<Beat50ApiData | null> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, b50: true }),
    })
    if (!response.ok) return null

    const rawData: RawFishResponse = await response.json()

    const ugd = rawData.user_general_data

    const userData: UserData = {
      username,
      nickname: rawData.nickname,
      rating: rawData.rating,
      avatarUrl: '/assets/images/avatar',
      plateId: 0,
      backgroundId: 0,
      // additional_rating is the course rank (段位): 0=none, 1-10=初段-十段,
      // 11-20=真初段-真十段, 21=真皆传, 22=里皆传
      rankId: rawData.additional_rating ?? ugd?.course_rank ?? 0,
      classId: ugd?.class_rank ?? 0,
      starCount: ugd?.star ?? 0,
      trophyName: '',
      trophyColor: '',
      api: ApiType.FISH,
    }

    let songsData: Best50SongsData = {
      b15: rawData.charts.dx.map(mapRawSongDataFish),
      b35: rawData.charts.sd.map(mapRawSongDataFish),
    }

    if (songCatalog) {
      songsData = await enrichBest50Songs(songsData, songCatalog)
    }

    return { userData, best50SongsData: songsData }
  } catch (error) {
    console.error('DivingFish fetch error:', error)
    return null
  }
}
