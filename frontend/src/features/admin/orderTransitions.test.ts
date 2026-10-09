import { ALLOWED_NEXT } from '@/features/admin/orderTransitions'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types'

// Written out from docs/api.md, deliberately not derived from the implementation.
const STATUS_TABLE: [OrderStatus, OrderStatus[]][] = [
  ['new', ['approved', 'rejected', 'cancelled']],
  ['approved', ['shipped', 'cancelled']],
  ['shipped', ['completed']],
  ['completed', []],
  ['rejected', []],
  ['cancelled', []],
]

describe('orderTransitions', () => {
  it.each(STATUS_TABLE)('test_allowed_next_matches_status_table (%s)', (status, next) => {
    expect(ALLOWED_NEXT[status]).toEqual(next)
  })

  it('has one row for every order status', () => {
    expect(STATUS_TABLE.map(([status]) => status).sort()).toEqual([...ORDER_STATUSES].sort())
  })
})
