import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface MyRating {
  rating: number | null
  can_rate: boolean
}

/** The caller's own rating of a product. Fetched only when `enabled` (a logged-in user). */
export function useMyRating(productId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['product', productId, 'my-rating'],
    queryFn: () => api.get<MyRating>(`/me/ratings/${productId}`),
    enabled,
  })
}

export function useSetRating(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rating: number) => api.put<MyRating>(`/me/ratings/${productId}`, { rating }),
    onSuccess: () => invalidateRatings(queryClient, productId),
  })
}

export function useRemoveRating(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete<void>(`/me/ratings/${productId}`),
    onSuccess: () => invalidateRatings(queryClient, productId),
  })
}

// The average (product and list) and the stars shown on the comments depend on every rating. The
// key ['product', id] also covers the comments, my rating and the other queries of that product.
function invalidateRatings(queryClient: QueryClient, productId: number) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['product', productId] }),
    queryClient.invalidateQueries({ queryKey: ['products'] }),
  ])
}
