import { describe, expect, it } from 'vitest'
import { buildSampleData } from './sampleData'
import { ImportError, parseImport, serialize } from './storage'

describe('backup', () => {
  it('내보낸 데이터를 그대로 다시 가져온다', () => {
    const data = buildSampleData(new Date(2026, 10, 8))
    const { data: back, skipped } = parseImport(serialize(data))
    expect(skipped).toBe(0)
    expect(back).toEqual(JSON.parse(serialize(data)))
  })
  it('잘못된 파일은 거부', () => {
    expect(() => parseImport('not json')).toThrow(ImportError)
    expect(() => parseImport('{"foo":1}')).toThrow(ImportError)
  })
  it('잘못된 항목은 건너뛰고, 없는 카테고리는 기타로', () => {
    const { data, skipped } = parseImport(
      JSON.stringify({
        expenses: [
          { id: 'a', date: '2026-11-01', amount: 1000, categoryId: 'nope' },
          { id: 'b', date: 'bad', amount: 1000 },
        ],
      }),
    )
    expect(skipped).toBe(1)
    expect(data.expenses[0].categoryId).toBe('cat-etc')
  })
})

describe('sample data', () => {
  it('부산 여행 2회, 모든 여행 지출이 기간 안', () => {
    const d = buildSampleData(new Date(2026, 10, 8))
    expect(d.trips.filter((t) => t.region === '부산')).toHaveLength(2)
    for (const e of d.expenses.filter((e) => e.tripId)) {
      const t = d.trips.find((t) => t.id === e.tripId)!
      expect(e.date >= t.startDate && e.date <= t.endDate).toBe(true)
    }
  })
})
