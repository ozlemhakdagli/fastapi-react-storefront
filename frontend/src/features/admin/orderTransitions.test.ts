import { ALLOWED_NEXT } from '@/features/admin/orderTransitions'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types'

// Written out from ALLOWED_TRANSITIONS in backend/app/services/orders.py, deliberately not derived
// from the implementation.
const STATUS_TABLE: [OrderStatus, OrderStatus[]][] = [
  ['new', ['approved', 'rejected', 'cancelled']],
  ['approved', ['shipped', 'cancelled']],
  ['shipped', ['completed']],
  ['completed', []],
  ['rejected', []],
  ['cancelled', []],
]

describe('orderTransitions', () => {
  it('matches the status table of the API', () => {
    expect(ALLOWED_NEXT).toEqual(Object.fromEntries(STATUS_TABLE))
  })

  it('has one row for every order status', () => {
    expect(STATUS_TABLE.map(([status]) => status).sort()).toEqual([...ORDER_STATUSES].sort())
  })
})
