import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isWeekend,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { DateKey } from '../types'

const WEEK = { weekStartsOn: 1 as const } // 월요일 시작

export function toKey(d: Date): DateKey {
  return format(d, 'yyyy-MM-dd')
}

export function fromKey(k: DateKey): Date {
  return parseISO(k)
}

export function todayKey(): DateKey {
  return toKey(new Date())
}

/** 해당 날짜가 속한 주의 월~일 7일 */
export function weekDays(anchor: Date): DateKey[] {
  const start = startOfWeek(anchor, WEEK)
  return Array.from({ length: 7 }, (_, i) => toKey(addDays(start, i)))
}

/** 월간 달력 그리드: 월요일 시작, 앞뒤 달 날짜 포함, 7의 배수 */
export function monthGrid(year: number, month0: number): DateKey[] {
  const first = startOfMonth(new Date(year, month0, 1))
  const days = eachDayOfInterval({
    start: startOfWeek(first, WEEK),
    end: endOfWeek(endOfMonth(first), WEEK),
  })
  return days.map(toKey)
}

/** "2026-11" */
export function monthKey(d: Date): string {
  return format(d, 'yyyy-MM')
}

export function isWeekendKey(k: DateKey): boolean {
  return isWeekend(fromKey(k))
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

export function weekdayKo(k: DateKey): string {
  return WEEKDAY_KO[fromKey(k).getDay()]
}

/** "11/8 (일)" */
export function labelShort(k: DateKey): string {
  const d = fromKey(k)
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAY_KO[d.getDay()]})`
}

/** 기간 일수 (양 끝 포함) */
export function daysBetween(start: DateKey, end: DateKey): number {
  const ms = fromKey(end).getTime() - fromKey(start).getTime()
  return Math.round(ms / 86400000) + 1
}

/** DateKey 문자열은 사전순 = 날짜순 */
export function inRange(k: DateKey, start: DateKey, end: DateKey): boolean {
  return k >= start && k <= end
}

export function isValidKey(k: unknown): k is DateKey {
  return typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && !isNaN(parseISO(k).getTime())
}
