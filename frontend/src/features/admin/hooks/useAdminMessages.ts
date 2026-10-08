import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AdminMessage, Message, Page } from '@/lib/types'

// Every admin message query starts with ['admin', 'messages'], so one invalidation refreshes them all.

const PAGE_SIZE = 20

export interface AdminMessageFilters {
  status?: Message['status']
  direction?: Message['direction']
  page: number
}

export interface AdminMessageUpdateInput {
  status?: Message['status']
  admin_note?: string | null
}

export interface AdminMessageReplyInput {
  user_id: number
  subject: string
  body: string
}

/** One page of the admin inbox, newest first, filtered by status and direction. */
export function useAdminMessages(filters: AdminMessageFilters) {
  return useQuery({
    queryKey: ['admin', 'messages', 'list', filters],
    queryFn: () =>
      api.get<Page<AdminMessage>>('/admin/messages', {
        status: filters.status,
        direction: filters.direction,
        page: filters.page,
        page_size: PAGE_SIZE,
      }),
  })
}

/** One message. Reading it has no side effects: the status does not change. */
export function useAdminMessage(id: number) {
  return useQuery({
    queryKey: ['admin', 'messages', 'detail', id],
    queryFn: () => api.get<AdminMessage>(`/admin/messages/${id}`),
  })
}

/** Changes the status or the admin note of one message. */
export function useUpdateAdminMessage(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AdminMessageUpdateInput) =>
      api.patch<AdminMessage>(`/admin/messages/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] }),
  })
}

export function useDeleteAdminMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/admin/messages/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] }),
  })
}

/** Sends a reply to a registered customer. The server stores it as an outbound message. */
export function useReplyToMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AdminMessageReplyInput) =>
      api.post<AdminMessage>('/admin/messages', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] }),
  })
}
