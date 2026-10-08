import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Dashboard } from '@/lib/types'

// Admin query keys start with ['admin'], so they never share a cache entry with customer queries.

/** The counts shown on the admin dashboard. */
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get<Dashboard>('/admin/dashboard'),
  })
}
