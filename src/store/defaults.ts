import type { AppData, Category, Settings } from '../types'

/** 색은 lib/palette.ts의 순서대로 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-transport', name: '교통', color: '#2a78d6', order: 0 },
  { id: 'cat-lodging', name: '숙박', color: '#eb6834', order: 1 },
  { id: 'cat-food', name: '식비', color: '#1baf7a', order: 2 },
  { id: 'cat-drink', name: '술', color: '#eda100', order: 3 },
  { id: 'cat-cafe', name: '카페', color: '#e87ba4', order: 4 },
  { id: 'cat-shopping', name: '쇼핑', color: '#008300', order: 5 },
  { id: 'cat-etc', name: '기타', color: '#6250d6', order: 6 },
]

/** 삭제할 수 없는 기본 카테고리 (카테고리 삭제 시 지출이 여기로 옮겨짐) */
export const FALLBACK_CATEGORY_ID = 'cat-etc'

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  monthlyBudget: null,
  smallNumberAsMan: true,
  autoTagTrips: true,
}

export function emptyData(): AppData {
  return {
    version: 1,
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    expenses: [],
    trips: [],
    quickItems: [
      { id: 'qi-coffee', label: '아아', categoryId: 'cat-cafe', amount: 4500 },
      { id: 'qi-subway', label: '지하철', categoryId: 'cat-transport', amount: 1550 },
      { id: 'qi-lunch', label: '점심', categoryId: 'cat-food', amount: 10000 },
    ],
    settings: { ...DEFAULT_SETTINGS },
  }
}

/** v1 기본 색 → 새 팔레트 (저장된 데이터 이전용) */
export const LEGACY_COLOR_MAP: Record<string, string> = {
  '#3b82f6': '#2a78d6',
  '#8b5cf6': '#eb6834',
  '#f97316': '#1baf7a',
  '#ef4444': '#eda100',
  '#a16207': '#e87ba4',
  '#ec4899': '#008300',
  '#64748b': '#6250d6',
}
