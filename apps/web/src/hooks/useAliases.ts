import { useQuery } from '@tanstack/react-query'
import { fetchAliases } from '@/lib/calculator/songSearch'
import type { AliasEntry } from '@/lib/calculator/songSearch'

export function useAliases() {
  return useQuery<AliasEntry[]>({
    queryKey: ['aliases'],
    queryFn: fetchAliases,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
}
