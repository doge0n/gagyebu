import type { DateKey, Expense, ID, Trip } from '../types'
import { daysBetween, inRange } from './date'

export function sum(es: Expense[]): number {
  return es.reduce((a, e) => a + e.amount, 0)
}

/** 날짜별로 묶기 (각 날짜 안은 입력 순) */
export function groupByDate(es: Expense[]): Map<DateKey, Expense[]> {
  const m = new Map<DateKey, Expense[]>()
  for (const e of es) {
    const list = m.get(e.date)
    if (list) list.push(e)
    else m.set(e.date, [e])
  }
  for (const list of m.values()) list.sort((a, b) => a.createdAt - b.createdAt)
  return m
}

/** 카테고리별 합계, 큰 순서 */
export function totalsByCategory(es: Expense[]): { categoryId: ID; total: number }[] {
  const m = new Map<ID, number>()
  for (const e of es) m.set(e.categoryId, (m.get(e.categoryId) ?? 0) + e.amount)
  return [...m].map(([categoryId, total]) => ({ categoryId, total })).sort((a, b) => b.total - a.total)
}

export function inDateRange(es: Expense[], start: DateKey, end: DateKey): Expense[] {
  return es.filter((e) => inRange(e.date, start, end))
}

/** 날짜가 기간에 들어가는 여행 (겹치면 가장 늦게 시작한 여행) */
export function tripForDate(trips: Trip[], date: DateKey): Trip | undefined {
  let best: Trip | undefined
  for (const t of trips) {
    if (inRange(date, t.startDate, t.endDate) && (!best || t.startDate > best.startDate)) best = t
  }
  return best
}

/** 날짜별 합계 */
export function dailyTotals(es: Expense[]): Map<DateKey, number> {
  const m = new Map<DateKey, number>()
  for (const e of es) m.set(e.date, (m.get(e.date) ?? 0) + e.amount)
  return m
}

/**
 * 히트맵 단계 0~4. 그 달 최대 지출일 대비 제곱근 스케일
 * (여행 같은 큰 날 하나 때문에 나머지가 전부 연해지는 것 완화)
 */
export function heatLevel(amount: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (amount <= 0 || max <= 0) return 0
  return Math.min(4, Math.max(1, Math.ceil(Math.sqrt(amount / max) * 4))) as 1 | 2 | 3 | 4
}

/** 주말/평일 합계와 일수 (days: 집계 대상 날짜들) */
export function weekendSplit(es: Expense[], days: DateKey[], isWeekend: (k: DateKey) => boolean) {
  const daySet = new Set(days)
  let weekend = 0
  let weekday = 0
  for (const e of es) {
    if (!daySet.has(e.date)) continue
    if (isWeekend(e.date)) weekend += e.amount
    else weekday += e.amount
  }
  const weekendDays = days.filter(isWeekend).length
  return { weekend, weekday, weekendDays, weekdayDays: days.length - weekendDays }
}

/** 월별 합계 (monthKeys: "yyyy-MM" 목록) */
export function monthlyTotals(es: Expense[], monthKeys: string[]): { month: string; total: number }[] {
  const m = new Map(monthKeys.map((k) => [k, 0]))
  for (const e of es) {
    const k = e.date.slice(0, 7)
    if (m.has(k)) m.set(k, m.get(k)! + e.amount)
  }
  return monthKeys.map((month) => ({ month, total: m.get(month)! }))
}

export interface TripStat {
  trip: Trip
  expenses: Expense[]
  total: number
  /** 기간 일수 (양 끝 포함) */
  days: number
  perDay: number
}

/** 여행 집계: 태그(tripId)가 붙은 지출 기준 */
export function tripStat(trip: Trip, all: Expense[]): TripStat {
  const expenses = all.filter((e) => e.tripId === trip.id)
  const total = sum(expenses)
  const days = Math.max(1, daysBetween(trip.startDate, trip.endDate))
  return { trip, expenses, total, days, perDay: Math.round(total / days) }
}

export interface RegionGroup {
  region: string
  /** 회차순 (시작일 오름차순) */
  trips: TripStat[]
  avgTotal: number
  avgPerDay: number
}

/** 같은 지역 여행이 minCount회 이상인 지역만 */
export function regionGroups(stats: TripStat[], minCount = 2): RegionGroup[] {
  const m = new Map<string, TripStat[]>()
  for (const s of stats) {
    const key = s.trip.region.trim()
    if (!key) continue
    m.set(key, [...(m.get(key) ?? []), s])
  }
  return [...m]
    .filter(([, list]) => list.length >= minCount)
    .map(([region, list]) => {
      const trips = [...list].sort((a, b) => a.trip.startDate.localeCompare(b.trip.startDate))
      return {
        region,
        trips,
        avgTotal: Math.round(sum(trips.flatMap((t) => t.expenses)) / trips.length),
        avgPerDay: Math.round(trips.reduce((a, t) => a + t.perDay, 0) / trips.length),
      }
    })
    .sort((a, b) => b.trips.length - a.trips.length)
}

/** 기간 안에 있지만 아직 여행 태그가 없는 지출 */
export function untaggedInRange(es: Expense[], start: DateKey, end: DateKey): Expense[] {
  return es.filter((e) => !e.tripId && inRange(e.date, start, end))
}
