import { useMemo, useCallback } from 'react'
import { useSongCatalog } from './useSongCatalog'
import { useAliases } from './useAliases'
import { buildSearchIndex, searchInIndex } from '@/lib/calculator/songSearch'
import type { AliasEntry } from '@/lib/calculator/songSearch'
import type { Song } from '@/lib/calculator/types'

export function useSongSearch() {
  const { data: catalog } = useSongCatalog()
  const { data: aliases } = useAliases()

  const searchIndex = useMemo(() => {
    if (!catalog) return null
    // aliases may be undefined/empty if Yuzu API is unavailable — search still works via title/artist/ID
    return buildSearchIndex(catalog, (aliases ?? []) as AliasEntry[])
  }, [catalog, aliases])

  const search = useCallback(
    (query: string): Song[] => {
      if (!searchIndex || !query.trim()) return []
      return searchInIndex(query.trim(), searchIndex)
    },
    [searchIndex]
  )

  return { search, isReady: !!searchIndex }
}
