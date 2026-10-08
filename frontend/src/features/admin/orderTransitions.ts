import type { OrderStatus } from '@/lib/types'

// The order status machine, copied from docs/api.md. Keep both in sync.
// The server enforces it too; this table only decides which options the admin is offered.
export const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
  new: ['approved', 'rejected', 'cancelled'],
  approved: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  rejected: [],
  cancelled: [],
}

/** The statuses an order can move to from `status`. The status itself is not included. */
export function allowedNext(status: OrderStatus): OrderStatus[] {
  return ALLOWED_NEXT[status]
}
