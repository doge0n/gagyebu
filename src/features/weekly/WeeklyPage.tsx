import { addWeeks, format } from 'date-fns'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { ID } from '../../types'
import { Icon } from '../../components/Icon'
import { Button, Page } from '../../components/Page'
import { SampleDataBanner } from '../../components/SampleDataBanner'
import { showToast } from '../../components/Toast'
import { TripPicker } from '../../components/TripPicker'
import { fromKey, isValidKey, todayKey, weekDays } from '../../lib/date'
import { groupByDate, inDateRange, sum } from '../../lib/stats'
import { FALLBACK_CATEGORY_ID } from '../../store/defaults'
import { sortedCategories, useStore } from '../../store/useStore'
import { BulkBar } from './BulkBar'
import { DaySection } from './DaySection'
import { WeekSummary } from './WeekSummary'

const LAST_CAT_KEY = 'gagyebu:lastCategory'

function readLastCategory(): string | null {
  try {
    return localStorage.getItem(LAST_CAT_KEY)
  } catch {
    return null
  }
}

export function WeeklyPage() {
  const [params, setParams] = useSearchParams()
  const w = params.get('w')
  const anchor = isValidKey(w) ? fromKey(w) : new Date()
  const days = weekDays(anchor)
  const prevDays = weekDays(addWeeks(anchor, -1))
  const isCurrentWeek = days.includes(todayKey())
  const goWeek = (delta: number) => {
    const next = weekDays(addWeeks(anchor, delta))
    setParams(next.includes(todayKey()) ? {} : { w: next[0] }, { replace: true })
    setSelected(new Set())
    setEditingId(null)
  }

  const expenses = useStore((s) => s.expenses)
  const categories = useStore((s) => s.categories)
  const setTripFor = useStore((s) => s.setTripFor)
  const deleteExpenses = useStore((s) => s.deleteExpenses)
  const restoreExpenses = useStore((s) => s.restoreExpenses)
  const trips = useStore((s) => s.trips)

  const thisWeek = useMemo(() => inDateRange(expenses, days[0], days[6]), [expenses, days[0]])
  const lastWeek = useMemo(() => inDateRange(expenses, prevDays[0], prevDays[6]), [expenses, prevDays[0]])
  const byDate = useMemo(() => groupByDate(thisWeek), [thisWeek])

  // 기본 카테고리 = 마지막에 쓴 것
  const [categoryId, setCategoryIdState] = useState<ID>(() => {
    const saved = readLastCategory()
    return saved && categories.some((c) => c.id === saved) ? saved : (sortedCategories(categories)[0]?.id ?? FALLBACK_CATEGORY_ID)
  })
  const setCategoryId = useCallback((id: ID) => {
    setCategoryIdState(id)
    try {
      localStorage.setItem(LAST_CAT_KEY, id)
    } catch {
      /* 저장 못 해도 동작에는 문제 없음 */
    }
  }, [])

  // 선택 / 수정
  const [selected, setSelected] = useState<Set<ID>>(new Set())
  const [editingId, setEditingId] = useState<ID | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const toggle = (id: ID) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const toggleDay = (ids: ID[], on: boolean) =>
    setSelected((s) => {
      const n = new Set(s)
      ids.forEach((id) => (on ? n.add(id) : n.delete(id)))
      return n
    })
  const selectedExpenses = thisWeek.filter((e) => selected.has(e.id))
  const selDates = selectedExpenses.map((e) => e.date).sort()

  // 날짜 간 키보드 이동
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const move = (i: number, dir: 1 | -1) => {
    const el = inputs.current[i + dir]
    if (!el) return false
    el.focus()
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    return true
  }

  const applyTrip = (tripId: ID) => {
    const ids = [...selected]
    setTripFor(ids, tripId)
    setPickerOpen(false)
    setSelected(new Set())
    showToast(`${ids.length}건에 ✈ ${trips.find((t) => t.id === tripId)?.name ?? '여행'} 적용`)
  }

  const rangeLabel = `${format(fromKey(days[0]), 'M월 d일')} – ${format(fromKey(days[6]), fromKey(days[0]).getMonth() === fromKey(days[6]).getMonth() ? 'd일' : 'M월 d일')}`

  return (
    <Page
      title="주간 입력"
      right={
        <div className="flex items-center gap-1">
          {!isCurrentWeek && (
            <Button variant="ghost" className="px-2.5 text-xs" onClick={() => setParams({}, { replace: true })}>
              이번 주
            </Button>
          )}
          <Button variant="ghost" className="px-2" onClick={() => goWeek(-1)} aria-label="이전 주">
            <Icon name="chevronLeft" />
          </Button>
          <span className="min-w-[7.5rem] text-center text-sm font-medium">{rangeLabel}</span>
          <Button variant="ghost" className="px-2" onClick={() => goWeek(1)} aria-label="다음 주">
            <Icon name="chevronRight" />
          </Button>
        </div>
      }
    >
      <SampleDataBanner />
      <div className="space-y-3">
        {days.map((d, i) => (
          <DaySection
            key={d}
            date={d}
            expenses={byDate.get(d) ?? []}
            selected={selected}
            onToggle={toggle}
            onToggleDay={toggleDay}
            editingId={editingId}
            setEditingId={setEditingId}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            inputRef={(el) => {
              inputs.current[i] = el
            }}
            onMove={(dir) => move(i, dir)}
          />
        ))}
        <WeekSummary thisWeek={thisWeek} lastWeek={lastWeek} />
        {selected.size > 0 && <div className="h-16" />}
      </div>

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          total={sum(selectedExpenses)}
          onTrip={() => setPickerOpen(true)}
          onUntag={() => {
            setTripFor([...selected], null)
            setSelected(new Set())
            showToast('여행 태그를 해제했어요')
          }}
          onDelete={() => {
            const removed = selectedExpenses
            deleteExpenses(removed.map((e) => e.id))
            setSelected(new Set())
            showToast(`${removed.length}건 삭제했어요`, { label: '되돌리기', onClick: () => restoreExpenses(removed) })
          }}
          onClear={() => setSelected(new Set())}
        />
      )}

      <TripPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={applyTrip}
        defaultStart={selDates[0] ?? days[0]}
        defaultEnd={selDates[selDates.length - 1] ?? days[6]}
      />
    </Page>
  )
}
