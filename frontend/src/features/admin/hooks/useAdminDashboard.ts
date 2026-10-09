import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Iso, Money, OrderStatus } from '@/lib/types'

// Admin query keys start with ['admin'], so they never share a cache entry with customer queries.

/** What GET /api/admin/dashboard answers. */
export interface AdminDashboard {
  new_orders: number
  unread_messages: number
  products: number
  customers: number
  orders_by_status: Record<OrderStatus, number>
  /** Exactly 14 days, oldest first; the last one is today. */
  orders_per_day: { date: string; orders: number; revenue: Money }[]
  /** At most 5, newest first. */
  recent_orders: {
    id: number
    customer_name: string
    status: OrderStatus
    total: Money
    created_at: Iso
  }[]
  /** Active products with a stock of 5 or less, lowest stock first. */
  low_stock: { id: number; sku: string; name: string; stock: number }[]
}

/** The counts and lists shown on the admin dashboard. */
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get<AdminDashboard>('/admin/dashboard'),
  })
}
