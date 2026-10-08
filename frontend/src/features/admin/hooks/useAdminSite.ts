import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SiteSettings } from '@/lib/types'

/**
 * GET /admin/site: the whole settings object that the admin edits. The form copies it once when it
 * mounts, so a copy cached by an earlier visit must not be shown: gcTime 0 drops it on unmount.
 */
export function useAdminSite() {
  return useQuery({
    queryKey: ['admin', 'site'],
    queryFn: () => api.get<SiteSettings>('/admin/site'),
    gcTime: 0,
  })
}

/** PUT /admin/site with the full object. The storefront reads the public copy under ["site"]. */
export function useSaveAdminSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: SiteSettings) => api.put<SiteSettings>('/admin/site', settings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'site'] })
      void queryClient.invalidateQueries({ queryKey: ['site'] })
    },
  })
}
