import type { NoteCounts, ScoreState, CriticalPerfect } from './types'

export function calcCriticalPerfect(notes: NoteCounts, score: ScoreState): CriticalPerfect {
  return {
    tap:   notes.tap   - score.tap.prefect   - score.tap.great   - score.tap.good   - score.tap.miss,
    hold:  notes.hold  - score.hold.prefect  - score.hold.great  - score.hold.good  - score.hold.miss,
    slide: notes.slide - score.slide.prefect - score.slide.great - score.slide.good - score.slide.miss,
    touch: notes.touch - score.touch.prefect - score.touch.great - score.touch.good - score.touch.miss,
    break: notes.break - score.break.prefect - score.break.prefect1
           - score.break.great - score.break.great1 - score.break.great2
           - score.break.good  - score.break.miss,
  }
}

export function calcTotalScore(notes: NoteCounts): number {
  return (notes.tap + notes.touch) * 500 +
         notes.hold * 1000 +
         notes.slide * 1500 +
         notes.break * 2500
}

export function calcTotalDXScore(notes: NoteCounts): number {
  return notes.total * 3
}

export function calcFinalScore(
  notes: NoteCounts,
  score: ScoreState,
  critPerf: CriticalPerfect
): number {
  const totalScore = calcTotalScore(notes)
  const totalAddScore = notes.break * 100

  const tapTouchScore =
    (score.tap.prefect + critPerf.tap + score.touch.prefect + critPerf.touch) * 500 +
    (score.tap.great + score.touch.great) * 400 +
    (score.tap.good  + score.touch.good)  * 250

  const holdScore =
    (score.hold.prefect + critPerf.hold) * 1000 +
    score.hold.great * 800 +
    score.hold.good  * 500

  const slideScore =
    (score.slide.prefect + critPerf.slide) * 1500 +
    score.slide.great * 1200 +
    score.slide.good  * 750

  const breakScore =
    (score.break.prefect + score.break.prefect1 + critPerf.break) * 2500 +
    score.break.great  * 2000 +
    score.break.great1 * 1500 +
    score.break.great2 * 1250 +
    score.break.good   * 1000

  const basicRate = ((tapTouchScore + holdScore + slideScore + breakScore) / totalScore) * 100

  const addScore =
    critPerf.break * 100 +
    score.break.prefect  * 75 +
    score.break.prefect1 * 50 +
    (score.break.great + score.break.great1 + score.break.great2) * 40 +
    score.break.good * 30

  const addRate = totalAddScore > 0 ? addScore / totalAddScore : 0

  return basicRate + addRate
}

export function calcStarNumber(
  score: ScoreState,
  critPerf: CriticalPerfect,
  totalDXScore: number
): number {
  const dxScore =
    (critPerf.break + critPerf.tap + critPerf.touch + critPerf.hold + critPerf.slide) * 3 +
    (score.tap.prefect + score.touch.prefect + score.hold.prefect +
     score.slide.prefect + score.break.prefect + score.break.prefect1) * 2 +
    score.tap.great + score.touch.great + score.hold.great + score.slide.great +
    score.break.great + score.break.great1 + score.break.great2

  const rate = totalDXScore > 0 ? dxScore / totalDXScore : 0
  if (rate >= 0.97) return 5
  if (rate >= 0.95) return 4
  if (rate >= 0.93) return 3
  if (rate >= 0.90) return 2
  if (rate >= 0.85) return 1
  return 0
}

export function calcMax(
  noteType: string,
  notes: NoteCounts,
  score: ScoreState,
  currentValue: number
): number {
  switch (noteType) {
    case 'tap':
      return notes.tap   - score.tap.prefect   - score.tap.great   - score.tap.good   - score.tap.miss   + currentValue
    case 'hold':
      return notes.hold  - score.hold.prefect  - score.hold.great  - score.hold.good  - score.hold.miss  + currentValue
    case 'slide':
      return notes.slide - score.slide.prefect - score.slide.great - score.slide.good - score.slide.miss + currentValue
    case 'touch':
      return notes.touch - score.touch.prefect - score.touch.great - score.touch.good - score.touch.miss + currentValue
    case 'break':
      return notes.break - score.break.prefect - score.break.prefect1
             - score.break.great1 - score.break.great2 - score.break.great
             - score.break.good   - score.break.miss + currentValue
    default:
      return 0
  }
}

// Parse clipboard import (25-number format from game)
export function parseClipboardData(text: string, notes: NoteCounts): ScoreState | null {
  let dataList = text.trim().split(/\s+/).map(Number)

  // Handle 21-number format (no CriticalPerfect) — expand to 25
  if (dataList.length === 21) {
    const expanded: number[] = [
      0, ...dataList.slice(0, 4),
      0, ...dataList.slice(4, 8),
      0, ...dataList.slice(8, 12),
      0, ...dataList.slice(12, 16),
      ...dataList.slice(16, 21),
    ]
    dataList = expanded
  }

  if (dataList.length !== 25) return null

  const noteKeys: (keyof NoteCounts)[] = ['tap', 'hold', 'slide', 'touch', 'break']
  for (let i = 0; i < 5; i++) {
    const sum = dataList[i * 5] + dataList[i * 5 + 1] + dataList[i * 5 + 2] +
                dataList[i * 5 + 3] + dataList[i * 5 + 4]
    if (sum !== notes[noteKeys[i]]) return null
  }

  return {
    tap:   { prefect: dataList[1], great: dataList[2], good: dataList[3], miss: dataList[4] },
    hold:  { prefect: dataList[6], great: dataList[7], good: dataList[8], miss: dataList[9] },
    slide: { prefect: dataList[11], great: dataList[12], good: dataList[13], miss: dataList[14] },
    touch: { prefect: dataList[16], great: dataList[17], good: dataList[18], miss: dataList[19] },
    break: { prefect: dataList[21], prefect1: 0, great: dataList[22], great1: 0, great2: 0, good: dataList[23], miss: dataList[24] },
  }
}
