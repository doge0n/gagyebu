import type { AppData, Category, Expense, QuickItem, Trip } from '../types'
import { isValidKey, todayKey } from '../lib/date'
import { DEFAULT_SETTINGS, FALLBACK_CATEGORY_ID, LEGACY_COLOR_MAP, emptyData } from './defaults'

/**
 * 저장소 키. 나중에 클라우드 동기화(방법 2)를 붙일 때는
 * useStore의 persist storage만 바꾸면 된다.
 */
export const STORAGE_KEY = 'gagyebu'

export function exportFileName(): string {
  return `가계부-백업-${todayKey()}.json`
}

export function serialize(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

/** 브라우저에서 JSON 파일 다운로드 */
export function downloadJson(data: AppData): void {
  const blob = new Blob([serialize(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = exportFileName()
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export class ImportError extends Error {}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isStr = (v: unknown): v is string => typeof v === 'string'
const optStr = (v: unknown) => (isStr(v) && v.trim() ? v : undefined)

/**
 * 가져온 JSON을 검증·정리해 AppData로 만든다. 잘못된 항목은 건너뛰고,
 * 구조 자체가 틀리면 ImportError.
 */
export function parseImport(text: string): { data: AppData; skipped: number } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new ImportError('JSON 형식이 아닙니다.')
  }
  // zustand persist 원본 형식({ state: {...} })도 받아준다
  if (isObj(raw) && isObj(raw.state) && !('expenses' in raw)) raw = raw.state
  if (!isObj(raw) || !Array.isArray(raw.expenses)) {
    throw new ImportError('가계부 백업 파일이 아닙니다. (expenses 항목 없음)')
  }

  const base = emptyData()
  let skipped = 0

  const categories: Category[] = Array.isArray(raw.categories)
    ? raw.categories
        .filter((c): c is Record<string, unknown> => isObj(c) && isStr(c.id) && isStr(c.name))
        .map((c, i) => ({
          id: c.id as string,
          name: c.name as string,
          color: isStr(c.color) ? (LEGACY_COLOR_MAP[c.color] ?? c.color) : '#6250d6',
          order: typeof c.order === 'number' ? c.order : i,
        }))
    : base.categories
  if (!categories.some((c) => c.id === FALLBACK_CATEGORY_ID)) {
    categories.push({ ...base.categories.find((c) => c.id === FALLBACK_CATEGORY_ID)!, order: categories.length })
  }
  const catIds = new Set(categories.map((c) => c.id))

  const trips: Trip[] = []
  for (const t of Array.isArray(raw.trips) ? raw.trips : []) {
    if (isObj(t) && isStr(t.id) && isStr(t.name) && isValidKey(t.startDate) && isValidKey(t.endDate)) {
      trips.push({
        id: t.id,
        name: t.name,
        region: isStr(t.region) ? t.region : t.name,
        startDate: t.startDate,
        endDate: t.endDate,
      })
    } else skipped++
  }
  const tripIds = new Set(trips.map((t) => t.id))

  const expenses: Expense[] = []
  for (const e of raw.expenses) {
    if (isObj(e) && isStr(e.id) && isValidKey(e.date) && typeof e.amount === 'number' && e.amount > 0) {
      expenses.push({
        id: e.id,
        date: e.date,
        amount: Math.round(e.amount),
        categoryId: isStr(e.categoryId) && catIds.has(e.categoryId) ? e.categoryId : FALLBACK_CATEGORY_ID,
        memo: optStr(e.memo),
        tripId: isStr(e.tripId) && tripIds.has(e.tripId) ? e.tripId : undefined,
        createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
      })
    } else skipped++
  }

  const quickItems: QuickItem[] = Array.isArray(raw.quickItems)
    ? raw.quickItems
        .filter((q): q is Record<string, unknown> => isObj(q) && isStr(q.id) && isStr(q.label) && typeof q.amount === 'number')
        .map((q) => ({
          id: q.id as string,
          label: q.label as string,
          amount: q.amount as number,
          categoryId: isStr(q.categoryId) && catIds.has(q.categoryId) ? q.categoryId : FALLBACK_CATEGORY_ID,
          memo: optStr(q.memo),
        }))
    : base.quickItems

  const s = isObj(raw.settings) ? raw.settings : {}
  const settings = {
    theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : DEFAULT_SETTINGS.theme,
    monthlyBudget: typeof s.monthlyBudget === 'number' && s.monthlyBudget > 0 ? s.monthlyBudget : null,
    smallNumberAsMan: typeof s.smallNumberAsMan === 'boolean' ? s.smallNumberAsMan : DEFAULT_SETTINGS.smallNumberAsMan,
    autoTagTrips: typeof s.autoTagTrips === 'boolean' ? s.autoTagTrips : DEFAULT_SETTINGS.autoTagTrips,
  } as AppData['settings']

  return { data: { version: 1, categories, expenses, trips, quickItems, settings }, skipped }
}
