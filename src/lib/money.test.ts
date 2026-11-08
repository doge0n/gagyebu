import { describe, expect, it } from 'vitest'
import { formatCompact, formatDelta, formatWon, parseAmount } from './money'

describe('parseAmount', () => {
  it.each([
    ['15000', 15000],
    ['15,000', 15000],
    ['15000원', 15000],
    ['2만', 20000],
    ['3.5만', 35000],
    ['2만5천', 25000],
    ['1만 2천원', 12000],
    ['1만2000', 12000],
    ['5천', 5000],
    ['3백', 300],
  ])('%s → %d', (s, n) => expect(parseAmount(s)).toBe(n))

  it('단위 없는 작은 숫자는 옵션에 따라 만 원', () => {
    expect(parseAmount('2', { smallNumberAsMan: true })).toBe(20000)
    expect(parseAmount('3.5', { smallNumberAsMan: true })).toBe(35000)
    expect(parseAmount('4500', { smallNumberAsMan: true })).toBe(4500)
    expect(parseAmount('2')).toBe(2)
  })

  it.each(['', 'abc', '2만abc', '0', '1.2.3', '만'])('잘못된 입력 %s → null', (s) => expect(parseAmount(s)).toBeNull())
})

describe('format', () => {
  it('formatWon', () => expect(formatWon(1234567)).toBe('1,234,567원'))
  it('formatCompact', () => {
    expect(formatCompact(9800)).toBe('9,800')
    expect(formatCompact(14100)).toBe('1.4만')
    expect(formatCompact(20000)).toBe('2만')
    expect(formatCompact(125000)).toBe('12.5만')
    expect(formatCompact(1230000)).toBe('123만')
  })
  it('formatDelta', () => {
    expect(formatDelta(12000)).toBe('+12,000원')
    expect(formatDelta(-3000)).toBe('-3,000원')
  })
})
