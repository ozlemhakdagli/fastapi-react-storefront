import { render, screen, within } from '@testing-library/react'
import { OrderTimeline } from '@/features/account/components/OrderTimeline'

/** The steps of the list in order, with the value of their aria-current attribute. */
function steps(list: HTMLElement) {
  return within(list)
    .getAllByRole('listitem')
    .map((item) => ({ label: item.textContent, current: item.getAttribute('aria-current') }))
}

describe('OrderTimeline', () => {
  it('lists the four steps and marks Yeni as the current step of a new order', () => {
    render(<OrderTimeline status="new" />)
    const list = screen.getByRole('list', { name: 'Sipariş durumu' })
    expect(steps(list)).toEqual([
      { label: 'Yeni', current: 'step' },
      { label: 'Onaylandı', current: null },
      { label: 'Kargoda', current: null },
      { label: 'Tamamlandı', current: null },
    ])
  })

  it('marks Onaylandı as the current step of an approved order', () => {
    render(<OrderTimeline status="approved" />)
    const list = screen.getByRole('list', { name: 'Sipariş durumu' })
    expect(steps(list).map((step) => step.current)).toEqual([null, 'step', null, null])
  })

  it('marks Kargoda as the current step of a shipped order', () => {
    render(<OrderTimeline status="shipped" />)
    const list = screen.getByRole('list', { name: 'Sipariş durumu' })
    expect(steps(list).map((step) => step.current)).toEqual([null, null, 'step', null])
  })

  it('shows all four steps and marks Tamamlandı as the current step of a completed order', () => {
    render(<OrderTimeline status="completed" />)
    const list = screen.getByRole('list', { name: 'Sipariş durumu' })
    expect(steps(list)).toEqual([
      { label: 'Yeni', current: null },
      { label: 'Onaylandı', current: null },
      { label: 'Kargoda', current: null },
      { label: 'Tamamlandı', current: 'step' },
    ])
  })

  it('shows only the state of a cancelled order, without a list of steps', () => {
    render(<OrderTimeline status="cancelled" />)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('İptal Edildi')).toBeInTheDocument()
  })

  it('shows only the state of a rejected order, without a list of steps', () => {
    render(<OrderTimeline status="rejected" />)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('Reddedildi')).toBeInTheDocument()
  })
})
