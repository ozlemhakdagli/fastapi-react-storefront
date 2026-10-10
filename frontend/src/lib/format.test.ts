import { formatDate, formatDay, formatMoney, formatRating } from '@/lib/format'
import { setLocale } from '@/lib/i18n'

describe('format', () => {
  beforeEach(() => {
    setLocale('tr')
  })

  afterEach(() => {
    setLocale('tr')
  })

  it('formats money in dollars with Turkish separators', () => {
    const text = formatMoney('1299.90')
    expect(text).toContain('1.299,90')
    expect(text).toContain('$')
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

  it('formats money in dollars with English separators', () => {
    setLocale('en')
    const text = formatMoney('1299.90')
    expect(text).toContain('1,299.90')
    expect(text).toContain('$')
  })

  it('formats an ISO date in English locale', () => {
    setLocale('en')
    const text = formatDate('2026-10-08T12:00:00Z')
    expect(text.length).toBeGreaterThan(0)
    expect(text).toContain('2026')
    expect(text).toContain('Oct')
  })

  it('writes a calendar day and a rating in the language that is shown', () => {
    expect(formatDay('2026-09-26')).toBe('26 Eyl')
    expect(formatRating(4.3)).toBe('4,3')
    expect(formatRating(4)).toBe('4,0')

    setLocale('en')
    expect(formatDay('2026-09-26')).toBe('Sep 26')
    expect(formatRating(4.3)).toBe('4.3')
  })
})
