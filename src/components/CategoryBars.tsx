import type { Expense } from '../types'
import { formatWon } from '../lib/money'
import { catVars } from '../lib/palette'
import { sum, totalsByCategory } from '../lib/stats'
import { useStore } from '../store/useStore'
import { CategoryDot } from './CategoryDot'

/** 카테고리별 가로 막대 (이름 · 막대 · 금액 · 비율). 막대 길이는 가장 큰 카테고리 기준 */
export function CategoryBars({ expenses }: { expenses: Expense[] }) {
  const categories = useStore((s) => s.categories)
  const total = sum(expenses)
  if (total === 0) return <p className="text-sm text-neutral-500">지출이 없어요.</p>
  const rows = totalsByCategory(expenses)
  const max = rows[0].total
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const c = categories.find((x) => x.id === r.categoryId)
        const pct = Math.round((r.total / total) * 100)
        return (
          <li key={r.categoryId} className="flex items-center gap-2.5 text-sm">
            <span className="flex w-14 shrink-0 items-center gap-1.5">
              <CategoryDot color={c?.color} />
              <span className="truncate">{c?.name ?? '?'}</span>
            </span>
            <span className="h-2.5 flex-1">
              <span
                className="cat-bg block h-full rounded-r-[4px] rounded-l-sm"
                style={{ ...catVars(c?.color), width: `${Math.max(1.5, (r.total / max) * 100)}%` }}
              />
            </span>
            <span className="w-[5.5rem] shrink-0 text-right font-medium">{formatWon(r.total)}</span>
            <span className="w-9 shrink-0 text-right text-xs text-neutral-500">{pct}%</span>
          </li>
        )
      })}
    </ul>
  )
}
