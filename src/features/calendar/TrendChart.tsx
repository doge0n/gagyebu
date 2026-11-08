import { Card } from '../../components/Page'
import { formatCompact, formatWon } from '../../lib/money'

/** 최근 6개월 총액 막대. 보고 있는 달은 진하게 + 값 표시, 막대를 누르면 그 달로 이동 */
export function TrendChart({
  data,
  current,
  onPick,
}: {
  data: { month: string; total: number }[]
  current: string
  onPick: (month: string) => void
}) {
  const max = Math.max(1, ...data.map((d) => d.total))
  const withData = data.filter((d) => d.total > 0)
  const avg = withData.length ? withData.reduce((a, d) => a + d.total, 0) / withData.length : 0
  return (
    <Card>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">최근 6개월</h2>
        {avg > 0 && <span className="text-xs text-neutral-500">월 평균 {formatWon(avg)}</span>}
      </div>
      <div className="flex h-36 items-end gap-2 border-b border-neutral-300 dark:border-neutral-700">
        {data.map((d) => {
          const isCur = d.month === current
          const h = (d.total / max) * 100 // 막대는 최대 85%까지 (위는 값 라벨 자리)
          const m = Number(d.month.slice(5))
          return (
            <button
              key={d.month}
              onClick={() => onPick(d.month)}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
              aria-label={`${m}월 ${formatWon(d.total)}`}
            >
              {/* 호버 툴팁 */}
              <span className="pointer-events-none absolute -top-1 z-10 hidden -translate-y-full rounded-lg bg-neutral-900 px-2 py-1 text-[11px] whitespace-nowrap text-white shadow group-hover:block dark:bg-neutral-100 dark:text-neutral-900">
                {m}월 · {formatWon(d.total)}
              </span>
              {isCur && d.total > 0 && (
                <span className="mb-1 text-[11px] font-semibold group-hover:invisible">{formatCompact(d.total)}</span>
              )}
              <span
                className={`w-full max-w-10 rounded-t-[4px] transition-opacity ${
                  isCur ? 'bg-[#2a78d6] dark:bg-[#3987e5]' : 'bg-[#2a78d6]/35 group-hover:bg-[#2a78d6]/60 dark:bg-[#3987e5]/35'
                }`}
                style={{ height: d.total > 0 ? `max(${h * 0.85}%, 3px)` : 0 }}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-2">
        {data.map((d) => (
          <span
            key={d.month}
            className={`flex-1 text-center text-[11px] ${d.month === current ? 'font-semibold' : 'text-neutral-500'}`}
          >
            {Number(d.month.slice(5))}월
          </span>
        ))}
      </div>
    </Card>
  )
}
