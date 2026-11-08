import { addDays } from 'date-fns'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { DateKey, ID } from '../../types'
import { CategoryBars } from '../../components/CategoryBars'
import { CategoryDot } from '../../components/CategoryDot'
import { ExpenseEditForm } from '../../components/ExpenseEditForm'
import { Icon } from '../../components/Icon'
import { Button, Card, Page } from '../../components/Page'
import { showToast } from '../../components/Toast'
import { daysBetween, fromKey, labelShort, toKey } from '../../lib/date'
import { formatDelta, formatWon } from '../../lib/money'
import { groupByDate, regionGroups, sum, tripStat } from '../../lib/stats'
import { useStore } from '../../store/useStore'
import { RegionCompare } from './RegionCompare'
import { nightsDays } from './TripCard'
import { TripFormSheet } from './TripFormSheet'

export function TripDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const trips = useStore((s) => s.trips)
  const expenses = useStore((s) => s.expenses)
  const categories = useStore((s) => s.categories)
  const deleteTrip = useStore((s) => s.deleteTrip)
  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<ID | null>(null)

  const trip = trips.find((t) => t.id === id)
  const stat = useMemo(() => (trip ? tripStat(trip, expenses) : null), [trip, expenses])
  const group = useMemo(() => {
    if (!trip) return undefined
    return regionGroups(trips.map((t) => tripStat(t, expenses))).find((g) => g.region === trip.region.trim())
  }, [trip, trips, expenses])

  // 날짜 목록: 여행 기간 전체 + 기간 밖에 태그된 지출 날짜
  const dates = useMemo(() => {
    if (!trip || !stat) return []
    const set = new Set<DateKey>()
    for (let d = fromKey(trip.startDate); toKey(d) <= trip.endDate; d = addDays(d, 1)) set.add(toKey(d))
    stat.expenses.forEach((e) => set.add(e.date))
    return [...set].sort()
  }, [trip, stat])

  if (!trip || !stat) {
    return (
      <Page title="여행">
        <Card className="text-center text-sm text-neutral-500">
          여행을 찾을 수 없어요.{' '}
          <Link to="/trips" className="underline">
            목록으로
          </Link>
        </Card>
      </Page>
    )
  }

  const byDate = groupByDate(stat.expenses)
  const dayMax = Math.max(1, ...dates.map((d) => sum(byDate.get(d) ?? [])))
  const cat = (cid: ID) => categories.find((c) => c.id === cid)
  const vsAvg = group ? stat.total - group.avgTotal : null

  return (
    <Page
      title={
        <span className="flex items-center gap-1">
          <Link to="/trips" className="-ml-2 rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="여행 목록">
            <Icon name="chevronLeft" />
          </Link>
          ✈ {trip.name}
        </span>
      }
      right={<Button onClick={() => setEditOpen(true)}>수정</Button>}
    >
      <div className="space-y-3">
        {/* 요약 */}
        <Card>
          <p className="text-xs text-neutral-500">
            {labelShort(trip.startDate)} ~ {labelShort(trip.endDate)} · {nightsDays(stat.days)} · {trip.region}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{formatWon(stat.total)}</p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-xs text-neutral-500">1일 평균</dt>
              <dd className="font-semibold">{formatWon(stat.perDay)}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">건수</dt>
              <dd className="font-semibold">{stat.expenses.length}건</dd>
            </div>
            {vsAvg != null && group && (
              <div>
                <dt className="text-xs text-neutral-500">{group.region} 평균 대비</dt>
                <dd
                  className={`font-semibold ${
                    vsAvg > 0 ? 'text-red-600 dark:text-red-400' : vsAvg < 0 ? 'text-emerald-600 dark:text-emerald-400' : ''
                  }`}
                >
                  {vsAvg > 0 ? '▲' : vsAvg < 0 ? '▼' : ''} {formatDelta(vsAvg)}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* 카테고리별 비율 */}
        <Card>
          <h2 className="mb-3 text-sm font-semibold">카테고리별</h2>
          <CategoryBars expenses={stat.expenses} />
        </Card>

        {/* 날짜별 지출 */}
        <Card>
          <h2 className="mb-3 text-sm font-semibold">날짜별</h2>
          <ul className="space-y-2">
            {dates.map((d) => {
              const t = sum(byDate.get(d) ?? [])
              const outside = d < trip.startDate || d > trip.endDate
              return (
                <li key={d} className="flex items-center gap-2.5 text-sm">
                  <span className={`w-20 shrink-0 ${outside ? 'text-neutral-400' : ''}`}>
                    {outside ? labelShort(d) : `${daysBetween(trip.startDate, d)}일차`}
                    {!outside && <span className="ml-1 text-xs text-neutral-500">{labelShort(d).split(' ')[0]}</span>}
                  </span>
                  <span className="h-2.5 flex-1">
                    {t > 0 && (
                      <span
                        className="block h-full rounded-l-sm rounded-r-[4px] bg-[#2a78d6] dark:bg-[#3987e5]"
                        style={{ width: `${Math.max(1.5, (t / dayMax) * 100)}%` }}
                      />
                    )}
                  </span>
                  <span className="w-[5.5rem] shrink-0 text-right font-medium">{t > 0 ? formatWon(t) : '-'}</span>
                </li>
              )
            })}
          </ul>
        </Card>

        {group && <RegionCompare group={group} highlightId={trip.id} />}

        {/* 전체 내역 */}
        <Card>
          <h2 className="mb-1 text-sm font-semibold">전체 내역</h2>
          {stat.expenses.length === 0 ? (
            <p className="py-3 text-sm text-neutral-500">
              태그된 지출이 없어요. "수정"에서 기간 내 지출에 태그를 붙이거나, 주간 입력에서 지출을 체크해 태그하세요.
            </p>
          ) : (
            dates
              .filter((d) => byDate.has(d))
              .map((d) => (
                <div key={d} className="mt-3">
                  <h3 className="mb-1 flex justify-between text-xs font-medium text-neutral-500">
                    <span>{labelShort(d)}</span>
                    <span>{formatWon(sum(byDate.get(d)!))}</span>
                  </h3>
                  <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {byDate.get(d)!.map((e) =>
                      editingId === e.id ? (
                        <li key={e.id} className="py-3">
                          <ExpenseEditForm expense={e} onDone={() => setEditingId(null)} />
                        </li>
                      ) : (
                        <li key={e.id}>
                          <button
                            onClick={() => setEditingId(e.id)}
                            className="flex w-full items-center gap-2 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                          >
                            <span className="flex w-14 shrink-0 items-center gap-1.5 text-sm">
                              <CategoryDot color={cat(e.categoryId)?.color} />
                              <span className="truncate">{cat(e.categoryId)?.name ?? '?'}</span>
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm text-neutral-500">{e.memo}</span>
                            <span className="text-sm font-medium">{formatWon(e.amount)}</span>
                          </button>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ))
          )}
        </Card>

        <Button
          variant="ghost"
          className="w-full text-red-600 dark:text-red-400"
          onClick={() => {
            if (!confirm(`'${trip.name}' 여행을 삭제할까요? 지출 기록은 남고 여행 태그만 사라져요.`)) return
            deleteTrip(trip.id)
            showToast(`'${trip.name}' 삭제했어요`)
            navigate('/trips')
          }}
        >
          여행 삭제
        </Button>
      </div>

      <TripFormSheet open={editOpen} onClose={() => setEditOpen(false)} trip={trip} />
    </Page>
  )
}
