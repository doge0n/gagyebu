import { useMemo, useState } from 'react'
import type { Trip } from '../../types'
import { Button } from '../../components/Page'
import { Sheet } from '../../components/Sheet'
import { inputCls, labelCls } from '../../components/ui'
import { todayKey } from '../../lib/date'
import { untaggedInRange } from '../../lib/stats'
import { useStore } from '../../store/useStore'

/** 여행 만들기/수정. 기간 안의 태그 없는 지출에 한 번에 태그 적용 옵션 */
export function TripFormSheet({
  open,
  onClose,
  trip,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  /** 있으면 수정, 없으면 새로 만들기 */
  trip?: Trip
  onSaved?: (t: Trip) => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title={trip ? '여행 수정' : '새 여행'}>
      {open && <Form trip={trip} onClose={onClose} onSaved={onSaved} />}
    </Sheet>
  )
}

function Form({ trip, onClose, onSaved }: { trip?: Trip; onClose: () => void; onSaved?: (t: Trip) => void }) {
  const trips = useStore((s) => s.trips)
  const expenses = useStore((s) => s.expenses)
  const addTrip = useStore((s) => s.addTrip)
  const updateTrip = useStore((s) => s.updateTrip)
  const setTripFor = useStore((s) => s.setTripFor)

  const [region, setRegion] = useState(trip?.region ?? '')
  const [name, setName] = useState(trip?.name ?? '')
  const [nameEdited, setNameEdited] = useState(!!trip)
  const [start, setStart] = useState(trip?.startDate ?? todayKey())
  const [end, setEnd] = useState(trip?.endDate ?? todayKey())
  const [applyTag, setApplyTag] = useState(true)

  const regions = useMemo(() => [...new Set(trips.map((t) => t.region))], [trips])
  const autoName = (r: string) => (r ? `${r} #${trips.filter((t) => t.region === r && t.id !== trip?.id).length + 1}` : '')
  const shownName = nameEdited ? name : autoName(region.trim())
  const validRange = start && end && start <= end
  const valid = region.trim() && shownName.trim() && validRange
  const untagged = validRange ? untaggedInRange(expenses, start, end) : []

  const save = () => {
    if (!valid) return
    const data = { name: shownName.trim(), region: region.trim(), startDate: start, endDate: end }
    let saved: Trip
    if (trip) {
      updateTrip(trip.id, data)
      saved = { ...trip, ...data }
    } else {
      saved = addTrip(data)
    }
    if (applyTag && untagged.length) setTripFor(untagged.map((e) => e.id), saved.id)
    onSaved?.(saved)
    onClose()
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>지역 (같은 지역끼리 비교)</label>
          <input
            className={inputCls}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="예: 부산"
            list="trip-form-regions"
            autoFocus={!trip}
          />
          <datalist id="trip-form-regions">
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
      {!validRange && <p className="text-xs text-red-500">끝 날짜가 시작보다 빠를 수 없어요.</p>}
      {untagged.length > 0 && (
        <label className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm dark:bg-neutral-800/60">
          <input
            type="checkbox"
            checked={applyTag}
            onChange={(e) => setApplyTag(e.target.checked)}
            className="size-4 accent-neutral-900 dark:accent-white"
          />
          이 기간의 태그 없는 지출 {untagged.length}건에 여행 태그 붙이기
        </label>
      )}
      <Button type="submit" variant="primary" className="w-full" disabled={!valid}>
        {trip ? '저장' : '만들기'}
      </Button>
    </form>
  )
}
