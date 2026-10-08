import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { MyComment, Page } from '@/lib/types'

/** The logged-in customer's own comments, newest first. */
export function useMyComments(page: number) {
  return useQuery({
    queryKey: ['my-comments', page],
    queryFn: () => api.get<Page<MyComment>>('/me/comments', { page }),
  })
}

/** Deletes one of the customer's own comments. The server answers 204 (no body). */
export function useDeleteMyComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => api.delete<void>(`/comments/${commentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-comments'] }),
  })
}
