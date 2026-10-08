import { ALLOWED_NEXT, allowedNext } from '@/features/admin/orderTransitions'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types'

// Written out from docs/api.md, deliberately not derived from the implementation.
const CONTRACT_TABLE: [OrderStatus, OrderStatus[]][] = [
  ['new', ['approved', 'rejected', 'cancelled']],
  ['approved', ['shipped', 'cancelled']],
  ['shipped', ['completed']],
  ['completed', []],
  ['rejected', []],
  ['cancelled', []],
]

describe('orderTransitions', () => {
  it.each(CONTRACT_TABLE)('test_allowed_next_matches_contract_table (%s)', (status, next) => {
    expect(allowedNext(status)).toEqual(next)
    expect(ALLOWED_NEXT[status]).toEqual(next)
  })

  it('has one row for every order status', () => {
    expect(CONTRACT_TABLE.map(([status]) => status).sort()).toEqual([...ORDER_STATUSES].sort())
  })
})
