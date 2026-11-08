import type { Category, ID } from '../types'
import { parseAmount, type ParseOptions } from './money'

/** 기본 카테고리(id)별 별칭. 입력 단어가 이 중 하나로 시작하면 해당 카테고리로 본다. 이름을 바꿔도 유지됨 */
const ALIASES: Record<string, string[]> = {
  'cat-transport': ['교통', '택시', '버스', '지하철', '기차', 'ktx', 'srt', '기름', '주유', '톨비', '통행료', '주차', '항공', '비행기'],
  'cat-lodging': ['숙박', '호텔', '모텔', '숙소', '펜션', '게하', '게스트하우스', '에어비앤비', '리조트'],
  'cat-food': ['식비', '밥', '점심', '저녁', '아침', '식사', '배달', '간식', '편의점'],
  'cat-drink': ['술', '맥주', '소주', '와인', '포차', '호프'],
  'cat-cafe': ['카페', '커피', '아아', '라떼', '디저트'],
  'cat-shopping': ['쇼핑', '옷', '기념품', '선물'],
}

export interface ParsedItem {
  categoryId: ID
  amount: number
  memo?: string
  /** 카테고리를 못 찾아 기본(기타)으로 넣은 경우 원래 단어 */
  unmatchedWord?: string
}

export function matchCategory(word: string, categories: Category[]): Category | undefined {
  return matchCategoryDetail(word, categories)?.category
}

/** via: 'name' = 이름 그대로/이름으로 시작(교통비·술값), 'alias' = 별칭(택시→교통) */
function matchCategoryDetail(word: string, categories: Category[]): { category: Category; via: 'name' | 'alias' } | undefined {
  const w = word.toLowerCase()
  const byName =
    categories.find((c) => c.name.toLowerCase() === w) ??
    [...categories].sort((a, b) => b.name.length - a.name.length).find((c) => w.startsWith(c.name.toLowerCase()))
  if (byName) return { category: byName, via: 'name' }
  const byAlias = categories.find((c) => (ALIASES[c.id] ?? []).some((a) => w.startsWith(a)))
  return byAlias ? { category: byAlias, via: 'alias' } : undefined
}

// 단위(만/천/백)는 숫자에 붙어 있어야 함 → "술 3 백화점"의 '백'을 단위로 오인하지 않음
const AMOUNT = String.raw`\d[\d,]*(?:\.\d+)?[만천백]?(?:\d[\d,]*(?:\.\d+)?[천백]?)*원?`
const ITEM_RE = new RegExp(String.raw`([^\d\s,/·]+)\s*(${AMOUNT})`, 'g')

/**
 * "교통 2 숙박 5 술 3" / "교통비2만, 숙박5만 / 술값 3만" / "카페 4500 스벅 택시 12000"
 * → 카테고리별 여러 건. 금액 뒤 다음 항목 전까지의 단어는 앞 항목의 메모가 된다.
 */
export function parseQuickLine(
  line: string,
  categories: Category[],
  fallbackCategoryId: ID,
  opts: ParseOptions = {},
): ParsedItem[] {
  const matches = [...line.matchAll(ITEM_RE)]
  const items: ParsedItem[] = []
  matches.forEach((m, i) => {
    const amount = parseAmount(m[2], opts)
    if (amount == null) return
    const word = m[1].trim()
    const match = matchCategoryDetail(word, categories)
    const cat = match?.category
    const memoStart = m.index! + m[0].length
    const memoEnd = i + 1 < matches.length ? matches[i + 1].index! : line.length
    const trailing = line.slice(memoStart, memoEnd).replace(/^[\s,/·]+|[\s,/·]+$/g, '')
    // 별칭(택시·커피 등)이나 모르는 단어는 메모로 남김
    const memoParts = [match?.via === 'name' ? '' : word, trailing].filter(Boolean)
    items.push({
      categoryId: cat?.id ?? fallbackCategoryId,
      amount,
      memo: memoParts.length ? memoParts.join(' ') : undefined,
      unmatchedWord: cat ? undefined : word,
    })
  })
  return items
}

/**
 * 주간 입력 칸 하나로 모든 형식 처리.
 * - "4500" / "4500 스벅" / "3.5만"  → 선택된 카테고리로 1건 (뒤 단어는 메모)
 * - "교통 2 숙박 5 술 3"            → 카테고리별 여러 건
 * - "스벅 4500" (모르는 단어)       → 선택된 카테고리 + 메모 "스벅"
 */
export function parseEntry(
  text: string,
  categories: Category[],
  selectedCategoryId: ID,
  opts: ParseOptions = {},
): ParsedItem[] {
  const t = text.trim()
  if (!t) return []
  const selected = categories.find((c) => c.id === selectedCategoryId)
  // 숫자로 시작하면 앞에 선택된 카테고리 이름을 붙여 같은 규칙으로 해석
  const line = /^\d/.test(t) && selected ? `${selected.name} ${t}` : t
  return parseQuickLine(line, categories, selectedCategoryId, opts)
}
