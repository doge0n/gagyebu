import type { Ref } from 'react'
import type { DateKey, Expense, ID } from '../../types'
import { Card } from '../../components/Page'
import { TripBadge } from '../../components/TripBadge'
import { fromKey, labelShort, todayKey } from '../../lib/date'
import { formatWon } from '../../lib/money'
import { sum, tripForDate } from '../../lib/stats'
import { useStore } from '../../store/useStore'
import { ExpenseRow } from './ExpenseRow'
import { QuickAddRow } from './QuickAddRow'

export function DaySection({
  date,
  expenses,
  selected,
  onToggle,
  onToggleDay,
  editingId,
  setEditingId,
  categoryId,
  onCategoryChange,
  inputRef,
  onMove,
}: {
  date: DateKey
  expenses: Expense[]
  selected: Set<ID>
  onToggle: (id: ID) => void
  onToggleDay: (ids: ID[], on: boolean) => void
  editingId: ID | null
  setEditingId: (id: ID | null) => void
  categoryId: ID
  onCategoryChange: (id: ID) => void
  inputRef: Ref<HTMLInputElement>
  onMove: (dir: 1 | -1) => boolean
}) {
  const categories = useStore((s) => s.categories)
  const trips = useStore((s) => s.trips)
  const dayTrip = tripForDate(trips, date)
  const dow = fromKey(date).getDay()
  const isToday = date === todayKey()
  const ids = expenses.map((e) => e.id)
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id))

  return (
    <Card className={`p-3 sm:p-4 ${isToday ? 'ring-2 ring-neutral-900/10 dark:ring-white/15' : ''}`}>
      <header className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={allChecked}
          disabled={ids.length === 0}
          onChange={() => onToggleDay(ids, !allChecked)}
          className="size-4 shrink-0 accent-neutral-900 disabled:opacity-20 dark:accent-white"
          aria-label="이 날 전체 선택"
        />
        <h2
          className={`text-sm font-semibold ${dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : ''}`}
        >
          {labelShort(date)}
        </h2>
        {isToday && <span className="text-[11px] font-medium text-neutral-400">오늘</span>}
        {dayTrip && <TripBadge name={dayTrip.name} />}
        <span className="ml-auto text-sm font-semibold">{expenses.length > 0 ? formatWon(sum(expenses)) : ''}</span>
      </header>

      {expenses.length > 0 && (
        <ul className="mt-1.5">
          {expenses.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              category={categories.find((c) => c.id === e.categoryId)}
              trip={e.tripId ? trips.find((t) => t.id === e.tripId) : undefined}
              sameAsDayTrip={!!dayTrip && e.tripId === dayTrip.id}
              checked={selected.has(e.id)}
              onToggle={() => onToggle(e.id)}
              editing={editingId === e.id}
              onEdit={() => setEditingId(e.id)}
              onEditDone={() => setEditingId(null)}
            />
          ))}
        </ul>
      )}

      <QuickAddRow
        date={date}
        categoryId={categoryId}
        onCategoryChange={onCategoryChange}
        inputRef={inputRef}
        onMove={onMove}
      />
    </Card>
  )
}
