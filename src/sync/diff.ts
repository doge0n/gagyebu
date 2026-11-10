import type { AppData, Category, Expense, QuickItem, Settings, Trip } from '../types'

/** 클라우드 문서 종류: e 지출 · t 여행 · c 카테고리 · q 자주 쓰는 내역 · s 설정 */
export type Kind = 'e' | 't' | 'c' | 'q' | 's'
type Item = Expense | Trip | Category | QuickItem
/** 동기화하는 설정 (화면 모드는 기기마다 따로) */
export type SyncedSettings = Omit<Settings, 'theme'>

const LISTS = [
  ['e', 'expenses'],
  ['t', 'trips'],
  ['c', 'categories'],
  ['q', 'quickItems'],
] as const

export const SETTINGS_KEY = 's_main'

export function docKey(kind: Kind, id: string): string {
  return `${kind}_${id}`
}

export function syncedSettings(s: Settings): SyncedSettings {
  const { theme: _theme, ...rest } = s
  return rest
}

function sameSettings(a: Settings, b: Settings): boolean {
  return JSON.stringify(syncedSettings(a)) === JSON.stringify(syncedSettings(b))
}

/**
 * 두 상태 사이에 바뀐 문서. 값이 null이면 삭제.
 * zustand는 안 바뀐 항목의 객체를 그대로 두므로 참조 비교로 충분하다.
 */
export function diffData(prev: AppData, next: AppData): Map<string, object | null> {
  const out = new Map<string, object | null>()
  for (const [kind, field] of LISTS) {
    const a = prev[field] as Item[]
    const b = next[field] as Item[]
    if (a === b) continue
    const before = new Map(a.map((x) => [x.id, x]))
    const after = new Set<string>()
    for (const x of b) {
      after.add(x.id)
      if (before.get(x.id) !== x) out.set(docKey(kind, x.id), x)
    }
    for (const id of before.keys()) if (!after.has(id)) out.set(docKey(kind, id), null)
  }
  if (prev.settings !== next.settings && !sameSettings(prev.settings, next.settings)) {
    out.set(SETTINGS_KEY, syncedSettings(next.settings))
  }
  return out
}

/** 전체 상태를 문서 목록으로 (처음 올릴 때) */
export function allDocs(data: AppData): Map<string, object> {
  const out = new Map<string, object>()
  for (const [kind, field] of LISTS) for (const x of data[field] as Item[]) out.set(docKey(kind, x.id), x)
  out.set(SETTINGS_KEY, syncedSettings(data.settings))
  return out
}

export interface RemoteDoc {
  key: string
  data?: object
  del?: boolean
}

/**
 * 클라우드에서 받은 변경을 상태에 적용. 바뀐 게 없으면 null.
 * replace면 목록을 클라우드 것만으로 새로 만든다 (처음 연결할 때 클라우드 쪽을 쓸 경우).
 */
export function applyRemote(cur: AppData, docs: RemoteDoc[], replace = false): Partial<AppData> | null {
  const patch: Partial<AppData> = {}
  let changed = false
  for (const [kind, field] of LISTS) {
    const prefix = `${kind}_`
    const mine = docs.filter((d) => d.key.startsWith(prefix))
    if (!mine.length && !replace) continue
    const map = new Map<string, Item>(replace ? [] : (cur[field] as Item[]).map((x) => [x.id, x]))
    let touched = replace
    for (const d of mine) {
      const id = d.key.slice(prefix.length)
      const old = map.get(id)
      if (d.del || !d.data) {
        if (old) {
          map.delete(id)
          touched = true
        }
      } else if (!old || JSON.stringify(old) !== JSON.stringify(d.data)) {
        map.set(id, { ...(d.data as Item), id })
        touched = true
      }
    }
    if (!touched) continue
    const list = [...map.values()]
    if (replace && JSON.stringify(list) === JSON.stringify(cur[field])) continue
    ;(patch as Record<string, unknown>)[field] = list
    changed = true
  }
  const s = docs.find((d) => d.key === SETTINGS_KEY && !d.del && d.data)
  if (s) {
    const merged = { ...cur.settings, ...(s.data as SyncedSettings), theme: cur.settings.theme }
    if (!sameSettings(merged, cur.settings)) {
      patch.settings = merged
      changed = true
    }
  }
  return changed ? patch : null
}
