import { Link } from 'react-router'
import type { ID } from '../../types'
import { CategoryDot } from '../../components/CategoryDot'
import { Card } from '../../components/Page'
import { formatWon } from '../../lib/money'
import { catVars } from '../../lib/palette'
import { totalsByCategory, type RegionGroup } from '../../lib/stats'
import { sortedCategories, useStore } from '../../store/useStore'

/**
 * 같은 지역 여행 회차별 비교: 회차마다 카테고리 누적 막대(길이 = 총액), 점선 = 1회 평균.
 * highlightId가 있으면 그 여행만 진하게.
 */
export function RegionCompare({ group, highlightId }: { group: RegionGroup; highlightId?: ID }) {
  const categories = useStore((s) => s.categories)
  const max = Math.max(1, ...group.trips.map((t) => t.total))
  const avgPos = (group.avgTotal / max) * 100
  const usedCats = new Set(group.trips.flatMap((t) => t.expenses.map((e) => e.categoryId)))
  const legend = sortedCategories(categories).filter((c) => usedCats.has(c.id))

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold">
          {group.region} <span className="font-normal text-neutral-500">· {group.trips.length}회</span>
        </h2>
        <p className="text-xs text-neutral-500">1일 평균 {formatWon(group.avgPerDay)}</p>
      </div>
      <p className="mt-1 text-xl font-bold tracking-tight">
        <span className="mr-1.5 text-sm font-medium text-neutral-500">{group.region} 1회 평균</span>
        {formatWon(group.avgTotal)}
      </p>

      <ul className="mt-4 space-y-3">
        {group.trips.map((t) => {
          const dim = highlightId && t.trip.id !== highlightId
          // 회차끼리 비교하기 쉽게 모든 줄에서 같은 카테고리 순서
          const order = new Map(legend.map((c, i) => [c.id, i]))
          const byCat = totalsByCategory(t.expenses).sort((a, b) => (order.get(a.categoryId) ?? 99) - (order.get(b.categoryId) ?? 99))
          return (
            <li key={t.trip.id} className={dim ? 'opacity-45' : ''}>
              <Link to={`/trips/${t.trip.id}`} className="block rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className={t.trip.id === highlightId ? 'font-semibold' : 'font-medium'}>{t.trip.name}</span>
                  <span>
                    <span className="font-semibold">{formatWon(t.total)}</span>
                    <span className="ml-1.5 text-xs text-neutral-500">
                      {t.days}일 · 하루 {formatWon(t.perDay)}
                    </span>
                  </span>
                </div>
                <div className="relative h-3">
                  <div className="flex h-full gap-0.5" style={{ width: `${(t.total / max) * 100}%` }}>
                    {byCat.map((c) => {
                      const cat = categories.find((x) => x.id === c.categoryId)
                      return (
                        <div
                          key={c.categoryId}
                          className="cat-bg min-w-0.5 rounded-sm first:rounded-l-[4px] last:rounded-r-[4px]"
                          style={{ ...catVars(cat?.color), flexGrow: c.total }}
                          title={`${cat?.name} ${formatWon(c.total)}`}
                        />
                      )
                    })}
                  </div>
                  {/* 1회 평균 위치 */}
                  <div
                    className="absolute -top-1 -bottom-1 border-l-2 border-dashed border-neutral-900/50 dark:border-white/50"
                    style={{ left: `${avgPos}%` }}
                  />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
        {legend.map((c) => (
          <li key={c.id} className="inline-flex items-center gap-1">
            <CategoryDot color={c.color} className="size-1.5" />
            {c.name}
          </li>
        ))}
        <li className="inline-flex items-center gap-1">
          <span className="h-3 border-l-2 border-dashed border-neutral-900/50 dark:border-white/50" />
          1회 평균
        </li>
      </ul>
    </Card>
  )
}
