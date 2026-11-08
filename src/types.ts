export type ID = string

/** YYYY-MM-DD */
export type DateKey = string

export interface Category {
  id: ID
  name: string
  /** 칩·막대 색 (hex) */
  color: string
  order: number
}

export interface Expense {
  id: ID
  date: DateKey
  /** 원 단위 정수 */
  amount: number
  categoryId: ID
  memo?: string
  tripId?: ID
  createdAt: number
}

export interface Trip {
  id: ID
  name: string
  /** 같은 지역 여행끼리 비교할 때 쓰는 키 (예: "부산") */
  region: string
  startDate: DateKey
  endDate: DateKey
}

/** 자주 쓰는 내역 (한 번 눌러 입력) */
export interface QuickItem {
  id: ID
  label: string
  categoryId: ID
  amount: number
  memo?: string
}

export type ThemeMode = 'system' | 'light' | 'dark'

export interface Settings {
  theme: ThemeMode
  /** 월 예산 (원). null이면 표시 안 함 */
  monthlyBudget: number | null
  /** 단위 없이 1000 미만 숫자를 '만 원'으로 읽기 ("2" → 20,000원) */
  smallNumberAsMan: boolean
  /** 여행 기간에 입력한 지출에 여행 태그 자동 적용 */
  autoTagTrips: boolean
}

export interface AppData {
  version: 1
  categories: Category[]
  expenses: Expense[]
  trips: Trip[]
  quickItems: QuickItem[]
  settings: Settings
}
