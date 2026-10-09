import { render, screen } from '@testing-library/react'
import { BarChart } from '@/components/BarChart'

const days = [
  { label: '1 Eki', value: 2 },
  { label: '2 Eki', value: 0 },
  { label: '3 Eki', value: 4 },
  { label: '4 Eki', value: 1 },
]

/** Every attribute of every element in the chart, to look for NaN. */
function allAttributeValues(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('*'), (element) =>
    Array.from(element.attributes, (attribute) => attribute.value),
  ).flat()
}

describe('BarChart', () => {
  it('is an image named by its aria label', () => {
    render(<BarChart data={days} ariaLabel="Son 4 günde 7 sipariş" />)
    expect(screen.getByRole('img', { name: 'Son 4 günde 7 sipariş' })).toBeInTheDocument()
  })

  it('draws one bar per data point', () => {
    const { container } = render(<BarChart data={days} ariaLabel="Grafik" />)
    expect(container.querySelectorAll('rect')).toHaveLength(days.length)
  })

  it('draws all-zero data as empty bars, without NaN and without value labels', () => {
    const zeros = days.map((day) => ({ ...day, value: 0 }))
    const { container } = render(<BarChart data={zeros} ariaLabel="Grafik" />)
    for (const bar of container.querySelectorAll('rect')) {
      expect(bar).toHaveAttribute('height', '0')
    }
    expect(allAttributeValues(container).some((value) => value.includes('NaN'))).toBe(false)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('keeps every bar inside the chart when one value is far larger than the others', () => {
    const skewed = [
      { label: '1 Eki', value: 3 },
      { label: '2 Eki', value: 1 },
      { label: '3 Eki', value: 1_000_000 },
      { label: '4 Eki', value: 2 },
    ]
    const { container } = render(<BarChart data={skewed} ariaLabel="Grafik" />)
    const bars = Array.from(container.querySelectorAll('rect'))
    for (const bar of bars) {
      const top = Number(bar.getAttribute('y'))
      const height = Number(bar.getAttribute('height'))
      expect(top).toBeGreaterThanOrEqual(0)
      expect(height).toBeGreaterThan(0)
      expect(top + height).toBeLessThanOrEqual(220)
    }
    const heights = bars.map((bar) => Number(bar.getAttribute('height')))
    expect(heights[2]).toBe(Math.max(...heights))
  })

  it('writes the value labels with formatValue', () => {
    render(
      <BarChart
        data={[{ label: '1 Eki', value: 3 }]}
        ariaLabel="Grafik"
        formatValue={(value) => `${value} sipariş`}
      />,
    )
    expect(screen.getByText('3 sipariş')).toBeInTheDocument()
  })

  it('shows the plain value above each bar that is not zero', () => {
    render(<BarChart data={days} ariaLabel="Grafik" />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('labels every second bar with its day', () => {
    render(<BarChart data={days} ariaLabel="Grafik" />)
    expect(screen.getByText('1 Eki')).toBeInTheDocument()
    expect(screen.queryByText('2 Eki')).not.toBeInTheDocument()
    expect(screen.getByText('3 Eki')).toBeInTheDocument()
    expect(screen.queryByText('4 Eki')).not.toBeInTheDocument()
  })
})
