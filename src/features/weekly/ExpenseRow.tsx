import type { Category, Expense, Trip } from '../../types'
import { CategoryDot } from '../../components/CategoryDot'
import { ExpenseEditForm } from '../../components/ExpenseEditForm'
import { TripBadge } from '../../components/TripBadge'
import { formatWon } from '../../lib/money'

export function ExpenseRow({
  expense,
  category,
  trip,
  sameAsDayTrip,
  checked,
  onToggle,
  editing,
  onEdit,
  onEditDone,
}: {
  expense: Expense
  category?: Category
  trip?: Trip
  /** 그 날의 여행과 같은 태그면 이름 대신 ✈만 표시 */
  sameAsDayTrip?: boolean
  checked: boolean
  onToggle: () => void
  editing: boolean
  onEdit: () => void
  onEditDone: () => void
}) {
  if (editing) {
    return (
      <li className="my-1 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/60">
        <ExpenseEditForm expense={expense} onDone={onEditDone} />
      </li>
    )
  }
  return (
    <li className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="size-4 shrink-0 accent-neutral-900 dark:accent-white"
        aria-label="선택"
      />
      <button
        onClick={onEdit}
        className="-mx-1 flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
      >
        <span className="flex w-14 shrink-0 items-center gap-1.5 text-sm">
          <CategoryDot color={category?.color ?? '#999'} />
          <span className="truncate">{category?.name ?? '?'}</span>
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          {expense.memo && <span className="truncate text-sm text-neutral-500">{expense.memo}</span>}
          {trip &&
            (sameAsDayTrip ? (
              <span className="text-xs text-neutral-400" title={trip.name}>
                ✈
              </span>
            ) : (
              <TripBadge name={trip.name} />
            ))}
        </span>
        <span className="shrink-0 text-sm font-medium">{formatWon(expense.amount)}</span>
      </button>
    </li>
  )
}
