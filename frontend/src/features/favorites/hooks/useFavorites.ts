import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import type { Page, ProductListItem } from '@/lib/types'

interface FavoriteIds {
  ids: number[]
}

const idsKey = ['favorites', 'ids'] as const

/** The ids of the logged-in user's favourites, newest first. No request for anonymous visitors. */
export function useFavoriteIds() {
  const { user } = useAuth()
  return useQuery({
    queryKey: idsKey,
    queryFn: () => api.get<FavoriteIds>('/me/favorites/ids'),
    enabled: Boolean(user),
    // Every card has a heart that reads this list. The toggles keep it up to date, so it is not
    // fetched again each time the cards mount (for example on a page change).
    staleTime: 5 * 60 * 1000,
    select: (data) => data.ids,
  })
}

/** Whether the product is one of the logged-in user's favourites. */
export function useIsFavorite(productId: number): boolean {
  return useFavoriteIds().data?.includes(productId) ?? false
}

/** One page of the logged-in user's favourite products (active products only), newest first. */
export function useFavoriteProducts(page: number) {
  return useQuery({
    queryKey: ['favorites', 'list', page],
    queryFn: () => api.get<Page<ProductListItem>>('/me/favorites', { page }),
  })
}

/**
 * Adds (PUT) or removes (DELETE) one favourite. The heart changes at once and goes back if the
 * server refuses the change. Both favourite lists are fetched again once the request has settled.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, favorite }: { productId: number; favorite: boolean }) =>
      favorite
        ? api.put<void>(`/me/favorites/${productId}`)
        : api.delete<void>(`/me/favorites/${productId}`),
    onMutate: async ({ productId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: idsKey })
      const previous = queryClient.getQueryData<FavoriteIds>(idsKey)
      queryClient.setQueryData<FavoriteIds>(idsKey, (old) => {
        if (!old) return old
        const others = old.ids.filter((id) => id !== productId)
        return { ids: favorite ? [productId, ...others] : others }
      })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData<FavoriteIds>(idsKey, context?.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })
}
