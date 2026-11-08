import { addDays, startOfWeek } from 'date-fns'
import type { AppData, Expense, Trip } from '../types'
import { fromKey, isWeekendKey, toKey } from '../lib/date'
import { emptyData } from './defaults'

/** 항상 같은 결과를 내는 간단한 난수 */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 오늘 기준 최근 약 10주치 확인용 데이터.
 * - 부산 #2: 지난주 금~일 (교통 2만 / 숙박 5만 / 술 3만 …)
 * - 부산 #1: 약 5주 전 금~일 (지역별 평균·회차 비교 확인용)
 */
export function buildSampleData(today = new Date()): AppData {
  const data = emptyData()
  const r = rng(20261108)
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)]
  const round100 = (n: number) => Math.round(n / 100) * 100
  let seq = 0
  const add = (date: Date | string, categoryId: string, amount: number, memo?: string, tripId?: string): Expense => {
    const e: Expense = {
      id: `sample-${++seq}`,
      date: typeof date === 'string' ? date : toKey(date),
      amount,
      categoryId,
      memo,
      tripId,
      createdAt: Date.now() + seq,
    }
    data.expenses.push(e)
    return e
  }

  const monday = startOfWeek(today, { weekStartsOn: 1 })
  const busan2: Trip = {
    id: 'sample-trip-busan-2',
    name: '부산 #2',
    region: '부산',
    startDate: toKey(addDays(monday, -3)),
    endDate: toKey(addDays(monday, -1)),
  }
  const busan1: Trip = {
    id: 'sample-trip-busan-1',
    name: '부산 #1',
    region: '부산',
    startDate: toKey(addDays(monday, -38)),
    endDate: toKey(addDays(monday, -36)),
  }
  data.trips.push(busan1, busan2)
  const tripDays = new Set<string>()
  for (const t of data.trips) for (let i = 0; i < 3; i++) tripDays.add(toKey(addDays(fromKey(t.startDate), i)))

  // 평소 지출 (여행 날 제외, 오늘까지)
  for (let i = 70; i >= 0; i--) {
    const d = addDays(today, -i)
    const k = toKey(d)
    if (tripDays.has(k)) continue
    if (!isWeekendKey(k)) {
      if (r() < 0.75) add(d, 'cat-food', round100(8000 + r() * 5000), pick(['점심', '김밥', '국밥', '샐러드']))
      if (r() < 0.6) add(d, 'cat-cafe', pick([4500, 4500, 5000, 6300]), pick(['아아', '라떼', undefined]))
      if (r() < 0.5) add(d, 'cat-transport', 1550, '지하철')
      if (r() < 0.15) add(d, 'cat-drink', round100(20000 + r() * 30000), '퇴근 후 한잔')
    } else {
      if (r() < 0.8) add(d, 'cat-food', round100(12000 + r() * 25000), pick(['브런치', '저녁', '배달']))
      if (r() < 0.5) add(d, 'cat-cafe', round100(5000 + r() * 4000))
      if (r() < 0.3) add(d, 'cat-shopping', round100(20000 + r() * 80000), pick(['옷', '생활용품', '책']))
      if (r() < 0.35) add(d, 'cat-drink', round100(25000 + r() * 40000))
      if (r() < 0.2) add(d, 'cat-transport', round100(8000 + r() * 12000), '택시')
    }
  }

  // 부산 #1 (5주 전)
  const b1 = (n: number) => toKey(addDays(fromKey(busan1.startDate), n))
  add(b1(0), 'cat-transport', 59800, 'KTX 왕복', busan1.id)
  add(b1(0), 'cat-food', 18000, '돼지국밥', busan1.id)
  add(b1(0), 'cat-drink', 42000, '광안리 포차', busan1.id)
  add(b1(0), 'cat-lodging', 70000, '해운대 호텔 1박', busan1.id)
  add(b1(1), 'cat-lodging', 70000, '해운대 호텔 2박', busan1.id)
  add(b1(1), 'cat-cafe', 13000, '오션뷰 카페', busan1.id)
  add(b1(1), 'cat-food', 35000, '회', busan1.id)
  add(b1(1), 'cat-drink', 28000, undefined, busan1.id)
  add(b1(2), 'cat-food', 15000, '밀면', busan1.id)
  add(b1(2), 'cat-shopping', 22000, '기념품', busan1.id)
  add(b1(2), 'cat-transport', 12000, '택시', busan1.id)

  // 부산 #2 (지난주 금~일): 교통 2 / 숙박 5 / 술 3 + α
  const b2 = (n: number) => toKey(addDays(fromKey(busan2.startDate), n))
  add(b2(0), 'cat-transport', 20000, '버스', busan2.id)
  add(b2(0), 'cat-lodging', 50000, '게하 2박', busan2.id)
  add(b2(0), 'cat-food', 16000, '돼지국밥', busan2.id)
  add(b2(1), 'cat-drink', 30000, '서면', busan2.id)
  add(b2(1), 'cat-cafe', 11000, undefined, busan2.id)
  add(b2(1), 'cat-food', 24000, '곰장어', busan2.id)
  add(b2(2), 'cat-food', 12000, '밀면', busan2.id)
  add(b2(2), 'cat-transport', 9000, '지하철·택시', busan2.id)

  return data
}
