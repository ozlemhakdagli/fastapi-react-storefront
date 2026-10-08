import { formatDate, formatMoney } from '@/lib/format'

describe('format', () => {
  it('formats money in Turkish lira with Turkish separators', () => {
    const text = formatMoney('1299.90')
    expect(text).toContain('1.299,90')
    expect(text).toContain('₺')
  })

  it('keeps two decimals for whole amounts', () => {
    expect(formatMoney('5.00')).toContain('5,00')
  })

  it('formats an ISO date as a non-empty string', () => {
    const text = formatDate('2026-10-08T12:00:00Z')
    expect(text.length).toBeGreaterThan(0)
    expect(text).toContain('2026')
  })
})
