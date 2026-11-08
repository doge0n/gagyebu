import { useMemo, useState } from 'react'
import type { DateKey, ID } from '../types'
import { labelShort } from '../lib/date'
import { useStore } from '../store/useStore'
import { Button } from './Page'
import { Sheet } from './Sheet'
import { inputCls, labelCls } from './ui'

/**
 * 여행 고르기 시트. 기존 여행을 누르거나, 새 여행을 만들어 바로 적용.
 * defaultStart/End: 선택한 지출들의 날짜 범위 (새 여행 기간 기본값)
 */
export function TripPicker({
  open,
  onClose,
  onPick,
  defaultStart,
  defaultEnd,
}: {
  open: boolean
  onClose: () => void
  onPick: (tripId: ID) => void
  defaultStart: DateKey
  defaultEnd: DateKey
}) {
  return (
    <Sheet open={open} onClose={onClose} title="여행 태그 적용">
      {/* key로 열 때마다 폼 초기화 */}
      {open && <TripPickerBody key={defaultStart + defaultEnd} {...{ onPick, defaultStart, defaultEnd }} />}
    </Sheet>
  )
}

function TripPickerBody({
  onPick,
  defaultStart,
  defaultEnd,
}: {
  onPick: (tripId: ID) => void
  defaultStart: DateKey
  defaultEnd: DateKey
}) {
  const trips = useStore((s) => s.trips)
  const addTrip = useStore((s) => s.addTrip)

  // 선택 기간과 겹치는 여행을 위로
  const sorted = useMemo(() => {
    const overlaps = (t: (typeof trips)[number]) => t.startDate <= defaultEnd && t.endDate >= defaultStart
    return [...trips].sort(
      (a, b) => Number(overlaps(b)) - Number(overlaps(a)) || b.startDate.localeCompare(a.startDate),
    )
  }, [trips, defaultStart, defaultEnd])
  const regions = useMemo(() => [...new Set(trips.map((t) => t.region))], [trips])

  const [region, setRegion] = useState('')
  const [nameEdited, setNameEdited] = useState(false)
  const [name, setName] = useState('')
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)

  const autoName = (r: string) => (r ? `${r} #${trips.filter((t) => t.region === r).length + 1}` : '')
  const shownName = nameEdited ? name : autoName(region.trim())
  const valid = region.trim() && shownName.trim() && start && end && start <= end

  const create = () => {
    if (!valid) return
    const t = addTrip({ name: shownName.trim(), region: region.trim(), startDate: start, endDate: end })
    onPick(t.id)
  }

  return (
    <div className="space-y-5">
      {sorted.length > 0 && (
        <div>
          <p className={labelCls}>기존 여행</p>
          <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {sorted.map((t) => (
              <li key={t.id}>
                <button
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  onClick={() => onPick(t.id)}
                >
                  <span className="font-medium">✈ {t.name}</span>
                  <span className="text-xs text-neutral-500">
                    {labelShort(t.startDate)} ~ {labelShort(t.endDate)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
          create()
        }}
      >
        <p className={labelCls}>새 여행 만들기</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>지역</label>
            <input
              className={inputCls}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="예: 부산"
              list="trip-regions"
              autoFocus={sorted.length === 0}
            />
            <datalist id="trip-regions">
              {regions.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={labelCls}>이름</label>
            <input
              className={inputCls}
              value={shownName}
              onChange={(e) => {
                setNameEdited(true)
                setName(e.target.value)
              }}
              placeholder="부산 #1"
            />
          </div>
          <div>
            <label className={labelCls}>시작</label>
            <input type="date" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>끝</label>
            <input type="date" className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <Button type="submit" variant="primary" className="w-full" disabled={!valid}>
          만들고 적용
        </Button>
      </form>
    </div>
  )
}
