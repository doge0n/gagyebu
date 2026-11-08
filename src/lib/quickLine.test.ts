import { describe, expect, it } from 'vitest'
import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY_ID } from '../store/defaults'
import { parseEntry, parseQuickLine } from './quickLine'

const name = (id: string) => DEFAULT_CATEGORIES.find((c) => c.id === id)!.name
const run = (s: string) =>
  parseQuickLine(s, DEFAULT_CATEGORIES, FALLBACK_CATEGORY_ID, { smallNumberAsMan: true }).map((i) => [
    name(i.categoryId),
    i.amount,
    i.memo,
  ])

describe('parseQuickLine', () => {
  it('부산 여행 메모 그대로', () => {
    expect(run('교통 2 숙박 5 술 3')).toEqual([
      ['교통', 20000, undefined],
      ['숙박', 50000, undefined],
      ['술', 30000, undefined],
    ])
  })
  it('붙여 쓰기·구분자·접미사', () => {
    expect(run('교통비2만, 숙박5만 / 술값 3만')).toEqual([
      ['교통', 20000, undefined],
      ['숙박', 50000, undefined],
      ['술', 30000, undefined],
    ])
  })
  it('별칭과 메모', () => {
    expect(run('커피 4500 스벅 택시 12,000')).toEqual([
      ['카페', 4500, '커피 스벅'],
      ['교통', 12000, '택시'],
    ])
  })
  it('모르는 단어는 기타 + 메모', () => {
    expect(run('미용실 2.5만')).toEqual([['기타', 25000, '미용실']])
  })
  it('백화점의 백은 단위가 아님', () => {
    expect(run('술 3 백화점 5')).toEqual([
      ['술', 30000, undefined],
      ['기타', 50000, '백화점'],
    ])
  })
})

describe('parseEntry', () => {
  const cafe = 'cat-cafe'
  const entry = (s: string) =>
    parseEntry(s, DEFAULT_CATEGORIES, cafe, { smallNumberAsMan: true }).map((i) => [name(i.categoryId), i.amount, i.memo])
  it('숫자만 → 선택된 카테고리', () => expect(entry('4500')).toEqual([['카페', 4500, undefined]]))
  it('숫자 + 메모', () => expect(entry('4500 스벅 리저브')).toEqual([['카페', 4500, '스벅 리저브']]))
  it('모르는 단어 먼저 → 선택된 카테고리 + 메모', () => expect(entry('스벅 4500')).toEqual([['카페', 4500, '스벅']]))
  it('여러 건', () =>
    expect(entry('교통 2 숙박 5')).toEqual([
      ['교통', 20000, undefined],
      ['숙박', 50000, undefined],
    ]))
  it('숫자로 시작 + 이어서 다른 항목', () =>
    expect(entry('4500 택시 1.2만')).toEqual([
      ['카페', 4500, undefined],
      ['교통', 12000, '택시'],
    ]))
  it('빈 입력', () => expect(entry('  ')).toEqual([]))
})

describe('카테고리 이름을 바꿔도 별칭 유지', () => {
  it('카페 → 커피로 바꾼 뒤 "라떼 5000"', () => {
    const cats = DEFAULT_CATEGORIES.map((c) => (c.id === 'cat-cafe' ? { ...c, name: '커피' } : c))
    const r = parseQuickLine('라떼 5000', cats, FALLBACK_CATEGORY_ID)
    expect(r[0].categoryId).toBe('cat-cafe')
  })
})
