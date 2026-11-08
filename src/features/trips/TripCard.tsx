import { Link } from 'react-router'
import { CategoryStackBar } from '../../components/CategoryStack'
import { labelShort } from '../../lib/date'
import { formatWon } from '../../lib/money'
import type { TripStat } from '../../lib/stats'

export function nightsDays(days: number) {
  return days <= 1 ? '당일치기' : `${days - 1}박 ${days}일`
}

export function TripCard({ stat }: { stat: TripStat }) {
  const { trip, total, days, perDay, expenses } = stat
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="truncate font-semibold">✈ {trip.name}</h3>
        <span className="shrink-0 text-xs text-neutral-500">{nightsDays(days)}</span>
      </div>
      <p className="mt-0.5 text-xs text-neutral-500">
        {labelShort(trip.startDate)} ~ {labelShort(trip.endDate)}
      </p>
      <p className="mt-3 text-xl font-bold tracking-tight">{formatWon(total)}</p>
      <p className="text-xs text-neutral-500">
        1일 평균 {formatWon(perDay)} · {expenses.length}건
      </p>
      <CategoryStackBar expenses={expenses} className="mt-3" />
    </Link>
  )
}
