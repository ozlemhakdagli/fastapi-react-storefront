import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Order, OrderListItem, Page } from '@/lib/types'

// Every customer order query starts with ['orders'], so one invalidation refreshes them all.

/** One page of the logged-in customer's orders, newest first. */
export function useOrders(page: number) {
  return useQuery({
    queryKey: ['orders', 'list', page],
    queryFn: () => api.get<Page<OrderListItem>>('/orders', { page }),
  })
}

/** One of the logged-in customer's orders. The server answers 404 for another customer's order. */
export function useOrder(id: number) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => api.get<Order>(`/orders/${id}`),
  })
}

/** Cancels an order. The server allows this only while the order is `new`. */
export function useCancelOrder(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<Order>(`/orders/${id}/cancel`),
    // Refresh on failure too: a refused cancel (409) means the server's status has moved on.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}
