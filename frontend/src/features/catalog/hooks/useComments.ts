import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Comment, Page } from '@/lib/types'

/** Comments of one product, newest first. The key prefix `['product', id, 'comments']` is shared by the mutations below. */
export function useComments(productId: number, page: number) {
  return useQuery({
    queryKey: ['product', productId, 'comments', page],
    queryFn: () => api.get<Page<Comment>>(`/products/${productId}/comments`, { page }),
  })
}

export function useAddComment(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => api.post<Comment>(`/products/${productId}/comments`, { body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product', productId, 'comments'] }),
  })
}

export function useDeleteComment(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => api.delete<void>(`/comments/${commentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product', productId, 'comments'] }),
  })
}
