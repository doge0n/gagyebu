export interface ParseOptions {
  /** 단위 없는 1000 미만 숫자를 만 원으로 해석 */
  smallNumberAsMan?: boolean
}

const UNIT: Record<string, number> = { 만: 10000, 천: 1000, 백: 100 }

/**
 * 금액 문자열을 원 단위 정수로 바꾼다.
 * 인식: "15000", "15,000원", "2만", "3.5만", "2만5천", "5천", "1만 2천원"
 * smallNumberAsMan이면 "2" → 20000, "3.5" → 35000
 * 인식 불가·0 이하면 null
 */
export function parseAmount(input: string, opts: ParseOptions = {}): number | null {
  const s = input.replace(/[\s,]/g, '').replace(/원$/, '')
  if (!s) return null
  // 숫자+단위 덩어리가 문자열 전체를 덮어야 한다
  if (!/^(\d+(\.\d+)?[만천백]?)+$/.test(s)) return null

  let total = 0
  let hasUnit = false
  let count = 0
  for (const m of s.matchAll(/(\d+(?:\.\d+)?)([만천백]?)/g)) {
    const n = parseFloat(m[1])
    count++
    if (m[2]) {
      hasUnit = true
      total += n * UNIT[m[2]]
    } else {
      total += n
    }
  }
  // "2만5천" 처럼 단위 섞인 경우는 OK, "25" "3" 처럼 단위 없는 덩어리가 여러 개면 잘못된 입력
  if (!hasUnit && count > 1) return null
  if (!hasUnit && opts.smallNumberAsMan && total < 1000) total *= 10000

  const won = Math.round(total)
  return won > 0 ? won : null
}

const nf = new Intl.NumberFormat('ko-KR')

/** 15000 → "15,000원" */
export function formatWon(n: number): string {
  return `${nf.format(Math.round(n))}원`
}

/** 15000 → "15,000" */
export function formatNumber(n: number): string {
  return nf.format(Math.round(n))
}

/** 달력 칸처럼 좁은 곳용: 9800 → "9,800", 14100 → "1.4만", 20000 → "2만", 1230000 → "123만" */
export function formatCompact(n: number): string {
  if (n < 10000) return nf.format(n)
  const man = n / 10000
  const v = man >= 100 ? Math.round(man) : Math.round(man * 10) / 10
  return `${v}만`
}

/** 증감 표시: +12,000원 / -3,000원 */
export function formatDelta(n: number): string {
  if (n === 0) return '±0원'
  return `${n > 0 ? '+' : '-'}${formatWon(Math.abs(n))}`
}
