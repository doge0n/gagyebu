import { describe, expect, it } from 'vitest'
import type { Expense, Trip } from '../types'
import { dailyTotals, groupByDate, regionGroups, tripStat, untaggedInRange, heatLevel, monthlyTotals, sum, totalsByCategory, tripForDate, weekendSplit } from './stats'
import { isWeekendKey } from './date'

const e = (id: string, date: string, amount: number, categoryId = 'c1', createdAt = 0): Expense => ({
  id, date, amount, categoryId, createdAt,
})

describe('stats', () => {
  it('sum / groupByDate / totalsByCategory', () => {
    const es = [e('a', '2026-11-02', 1000, 'c1', 2), e('b', '2026-11-02', 500, 'c2', 1), e('c', '2026-11-03', 3000)]
    expect(sum(es)).toBe(4500)
    expect(groupByDate(es).get('2026-11-02')!.map((x) => x.id)).toEqual(['b', 'a'])
    expect(totalsByCategory(es)).toEqual([
      { categoryId: 'c1', total: 4000 },
      { categoryId: 'c2', total: 500 },
    ])
  })
  it('tripForDate', () => {
    const trips: Trip[] = [
      { id: 't1', name: 'A', region: 'A', startDate: '2026-10-30', endDate: '2026-11-01' },
      { id: 't2', name: 'B', region: 'B', startDate: '2026-11-01', endDate: '2026-11-02' },
    ]
    expect(tripForDate(trips, '2026-10-31')?.id).toBe('t1')
    expect(tripForDate(trips, '2026-11-01')?.id).toBe('t2')
    expect(tripForDate(trips, '2026-11-05')).toBeUndefined()
  })
})

describe('calendar stats', () => {
  const es = [e('a', '2026-11-07', 10000), e('b', '2026-11-07', 5000), e('c', '2026-11-09', 2000), e('d', '2026-10-31', 7000)]
  it('dailyTotals', () => expect(dailyTotals(es).get('2026-11-07')).toBe(15000))
  it('heatLevel', () => {
    expect(heatLevel(0, 100)).toBe(0)
    expect(heatLevel(100, 100)).toBe(4)
    expect(heatLevel(1, 100)).toBe(1)
    expect(heatLevel(30, 100)).toBe(3)
  })
  it('weekendSplit', () => {
    // 11/7 토, 11/8 일, 11/9 월
    const r = weekendSplit(es, ['2026-11-07', '2026-11-08', '2026-11-09'], isWeekendKey)
    expect(r).toEqual({ weekend: 15000, weekday: 2000, weekendDays: 2, weekdayDays: 1 })
  })
  it('monthlyTotals', () =>
    expect(monthlyTotals(es, ['2026-10', '2026-11', '2026-12'])).toEqual([
      { month: '2026-10', total: 7000 },
      { month: '2026-11', total: 17000 },
      { month: '2026-12', total: 0 },
    ]))
})

describe('trip stats', () => {
  const trips: Trip[] = [
    { id: 'b1', name: '부산 #1', region: '부산', startDate: '2026-09-25', endDate: '2026-09-27' },
    { id: 'b2', name: '부산 #2', region: '부산', startDate: '2026-10-30', endDate: '2026-11-01' },
    { id: 'j1', name: '제주 #1', region: '제주', startDate: '2026-08-01', endDate: '2026-08-02' },
  ]
  const es: Expense[] = [
    { ...e('1', '2026-09-25', 30000), tripId: 'b1' },
    { ...e('2', '2026-09-26', 60000), tripId: 'b1' },
    { ...e('3', '2026-10-30', 90000), tripId: 'b2' },
    { ...e('4', '2026-08-01', 50000), tripId: 'j1' },
    e('5', '2026-10-31', 7000),
  ]
  it('tripStat: 태그된 지출만, 1일 평균은 기간 일수로', () => {
    const s = tripStat(trips[0], es)
    expect([s.total, s.days, s.perDay, s.expenses.length]).toEqual([90000, 3, 30000, 2])
  })
  it('regionGroups: 2회 이상 지역만, 회차순', () => {
    const g = regionGroups(trips.map((t) => tripStat(t, es)))
    expect(g).toHaveLength(1)
    expect(g[0].region).toBe('부산')
    expect(g[0].trips.map((t) => t.trip.id)).toEqual(['b1', 'b2'])
    expect(g[0].avgTotal).toBe(90000)
    expect(g[0].avgPerDay).toBe(30000)
  })
  it('untaggedInRange', () => expect(untaggedInRange(es, '2026-10-30', '2026-11-01').map((x) => x.id)).toEqual(['5']))
})
