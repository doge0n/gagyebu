import { addMonths, format, getDaysInMonth } from 'date-fns'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { DateKey } from '../../types'
import { CategoryStack } from '../../components/CategoryStack'
import { Icon } from '../../components/Icon'
import { Button, Card, Page } from '../../components/Page'
import { SampleDataBanner } from '../../components/SampleDataBanner'
import { monthGrid, monthKey, todayKey, toKey } from '../../lib/date'
import { formatDelta, formatWon } from '../../lib/money'
import { dailyTotals, monthlyTotals, sum } from '../../lib/stats'
import { useStore } from '../../store/useStore'
import { BudgetBar } from './BudgetBar'
import { DayDetailSheet } from './DayDetailSheet'
import { MonthGrid } from './MonthGrid'
import { TrendChart } from './TrendChart'
import { WeekendSplit } from './WeekendSplit'

export function CalendarPage() {
  const [params, setParams] = useSearchParams()
  const m = params.get('m')
  const first = m && /^\d{4}-\d{2}$/.test(m) ? new Date(Number(m.slice(0, 4)), Number(m.slice(5)) - 1, 1) : new Date()
  const year = first.getFullYear()
  const month0 = first.getMonth()
  const mk = monthKey(first)
  const thisMonth = monthKey(new Date())
  const isCurrent = mk === thisMonth
  const goMonth = (key: string) => setParams(key === thisMonth ? {} : { m: key }, { replace: true })

  const expenses = useStore((s) => s.expenses)
  const trips = useStore((s) => s.trips)
  const [openDate, setOpenDate] = useState<DateKey | null>(null)

  const days = useMemo(() => monthGrid(year, month0), [year, month0])
  const totals = useMemo(() => dailyTotals(expenses), [expenses])
  const monthExpenses = useMemo(() => expenses.filter((e) => e.date.startsWith(mk)), [expenses, mk])
  const prevKey = monthKey(addMonths(first, -1))
  const prevTotal = useMemo(() => sum(expenses.filter((e) => e.date.startsWith(prevKey))), [expenses, prevKey])
  const trend = useMemo(
    () => monthlyTotals(expenses, Array.from({ length: 6 }, (_, i) => monthKey(addMonths(first, i - 5)))),
    [expenses, mk], // first는 매 렌더 새 객체라 mk로 대신
  )

  const total = sum(monthExpenses)
  const delta = total - prevTotal

  // 이번 달이면 오늘까지만 (평균·예산 계산용)
  const dim = getDaysInMonth(first)
  const today = todayKey()
  const monthDays = Array.from({ length: dim }, (_, i) => toKey(new Date(year, month0, i + 1)))
  const elapsedDays = isCurrent ? monthDays.filter((d) => d <= today) : mk < thisMonth ? monthDays : []
  const todayDate = new Date().getDate()

  return (
    <Page
      title={format(first, 'yyyy년 M월')}
      right={
        <div className="flex items-center gap-1">
          {!isCurrent && (
            <Button variant="ghost" className="px-2.5 text-xs" onClick={() => goMonth(thisMonth)}>
              이번 달
            </Button>
          )}
          <Button variant="ghost" className="px-2" onClick={() => goMonth(prevKey)} aria-label="이전 달">
            <Icon name="chevronLeft" />
          </Button>
          <Button variant="ghost" className="px-2" onClick={() => goMonth(monthKey(addMonths(first, 1)))} aria-label="다음 달">
            <Icon name="chevronRight" />
          </Button>
        </div>
      }
    >
      <SampleDataBanner />
      <div className="space-y-3">
        {/* 월 요약 */}
        <Card>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-neutral-500">{month0 + 1}월 총액</p>
              <p className="mt-0.5 text-3xl font-bold tracking-tight">{formatWon(total)}</p>
            </div>
            {prevTotal > 0 && (
              <p className="text-right text-xs text-neutral-500">
                지난달 대비
                <span
                  className={`block text-sm font-semibold ${
                    delta > 0 ? 'text-red-600 dark:text-red-400' : delta < 0 ? 'text-emerald-600 dark:text-emerald-400' : ''
                  }`}
                >
                  {delta > 0 ? '▲' : delta < 0 ? '▼' : ''} {formatDelta(delta)}
                </span>
              </p>
            )}
          </div>
          <div className="mt-3">
            <BudgetBar
              spent={total}
              elapsedRatio={isCurrent ? todayDate / dim : undefined}
              daysLeft={isCurrent ? dim - todayDate + 1 : undefined}
            />
          </div>
          <CategoryStack expenses={monthExpenses} className="mt-4" />
        </Card>

        {/* 달력 */}
        <Card className="px-1.5 pb-2 sm:px-3">
          <MonthGrid days={days} month0={month0} totals={totals} trips={trips} onPick={setOpenDate} />
        </Card>

        <WeekendSplit expenses={monthExpenses} days={elapsedDays} />
        <TrendChart data={trend} current={mk} onPick={goMonth} />
      </div>

      <DayDetailSheet date={openDate} onClose={() => setOpenDate(null)} />
    </Page>
  )
}
