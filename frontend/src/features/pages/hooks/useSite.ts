import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SiteSettings } from '@/lib/types'

/**
 * Public site settings. The layout and the pages use this hook, so they read one cache entry
 * instead of fetching `/site` twice.
 */
export function useSite() {
  return useQuery({
    queryKey: ['site'],
    queryFn: () => api.get<SiteSettings>('/site'),
    staleTime: 5 * 60 * 1000,
  })
}

export interface ContactInput {
  name: string
  email: string
  phone?: string
  subject: string
  body: string
}

/** POST /contact. The answer is `{id}`; the page only needs to know that the message was saved. */
export function useSendContact() {
  return useMutation({
    mutationFn: (input: ContactInput) => api.post<{ id: number }>('/contact', input),
  })
}
