import type { Expense } from '../types'
import { formatWon } from '../lib/money'
import { catVars } from '../lib/palette'
import { sum, totalsByCategory } from '../lib/stats'
import { useStore } from '../store/useStore'
import { CategoryDot } from './CategoryDot'

/** 카테고리 비율 가로 누적 막대 + 범례(이름·금액·비율) */
export function CategoryStack({ expenses, className = '' }: { expenses: Expense[]; className?: string }) {
  const categories = useStore((s) => s.categories)
  const total = sum(expenses)
  if (total === 0) return null
  const byCat = totalsByCategory(expenses)
  const cat = (id: string) => categories.find((c) => c.id === id)
  return (
    <div className={className}>
      {/* 구간 사이 2px 간격 */}
      <div className="flex h-2.5 gap-0.5">
        {byCat.map((c) => (
          <div
            key={c.categoryId}
            className="cat-bg min-w-1 rounded-sm first:rounded-l-full last:rounded-r-full"
            style={{ ...catVars(cat(c.categoryId)?.color), flexGrow: c.total }}
            title={`${cat(c.categoryId)?.name} ${formatWon(c.total)} (${Math.round((c.total / total) * 100)}%)`}
          />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
        {byCat.map((c) => (
          <li key={c.categoryId} className="inline-flex items-center gap-1">
            <CategoryDot color={cat(c.categoryId)?.color} className="size-2" />
            <span className="text-neutral-900 dark:text-neutral-100">{cat(c.categoryId)?.name}</span>
            {formatWon(c.total)}
            <span className="text-neutral-400">{Math.round((c.total / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 범례 없이 막대만 (카드 등 좁은 곳) */
export function CategoryStackBar({ expenses, className = '' }: { expenses: Expense[]; className?: string }) {
  const categories = useStore((s) => s.categories)
  const total = sum(expenses)
  if (total === 0) return null
  return (
    <div className={`flex h-1.5 gap-0.5 ${className}`}>
      {totalsByCategory(expenses).map((c) => {
        const cat = categories.find((x) => x.id === c.categoryId)
        return (
          <div
            key={c.categoryId}
            className="cat-bg min-w-0.5 rounded-sm first:rounded-l-full last:rounded-r-full"
            style={{ ...catVars(cat?.color), flexGrow: c.total }}
            title={`${cat?.name} ${formatWon(c.total)}`}
          />
        )
      })}
    </div>
  )
}
