import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AdminComment, Page } from '@/lib/types'

// Every admin comment query starts with ['admin', 'comments'], so one invalidation refreshes them all.

const PAGE_SIZE = 20

/** One page of the comments of all products, newest first. */
export function useAdminComments(page: number) {
  return useQuery({
    queryKey: ['admin', 'comments', 'list', page],
    queryFn: () =>
      api.get<Page<AdminComment>>('/admin/comments', { page, page_size: PAGE_SIZE }),
  })
}

/** Deletes any comment. Admins use the same endpoint as the author: `DELETE /comments/:id`. */
export function useDeleteAdminComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => api.delete<void>(`/comments/${commentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] }),
  })
}
