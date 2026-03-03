import { useQuery } from '@tanstack/react-query'
import { isValidNumber } from '@/lib/api/dataProvider'
import { fetchDivingFishB50 } from '@/lib/api/divingFish'
import { fetchLuoXueB50 } from '@/lib/api/luoXue'
import { useSongCatalog } from './useSongCatalog'
import type { Beat50ApiData } from '@/lib/api/types'

export function useB50Data(username: string) {
  // Wait for catalog to finish loading before fetching B50 data,
  // otherwise enrichSongData (notes, ds, starNumber) will be skipped (catalog = null)
  const { data: songCatalog, isSuccess: catalogLoaded } = useSongCatalog()

  return useQuery<Beat50ApiData | null>({
    queryKey: ['b50', username],
    queryFn: () =>
      isValidNumber(username)
        ? fetchLuoXueB50(username, songCatalog ?? null)
        : fetchDivingFishB50(username, songCatalog ?? null),
    enabled: username.trim().length > 0 && catalogLoaded,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })
}
