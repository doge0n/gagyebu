import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AppData, Category, Expense, ID, QuickItem, Settings, Trip } from '../types'
import { newId } from '../lib/id'
import { FALLBACK_CATEGORY_ID, LEGACY_COLOR_MAP, emptyData } from './defaults'
import { STORAGE_KEY } from './storage'
import { buildSampleData } from './sampleData'

export type NewExpense = Omit<Expense, 'id' | 'createdAt'>

interface Actions {
  // 지출
  addExpenses: (items: NewExpense[]) => Expense[]
  updateExpense: (id: ID, patch: Partial<Omit<Expense, 'id'>>) => void
  deleteExpenses: (ids: ID[]) => void
  /** 삭제 되돌리기용: 지운 지출을 그대로 복원 */
  restoreExpenses: (items: Expense[]) => void
  /** 여러 건에 여행 태그 일괄 적용 (null이면 태그 해제) */
  setTripFor: (ids: ID[], tripId: ID | null) => void

  // 여행
  addTrip: (t: Omit<Trip, 'id'>) => Trip
  updateTrip: (id: ID, patch: Partial<Omit<Trip, 'id'>>) => void
  /** 여행 삭제. 지출은 남기고 태그만 해제 */
  deleteTrip: (id: ID) => void

  // 카테고리
  addCategory: (name: string, color: string) => void
  updateCategory: (id: ID, patch: Partial<Omit<Category, 'id'>>) => void
  /** 카테고리 삭제. 해당 지출은 '기타'로 이동 */
  deleteCategory: (id: ID) => void
  reorderCategories: (orderedIds: ID[]) => void

  // 자주 쓰는 내역
  addQuickItem: (q: Omit<QuickItem, 'id'>) => void
  updateQuickItem: (id: ID, patch: Partial<Omit<QuickItem, 'id'>>) => void
  deleteQuickItem: (id: ID) => void

  updateSettings: (patch: Partial<Settings>) => void

  // 전체 데이터
  replaceAll: (data: AppData) => void
  resetAll: () => void
  loadSample: () => void
}

export type Store = AppData & Actions

/** 상태에서 데이터 부분만 꺼내기 (백업용) */
export function pickData(s: Store): AppData {
  const { version, categories, expenses, trips, quickItems, settings } = s
  return { version, categories, expenses, trips, quickItems, settings }
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ...emptyData(),

      addExpenses: (items) => {
        const now = Date.now()
        const created = items.map((it, i) => ({ ...it, id: newId(), createdAt: now + i }))
        set((s) => ({ expenses: [...s.expenses, ...created] }))
        return created
      },
      updateExpense: (id, patch) =>
        set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteExpenses: (ids) => {
        const del = new Set(ids)
        set((s) => ({ expenses: s.expenses.filter((e) => !del.has(e.id)) }))
      },
      restoreExpenses: (items) =>
        set((s) => {
          const have = new Set(s.expenses.map((e) => e.id))
          return { expenses: [...s.expenses, ...items.filter((e) => !have.has(e.id))] }
        }),
      setTripFor: (ids, tripId) => {
        const target = new Set(ids)
        set((s) => ({
          expenses: s.expenses.map((e) => (target.has(e.id) ? { ...e, tripId: tripId ?? undefined } : e)),
        }))
      },

      addTrip: (t) => {
        const trip = { ...t, id: newId() }
        set((s) => ({ trips: [...s.trips, trip] }))
        return trip
      },
      updateTrip: (id, patch) => set((s) => ({ trips: s.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTrip: (id) =>
        set((s) => ({
          trips: s.trips.filter((t) => t.id !== id),
          expenses: s.expenses.map((e) => (e.tripId === id ? { ...e, tripId: undefined } : e)),
        })),

      addCategory: (name, color) =>
        set((s) => ({
          categories: [...s.categories, { id: newId(), name, color, order: s.categories.length }],
        })),
      updateCategory: (id, patch) =>
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCategory: (id) => {
        if (id === FALLBACK_CATEGORY_ID) return
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          expenses: s.expenses.map((e) => (e.categoryId === id ? { ...e, categoryId: FALLBACK_CATEGORY_ID } : e)),
          quickItems: s.quickItems.map((q) => (q.categoryId === id ? { ...q, categoryId: FALLBACK_CATEGORY_ID } : q)),
        }))
      },
      reorderCategories: (orderedIds) =>
        set((s) => ({
          categories: s.categories.map((c) => ({ ...c, order: Math.max(0, orderedIds.indexOf(c.id)) })),
        })),

      addQuickItem: (q) => set((s) => ({ quickItems: [...s.quickItems, { ...q, id: newId() }] })),
      updateQuickItem: (id, patch) =>
        set((s) => ({ quickItems: s.quickItems.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),
      deleteQuickItem: (id) => set((s) => ({ quickItems: s.quickItems.filter((q) => q.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      replaceAll: (data) => set({ ...data }),
      // 초기화해도 테마 설정은 유지
      resetAll: () => set((s) => ({ ...emptyData(), settings: { ...emptyData().settings, theme: s.settings.theme } })),
      loadSample: () => set((s) => ({ ...buildSampleData(), settings: s.settings })),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, fromVersion) => {
        const data = persisted as AppData
        // v1 → v2: 카테고리 색을 검증된 팔레트로 교체
        if (fromVersion < 2 && Array.isArray(data?.categories)) {
          data.categories = data.categories.map((c) => ({ ...c, color: LEGACY_COLOR_MAP[c.color] ?? c.color }))
        }
        return data as Store
      },
      partialize: (s) => pickData(s),
    },
  ),
)

/** 정렬된 카테고리 목록 */
export function sortedCategories(cats: Category[]): Category[] {
  return [...cats].sort((a, b) => a.order - b.order)
}
