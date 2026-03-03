import { ApiType, FCType, FSType, SongType, RateType, LevelIndex } from './enum'

class EnumMapper {
  public static getApiType(api: string): ApiType {
    switch (api.toUpperCase()) {
      case 'LXNS': return ApiType.LXNS
      case 'FISH': return ApiType.FISH
      default: return ApiType.LXNS
    }
  }

  public static getFCType(fc: string): FCType {
    if (!fc) return FCType.NONE
    switch (fc.toLowerCase()) {
      case 'app': return FCType.AP_PLUS
      case 'ap': return FCType.AP
      case 'fcp': return FCType.FC_PLUS
      case 'fc': return FCType.FC
      default: return FCType.NONE
    }
  }

  public static getFSType(fs: string): FSType {
    if (!fs) return FSType.NONE
    switch (fs.toLowerCase()) {
      case 'fsdp': return FSType.FDX_PLUS
      case 'fsd': return FSType.FDX
      case 'fsp': return FSType.FS_PLUS
      case 'fs': return FSType.FS
      case 'sync': return FSType.SYNC_PLAY
      default: return FSType.NONE
    }
  }

  public static getRateType(rate: string): RateType {
    switch (rate.toUpperCase()) {
      case 'SSSP': return RateType.SSS_PLUS
      case 'SSS': return RateType.SSS
      case 'SSP': return RateType.SS_PLUS
      case 'SS': return RateType.SS
      case 'SP': return RateType.S_PLUS
      case 'S': return RateType.S
      case 'AAA': return RateType.AAA
      case 'AA': return RateType.AA
      case 'A': return RateType.A
      case 'BBB': return RateType.BBB
      case 'BB': return RateType.BB
      case 'B': return RateType.B
      case 'C': return RateType.C
      default: return RateType.D
    }
  }

  public static getSongType(type: string): SongType {
    const upper = type.toUpperCase()
    if (upper.includes('DX')) return SongType.DX
    if (upper.includes('SD') || upper.includes('STANDARD')) return SongType.STANDARD
    if (upper.includes('UT')) return SongType.UTAGE
    return SongType.STANDARD
  }

  public static getLevelIndex(level: string | number): LevelIndex {
    if (typeof level === 'number') {
      return [LevelIndex.BASIC, LevelIndex.ADVANCED, LevelIndex.EXPERT, LevelIndex.MASTER, LevelIndex.ReMASTER][level] ?? LevelIndex.BASIC
    }
    switch (level.toUpperCase()) {
      case 'BASIC': return LevelIndex.BASIC
      case 'ADVANCED': return LevelIndex.ADVANCED
      case 'EXPERT': return LevelIndex.EXPERT
      case 'MASTER': return LevelIndex.MASTER
      case 'RE:MASTER': return LevelIndex.ReMASTER
      default: return LevelIndex.BASIC
    }
  }
}

export default EnumMapper
