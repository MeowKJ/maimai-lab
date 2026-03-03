export interface NoteCounts {
  total: number
  tap: number
  hold: number
  slide: number
  touch: number
  break: number
}

export interface Difficulty {
  type: string
  level: string
  level_value: number
  note_designer: string
  notes: NoteCounts
}

export interface Song {
  SongID: number
  title: string
  artist: string
  genre: string
  bpm: number
  map: string | null
  version: number
  difficulties: {
    standard: Difficulty[]
    dx: Difficulty[]
  }
}

export type BasicNoteType = 'tap' | 'hold' | 'slide' | 'touch'
export type NoteType = 'tap' | 'hold' | 'slide' | 'touch' | 'break'
export type BasicScoreType = 'prefect' | 'great' | 'good' | 'miss'
export type BreakScoreType = 'prefect' | 'prefect1' | 'great' | 'great1' | 'great2' | 'good' | 'miss'

export interface BasicScore {
  prefect: number
  great: number
  good: number
  miss: number
}

export interface BreakScore {
  prefect: number
  prefect1: number
  great: number
  great1: number
  great2: number
  good: number
  miss: number
}

export interface ScoreState {
  tap: BasicScore
  hold: BasicScore
  slide: BasicScore
  touch: BasicScore
  break: BreakScore
}

export interface CriticalPerfect {
  tap: number
  hold: number
  slide: number
  touch: number
  break: number
}

export const DEFAULT_SCORE: ScoreState = {
  tap:   { prefect: 0, great: 0, good: 0, miss: 0 },
  hold:  { prefect: 0, great: 0, good: 0, miss: 0 },
  slide: { prefect: 0, great: 0, good: 0, miss: 0 },
  touch: { prefect: 0, great: 0, good: 0, miss: 0 },
  break: { prefect: 0, prefect1: 0, great: 0, great1: 0, great2: 0, good: 0, miss: 0 },
}
