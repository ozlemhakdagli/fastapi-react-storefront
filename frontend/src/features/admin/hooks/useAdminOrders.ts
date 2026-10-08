import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AdminOrder, AdminOrderListItem, OrderStatus, Page } from '@/lib/types'

// Admin query keys start with ['admin'], so they never share a cache entry with customer queries.

type AdminOrdersParams = { status?: OrderStatus; page: number }

/** One page of orders, newest first. An undefined `status` means every status. */
export function useAdminOrders(params: AdminOrdersParams) {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => api.get<Page<AdminOrderListItem>>('/admin/orders', params),
  })
}

/** One order with its customer and admin note. */
export function useAdminOrder(id: number) {
  return useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => api.get<AdminOrder>(`/admin/orders/${id}`),
  })
}

/** The fields an admin may change. A field that is left out is not changed. */
export type AdminOrderChanges = {
  status?: OrderStatus
  cargo_company?: string | null
  tracking_no?: string | null
  admin_note?: string | null
}

/** Saves changes to one order. Null clears a text field. */
export function useUpdateAdminOrder(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (changes: AdminOrderChanges) =>
      api.patch<AdminOrder>(`/admin/orders/${id}`, changes),
    // Refresh on failure too: a refused change (409) means the server's status has moved on.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}
