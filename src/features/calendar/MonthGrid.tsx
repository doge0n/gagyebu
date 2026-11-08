import type { DateKey, Trip } from '../../types'
import { fromKey, todayKey } from '../../lib/date'
import { formatCompact, formatWon } from '../../lib/money'
import { heatLevel, tripForDate } from '../../lib/stats'

const WEEK_HEAD = ['월', '화', '수', '목', '금', '토', '일']

export function MonthGrid({
  days,
  month0,
  totals,
  trips,
  onPick,
}: {
  days: DateKey[]
  /** 이번 달 (0~11). 다른 달 날짜는 흐리게 */
  month0: number
  totals: Map<DateKey, number>
  trips: Trip[]
  onPick: (d: DateKey) => void
}) {
  const today = todayKey()
  // 히트맵 기준은 이번 달 날짜만
  const max = Math.max(0, ...days.filter((d) => fromKey(d).getMonth() === month0).map((d) => totals.get(d) ?? 0))

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-neutral-200 pb-1.5 text-center text-xs font-medium text-neutral-500 dark:border-neutral-800">
        {WEEK_HEAD.map((w, i) => (
          <div key={w} className={i === 5 ? 'text-blue-500' : i === 6 ? 'text-red-500' : ''}>
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const date = fromKey(d)
          const inMonth = date.getMonth() === month0
          const total = totals.get(d) ?? 0
          const level = inMonth ? heatLevel(total, max) : 0
          const trip = tripForDate(trips, d)
          // 이름 표시 칸: 여행 첫날 / 줄의 첫 칸 / 이번 달 첫날 (다른 달 칸에는 표시 안 함)
          const isStart =
            !!trip && inMonth && (trip.startDate === d || i % 7 === 0 || fromKey(days[i - 1] ?? d).getMonth() !== month0)
          // 이름이 넘쳐도 되는 폭 = 같은 줄에서 여행이 이어지는 칸 수
          let span = 1
          if (isStart) while (span < 7 - (i % 7) && days[i + span] <= trip!.endDate) span++
          const isTripStart = trip?.startDate === d
          const isTripEnd = trip?.endDate === d
          const dow = date.getDay()
          return (
            <button
              key={d}
              onClick={() => onPick(d)}
              className={`group relative flex h-[4.5rem] flex-col border-b border-neutral-100 text-left transition-colors sm:h-[5.5rem] dark:border-neutral-800/70 ${
                level ? `heat-${level}` : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              } ${inMonth ? '' : 'opacity-35'}`}
              title={total ? `${d} · ${formatWon(total)}` : d}
              aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일${total ? `, ${formatWon(total)}` : ''}${trip ? `, ${trip.name}` : ''}`}
            >
              <span className="flex px-1 pt-1 sm:px-1.5">
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-full text-[11px] font-medium sm:size-6 sm:text-xs ${
                    d === today
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : level < 4 && dow === 0
                        ? 'text-red-500'
                        : level < 4 && dow === 6
                          ? 'text-blue-500'
                          : ''
                  }`}
                >
                  {date.getDate()}
                </span>
              </span>

              {/* 여행 띠: 칸 사이 끊김 없이 이어지도록 좌우 여백 없음 */}
              <span className="mt-0.5 h-4">
                {trip && (
                  <span
                    className={`flex h-4 items-center bg-neutral-900 text-[10px] leading-none font-medium whitespace-nowrap text-white dark:bg-neutral-600 dark:text-white ${
                      isTripStart ? 'ml-1 rounded-l-full pl-1.5' : 'pl-1'
                    } ${isTripEnd ? 'mr-1 rounded-r-full' : ''}`}
                  >
                    {/* 이름은 옆 칸 띠 위로 넘쳐도 보이도록 */}
                    {isStart && (
                      <span
                        className="relative z-10 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{ maxWidth: `calc(${span * 100}% - 0.5rem)` }}
                      >
                        ✈ {trip.name}
                      </span>
                    )}
                  </span>
                )}
              </span>

              <span className="mt-auto truncate px-1 pb-1 text-right text-[11px] font-semibold sm:px-1.5 sm:text-sm">
                {total > 0 ? formatCompact(total) : ''}
              </span>
            </button>
          )
        })}
      </div>

      {/* 히트맵 범례 */}
      <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-neutral-500">
        적음
        {[1, 2, 3, 4].map((l) => (
          <span key={l} className={`heat-${l} size-3 rounded-sm`} />
        ))}
        많음
      </div>
    </div>
  )
}
