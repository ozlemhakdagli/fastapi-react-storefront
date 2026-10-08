import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Taxonomy } from '@/lib/types'

const TAXONOMY_STALE_TIME = 5 * 60 * 1000

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Taxonomy[]>('/categories'),
    staleTime: TAXONOMY_STALE_TIME,
  })
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get<Taxonomy[]>('/brands'),
    staleTime: TAXONOMY_STALE_TIME,
  })
}
