import type { Beat50ApiData, Best50SongsData, UserData } from './types'
import type { RawLuoXueResponse, RawLuoXueSong, RawLuoXueSongsData, RawLuoXueUserData } from './lxns'
import { ApiType } from './enum'
import EnumMapper from './enumMapper'
import { enrichBest50Songs } from './tools'

const API_URL = '/api/lxns'

async function fetchFromApi(endpoint: string): Promise<RawLuoXueResponse | null> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
    })
    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

function mapRawSongDataLuoXue(rawSong: RawLuoXueSong) {
  return {
    achievements: rawSong.achievements,
    fc: EnumMapper.getFCType(rawSong.fc),
    fs: EnumMapper.getFSType(rawSong.fs),
    level: rawSong.level,
    level_index: EnumMapper.getLevelIndex(rawSong.level_index),
    level_label: rawSong.level,
    ds: 0, // will be overwritten by enrichSongData if catalog is available
    ra: Math.floor(rawSong.dx_rating),
    rate: EnumMapper.getRateType(rawSong.rate),
    id: rawSong.id,
    title: rawSong.song_name,
    type: EnumMapper.getSongType(rawSong.type),
    dxScore: rawSong.dx_score,
    starNumber: rawSong.dx_star ?? 0, // use API value directly as fallback
    additionalData: {
      notes: { tap: 0, hold: 0, slide: 0, break: 0, touch: 0, total: 0 },
      note_designer: '',
      version: '',
      bpm: 0,
      genre: '',
    },
  }
}

export async function fetchLuoXueB50(
  username: string,
  songCatalog: Record<number, import('./types').SongInfo> | null
): Promise<Beat50ApiData | null> {
  try {
    const userResponse = await fetchFromApi(`/player/qq/${username}`)
    if (!userResponse?.data) return null
    const userDataRaw = userResponse.data as RawLuoXueUserData

    const userData: UserData = {
      username,
      nickname: userDataRaw.name,
      rating: userDataRaw.rating,
      avatarUrl: `/assets/avatar/${userDataRaw.icon.id}`,
      plateId: userDataRaw?.name_plate?.id ?? 0,
      backgroundId: userDataRaw?.frame?.id ?? 0,
      rankId: userDataRaw?.course_rank ?? 0,
      classId: userDataRaw?.class_rank ?? 0,
      starCount: userDataRaw.star ?? 0,
      trophyName: userDataRaw?.trophy?.name ?? '',
      trophyColor: (userDataRaw?.trophy?.color ?? '').toLowerCase(),
      api: ApiType.LXNS,
    }

    const songResponse = await fetchFromApi(
      `/player/${userDataRaw.friend_code}/bests`
    )
    if (!songResponse?.data) return null
    const songDataRaw = songResponse.data as RawLuoXueSongsData

    const rawSongs: Best50SongsData = {
      b15: (songDataRaw.dx ?? []).map(mapRawSongDataLuoXue),
      b35: (songDataRaw.standard ?? []).map(mapRawSongDataLuoXue),
    }

    const songsData = songCatalog
      ? enrichBest50Songs(rawSongs, songCatalog)
      : rawSongs

    return { userData, best50SongsData: songsData }
  } catch (error) {
    console.error('LuoXue fetch error:', error)
    return null
  }
}
