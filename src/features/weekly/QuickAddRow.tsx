import { useState, type Ref } from 'react'
import type { DateKey, ID } from '../../types'
import { CategoryDot } from '../../components/CategoryDot'
import { formatWon } from '../../lib/money'
import { parseEntry } from '../../lib/quickLine'
import { tripForDate } from '../../lib/stats'
import { sortedCategories, useStore } from '../../store/useStore'

/**
 * 날짜별 입력 칸. 한 칸에 "4500 스벅", "교통 2 숙박 5" 모두 입력 → Enter.
 * 칸이 비었을 때 Tab/↓ = 다음 날, Shift+Tab/↑ = 이전 날.
 */
export function QuickAddRow({
  date,
  categoryId,
  onCategoryChange,
  inputRef,
  onMove,
  autoFocus,
}: {
  date: DateKey
  categoryId: ID
  onCategoryChange: (id: ID) => void
  inputRef?: Ref<HTMLInputElement>
  onMove?: (dir: 1 | -1) => boolean
  autoFocus?: boolean
}) {
  const categories = useStore((s) => s.categories)
  const trips = useStore((s) => s.trips)
  const quickItems = useStore((s) => s.quickItems)
  const settings = useStore((s) => s.settings)
  const addExpenses = useStore((s) => s.addExpenses)
  const [text, setText] = useState('')

  const sorted = sortedCategories(categories)
  const items = parseEntry(text, categories, categoryId, { smallNumberAsMan: settings.smallNumberAsMan })
  const catOf = (id: ID) => categories.find((c) => c.id === id)
  const autoTripId = settings.autoTagTrips ? tripForDate(trips, date)?.id : undefined

  const submit = () => {
    if (items.length === 0) return
    addExpenses(items.map((it) => ({ date, amount: it.amount, categoryId: it.categoryId, memo: it.memo, tripId: autoTripId })))
    // 한 건만 입력했을 때만 기본 카테고리를 바꿈 (여러 건 줄은 기본값 유지)
    if (items.length === 1) onCategoryChange(items[0].categoryId)
    setText('')
  }

  const current = catOf(categoryId)

  return (
    <div className="group/add mt-2">
      <div className="flex items-stretch gap-2">
        {/* 기본 카테고리 (숫자만 입력했을 때 적용) */}
        <label className="relative flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 px-2.5 text-sm dark:border-neutral-700">
          <CategoryDot color={current?.color ?? '#999'} />
          <span className="min-w-[2.5em]">{current?.name}</span>
          <select
            tabIndex={-1}
            aria-label="기본 카테고리"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {sorted.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return // 한글 조합 중 Enter 무시
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            } else if (e.key === 'Escape') {
              setText('')
            } else if (!text && (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey))) {
              if (onMove?.(1)) e.preventDefault()
            } else if (!text && (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey))) {
              if (onMove?.(-1)) e.preventDefault()
            }
          }}
          placeholder="4500 커피 · 교통 2 숙박 5"
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base outline-none placeholder:text-neutral-400 focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-400"
          enterKeyHint="done"
          autoComplete="off"
        />
      </div>

      {/* 미리보기 */}
      {text.trim() && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 px-1 text-xs">
          {items.length === 0 ? (
            <span className="text-red-500">금액을 인식하지 못했어요</span>
          ) : (
            <>
              {items.map((it, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">
                  <CategoryDot color={catOf(it.categoryId)?.color ?? '#999'} className="size-1.5" />
                  {catOf(it.categoryId)?.name} {formatWon(it.amount)}
                  {it.memo && <span className="text-neutral-500">· {it.memo}</span>}
                </span>
              ))}
              <span className="text-neutral-400">↵ Enter로 저장</span>
            </>
          )}
        </div>
      )}

      {/* 자주 쓰는 내역: 입력 칸에 포커스가 있을 때 표시, 누르면 바로 추가 */}
      {!text && quickItems.length > 0 && (
        <div className="mt-1.5 hidden flex-wrap gap-1.5 px-1 group-focus-within/add:flex">
          {quickItems.map((q) => (
            <button
              key={q.id}
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()} // 입력 칸 포커스 유지
              onClick={() =>
                addExpenses([{ date, amount: q.amount, categoryId: q.categoryId, memo: q.memo ?? q.label, tripId: autoTripId }])
              }
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-2.5 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <CategoryDot color={catOf(q.categoryId)?.color ?? '#999'} className="size-1.5" />
              {q.label} {formatWon(q.amount)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
