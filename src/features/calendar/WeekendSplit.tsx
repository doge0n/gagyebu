import type { DateKey, Expense } from '../../types'
import { Card } from '../../components/Page'
import { isWeekendKey } from '../../lib/date'
import { formatWon } from '../../lib/money'
import { weekendSplit } from '../../lib/stats'

/** 주말 vs 평일 지출 (days: 평균 낼 때 쓰는 날짜들 — 이번 달이면 오늘까지) */
export function WeekendSplit({ expenses, days }: { expenses: Expense[]; days: DateKey[] }) {
  const s = weekendSplit(expenses, days, isWeekendKey)
  const total = s.weekend + s.weekday
  if (total === 0) return null
  const rows = [
    { key: 'weekday', label: '평일', total: s.weekday, days: s.weekdayDays, cls: 'bg-[#2a78d6] dark:bg-[#3987e5]' },
    { key: 'weekend', label: '주말', total: s.weekend, days: s.weekendDays, cls: 'bg-[#eb6834] dark:bg-[#d95926]' },
  ]
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold">주말 vs 평일</h2>
      <div className="flex h-2.5 gap-0.5">
        {rows.map((r) =>
          r.total > 0 ? (
            <div key={r.key} className={`${r.cls} min-w-1 rounded-sm first:rounded-l-full last:rounded-r-full`} style={{ flexGrow: r.total }} />
          ) : null,
        )}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        {rows.map((r) => (
          <div key={r.key}>
            <dt className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span className={`${r.cls} size-2 rounded-full`} />
              {r.label} {r.days}일 · {Math.round((r.total / total) * 100)}%
            </dt>
            <dd className="mt-0.5 font-semibold">{formatWon(r.total)}</dd>
            <dd className="text-xs text-neutral-500">하루 평균 {formatWon(r.days ? r.total / r.days : 0)}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
