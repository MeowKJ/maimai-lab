import { useQuery } from '@tanstack/react-query'
import { getCachedTotalSongsInfo } from '@/lib/api/tools'
import type { SongInfo } from '@/lib/api/types'

export function useSongCatalog() {
  return useQuery<Record<number, SongInfo> | null>({
    queryKey: ['song-catalog'],
    queryFn: getCachedTotalSongsInfo,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
