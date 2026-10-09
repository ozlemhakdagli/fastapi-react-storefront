import { parseId } from '@/lib/searchParams'

describe('parseId', () => {
  it.each([
    ['7', 7],
    ['0', undefined],
    ['-3', undefined],
    ['2.5', undefined],
    ['abc', undefined],
    [null, undefined],
  ])('parses %s as %s', (value, expected) => {
    expect(parseId(value)).toBe(expected)
  })
})
