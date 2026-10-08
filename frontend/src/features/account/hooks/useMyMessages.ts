import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Message, Page } from '@/lib/types'

/** The messages the logged-in customer sent or received, newest first. */
export function useMyMessages(page: number) {
  return useQuery({
    queryKey: ['my-messages', page],
    queryFn: () => api.get<Page<Message>>('/me/messages', { page }),
  })
}
