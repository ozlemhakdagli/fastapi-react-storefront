import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RatingInput } from '@/components/RatingInput'

describe('RatingInput', () => {
  it('is a radio group with five named choices and the current value checked', () => {
    render(<RatingInput value={3} onChange={vi.fn()} label="Puanınız" />)
    expect(screen.getByRole('radiogroup', { name: 'Puanınız' })).toBeInTheDocument()
    for (const name of ['1 yıldız', '2 yıldız', '3 yıldız', '4 yıldız', '5 yıldız']) {
      expect(screen.getByRole('radio', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('radio', { name: '3 yıldız' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '4 yıldız' })).not.toBeChecked()
  })

  it('calls onChange with the clicked choice', async () => {
    const onChange = vi.fn()
    render(<RatingInput value={null} onChange={onChange} label="Puanınız" />)
    await userEvent.click(screen.getByRole('radio', { name: '4 yıldız' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it.each([
    ['ArrowRight', 4],
    ['ArrowDown', 4],
    ['ArrowLeft', 2],
    ['ArrowUp', 2],
  ])('moves the choice and the focus with %s', async (key, expected) => {
    const onChange = vi.fn()
    render(<RatingInput value={3} onChange={onChange} label="Puanınız" />)
    screen.getByRole('radio', { name: '3 yıldız' }).focus()
    await userEvent.keyboard(`{${key}}`)
    expect(onChange).toHaveBeenCalledWith(expected)
    expect(screen.getByRole('radio', { name: `${expected} yıldız` })).toHaveFocus()
  })

  it('wraps from the last choice to the first', async () => {
    const onChange = vi.fn()
    render(<RatingInput value={5} onChange={onChange} label="Puanınız" />)
    screen.getByRole('radio', { name: '5 yıldız' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('keeps only the checked choice in the tab order', () => {
    render(<RatingInput value={3} onChange={vi.fn()} label="Puanınız" />)
    expect(screen.getByRole('radio', { name: '3 yıldız' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: '2 yıldız' })).toHaveAttribute('tabindex', '-1')
  })

  it('makes the first choice reachable while nothing is checked', () => {
    render(<RatingInput value={null} onChange={vi.fn()} label="Puanınız" />)
    expect(screen.getByRole('radio', { name: '1 yıldız' })).toHaveAttribute('tabindex', '0')
  })

  it('ignores clicks while disabled', async () => {
    const onChange = vi.fn()
    render(<RatingInput value={null} onChange={onChange} label="Puanınız" disabled />)
    await userEvent.click(screen.getByRole('radio', { name: '4 yıldız' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('previews the hovered choice without selecting it', async () => {
    const onChange = vi.fn()
    const { container } = render(<RatingInput value={2} onChange={onChange} label="Puanınız" />)
    const hovered = screen.getByRole('radio', { name: '4 yıldız' })
    await userEvent.hover(hovered)
    expect(container.querySelectorAll('[data-filled="true"]')).toHaveLength(4)
    expect(screen.getByRole('radio', { name: '2 yıldız' })).toBeChecked()
    await userEvent.unhover(hovered)
    expect(container.querySelectorAll('[data-filled="true"]')).toHaveLength(2)
    expect(onChange).not.toHaveBeenCalled()
  })
})
