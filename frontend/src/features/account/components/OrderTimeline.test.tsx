import { render, screen, within } from '@testing-library/react'
import { OrderTimeline } from '@/features/account/components/OrderTimeline'
import { t } from '@/lib/i18n'
import type { OrderStatus } from '@/lib/types'

/** The steps of the list in order, with the value of their aria-current attribute. */
function steps(list: HTMLElement) {
  return within(list)
    .getAllByRole('listitem')
    .map((item) => ({ label: item.textContent, current: item.getAttribute('aria-current') }))
}

const STEP_LABELS = [
  t('common.status_new'),
  t('common.status_approved'),
  t('common.status_shipped'),
  t('common.status_completed'),
]

describe('OrderTimeline', () => {
  it.each<[OrderStatus, string]>([
    ['new', t('common.status_new')],
    ['approved', t('common.status_approved')],
    ['shipped', t('common.status_shipped')],
    ['completed', t('common.status_completed')],
  ])('shows the steps of the %s order, marking only "%s"', (status, currentLabel) => {
    render(<OrderTimeline status={status} />)
    const list = screen.getByRole('list', { name: t('account.order_progress') })
    expect(steps(list)).toEqual(
      STEP_LABELS.map((label) => ({ label, current: label === currentLabel ? 'step' : null })),
    )
  })

  it.each<[OrderStatus, string]>([
    ['cancelled', t('common.status_cancelled')],
    ['rejected', t('common.status_rejected')],
  ])('shows only the state of a %s order, without a list of steps', (status, label) => {
    render(<OrderTimeline status={status} />)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
