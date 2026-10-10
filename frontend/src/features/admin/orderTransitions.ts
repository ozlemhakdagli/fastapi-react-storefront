import type { OrderStatus } from '@/lib/types'

// The order status machine, copied from ALLOWED_TRANSITIONS in backend/app/services/orders.py.
// Keep both in sync.
// The server enforces it too; this table only decides which options the admin is offered.
export const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
  new: ['approved', 'rejected', 'cancelled'],
  approved: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  rejected: [],
  cancelled: [],
}

