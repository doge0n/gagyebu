import { describe, expect, it } from 'vitest'
import { emptyData } from '../store/defaults'
import type { AppData } from '../types'
import { allDocs, applyRemote, diffData, SETTINGS_KEY } from './diff'

const exp = (id: string, amount = 1000) => ({ id, date: '2026-11-01', amount, categoryId: 'cat-etc', createdAt: 1 })

describe('diffData', () => {
  it('추가·수정·삭제를 찾는다', () => {
    const a: AppData = { ...emptyData(), expenses: [exp('a'), exp('b')] }
    const b: AppData = { ...a, expenses: [a.expenses[0], { ...a.expenses[1], amount: 5 }, exp('c')] }
    const c: AppData = { ...b, expenses: [b.expenses[1], b.expenses[2]] }
    expect([...diffData(a, b).keys()].sort()).toEqual(['e_b', 'e_c'])
    expect(diffData(b, c)).toEqual(new Map([['e_a', null]]))
  })
  it('화면 모드만 바뀌면 올리지 않는다', () => {
    const a = emptyData()
    expect(diffData(a, { ...a, settings: { ...a.settings, theme: 'dark' } }).size).toBe(0)
    const d = diffData(a, { ...a, settings: { ...a.settings, monthlyBudget: 100 } })
    expect(d.get(SETTINGS_KEY)).not.toHaveProperty('theme')
  })
})

describe('applyRemote', () => {
  it('추가·삭제를 반영하고 테마는 유지', () => {
    const cur: AppData = { ...emptyData(), expenses: [exp('a')], settings: { ...emptyData().settings, theme: 'dark' } }
    const p = applyRemote(cur, [
      { key: 'e_a', del: true },
      { key: 'e_b', data: exp('b') },
      { key: SETTINGS_KEY, data: { monthlyBudget: 5, smallNumberAsMan: true, autoTagTrips: true } },
    ])!
    expect(p.expenses!.map((e) => e.id)).toEqual(['b'])
    expect(p.settings).toMatchObject({ theme: 'dark', monthlyBudget: 5 })
  })
  it('같은 내용이면 null', () => {
    const cur: AppData = { ...emptyData(), expenses: [exp('a')] }
    expect(applyRemote(cur, [{ key: 'e_a', data: exp('a') }])).toBeNull()
  })
  it('replace면 클라우드에 없는 항목은 지운다', () => {
    const cur: AppData = { ...emptyData(), expenses: [exp('local')] }
    const remote = [...allDocs({ ...emptyData(), expenses: [exp('r')] })].map(([key, data]) => ({ key, data }))
    const p = applyRemote(cur, remote, true)!
    expect(p.expenses!.map((e) => e.id)).toEqual(['r'])
    expect(p.categories).toBeUndefined() // 카테고리는 같아서 그대로
  })
})
