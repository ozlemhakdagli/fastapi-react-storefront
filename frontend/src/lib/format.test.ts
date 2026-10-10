import { formatDate, formatMoney } from '@/lib/format'
import { setLocale } from '@/lib/i18n'

describe('format', () => {
  beforeEach(() => {
    setLocale('tr')
  })

  afterEach(() => {
    setLocale('tr')
  })

  it('formats money in Turkish lira with Turkish separators', () => {
    const text = formatMoney('1299.90')
    expect(text).toContain('1.299,90')
    expect(text).toContain('₺')
  })

  it('keeps two decimals for whole amounts', () => {
    expect(formatMoney('5.00')).toContain('5,00')
  })

  it('formats an ISO date as a non-empty string in Turkish', () => {
    const text = formatDate('2026-10-08T12:00:00Z')
    expect(text.length).toBeGreaterThan(0)
    expect(text).toContain('2026')
    expect(text).toContain('Eki')
  })

  it('formats money in English with US separators and TRY currency', () => {
    setLocale('en')
    const text = formatMoney('1299.90')
    expect(text).toContain('1,299.90')
    expect(text).toContain('TRY')
  })

  it('formats an ISO date in English locale', () => {
    setLocale('en')
    const text = formatDate('2026-10-08T12:00:00Z')
    expect(text.length).toBeGreaterThan(0)
    expect(text).toContain('2026')
    expect(text).toContain('Oct')
  })
})
