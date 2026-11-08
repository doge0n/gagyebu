import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { DateKey, ID } from '../../types'
import { CategoryDot } from '../../components/CategoryDot'
import { ExpenseEditForm } from '../../components/ExpenseEditForm'
import { Button } from '../../components/Page'
import { Sheet } from '../../components/Sheet'
import { TripBadge } from '../../components/TripBadge'
import { fromKey, weekdayKo } from '../../lib/date'
import { formatWon } from '../../lib/money'
import { sum, tripForDate } from '../../lib/stats'
import { FALLBACK_CATEGORY_ID } from '../../store/defaults'
import { sortedCategories, useStore } from '../../store/useStore'
import { QuickAddRow } from '../weekly/QuickAddRow'

/** 날짜를 누르면 뜨는 세부 내역: 목록, 눌러서 수정/삭제, 바로 추가 */
export function DayDetailSheet({ date, onClose }: { date: DateKey | null; onClose: () => void }) {
  const d = date ? fromKey(date) : null
  return (
    <Sheet
      open={!!date}
      onClose={onClose}
      title={d ? `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdayKo(date!)})` : ''}
    >
      {date && <Body key={date} date={date} onClose={onClose} />}
    </Sheet>
  )
}

function Body({ date, onClose }: { date: DateKey; onClose: () => void }) {
  const navigate = useNavigate()
  const allExpenses = useStore((s) => s.expenses)
  const categories = useStore((s) => s.categories)
  const trips = useStore((s) => s.trips)
  const expenses = allExpenses.filter((e) => e.date === date).sort((a, b) => a.createdAt - b.createdAt)
  const dayTrip = tripForDate(trips, date)
  const [editingId, setEditingId] = useState<ID | null>(null)
  const [categoryId, setCategoryId] = useState<ID>(sortedCategories(categories)[0]?.id ?? FALLBACK_CATEGORY_ID)
  const cat = (id: ID) => categories.find((c) => c.id === id)

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {dayTrip && <TripBadge name={dayTrip.name} />}
        <span className="ml-auto text-lg font-bold">{formatWon(sum(expenses))}</span>
      </div>

      {expenses.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-500">이 날은 기록이 없어요.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {expenses.map((e) =>
            editingId === e.id ? (
              <li key={e.id} className="py-3">
                <ExpenseEditForm expense={e} onDone={() => setEditingId(null)} />
              </li>
            ) : (
              <li key={e.id}>
                <button
                  onClick={() => setEditingId(e.id)}
                  className="flex w-full items-center gap-2 py-2.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <span className="flex w-14 shrink-0 items-center gap-1.5 text-sm">
                    <CategoryDot color={cat(e.categoryId)?.color} />
                    <span className="truncate">{cat(e.categoryId)?.name ?? '?'}</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-500">
                    {e.memo}
                    {e.tripId && e.tripId !== dayTrip?.id && (
                      <span className="ml-1.5">
                        <TripBadge name={trips.find((t) => t.id === e.tripId)?.name ?? '여행'} />
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-medium">{formatWon(e.amount)}</span>
                </button>
              </li>
            ),
          )}
        </ul>
      )}

      <div className="mt-3 border-t border-neutral-100 pt-1 dark:border-neutral-800">
        <QuickAddRow date={date} categoryId={categoryId} onCategoryChange={setCategoryId} />
      </div>

      <Button
        variant="ghost"
        className="mt-3 w-full text-neutral-500"
        onClick={() => {
          onClose()
          navigate(`/weekly?w=${date}`)
        }}
      >
        이 주 입력 화면으로 →
      </Button>
    </div>
  )
}
