import type { Expense } from '../../types'
import { CategoryStack } from '../../components/CategoryStack'
import { Card } from '../../components/Page'
import { formatDelta, formatWon } from '../../lib/money'
import { sum } from '../../lib/stats'

export function WeekSummary({ thisWeek, lastWeek }: { thisWeek: Expense[]; lastWeek: Expense[] }) {
  const total = sum(thisWeek)
  const prev = sum(lastWeek)
  const delta = total - prev
  const pct = prev > 0 ? Math.round((delta / prev) * 100) : null

  return (
    <Card>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-500">이번 주 합계</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight">{formatWon(total)}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-xs text-neutral-500">지난주 {formatWon(prev)}</p>
          <p
            className={`mt-0.5 font-semibold ${
              delta > 0 ? 'text-red-600 dark:text-red-400' : delta < 0 ? 'text-emerald-600 dark:text-emerald-400' : ''
            }`}
          >
            {delta > 0 ? '▲' : delta < 0 ? '▼' : ''} {formatDelta(delta)}
            {pct != null && delta !== 0 && <span className="ml-1 font-normal">({Math.abs(pct)}%)</span>}
          </p>
        </div>
      </div>

      <CategoryStack expenses={thisWeek} className="mt-3" />
    </Card>
  )
}
