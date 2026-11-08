import { useState } from 'react'
import type { Expense } from '../types'
import { formatNumber, formatWon, parseAmount } from '../lib/money'
import { sortedCategories, useStore } from '../store/useStore'
import { Button } from './Page'
import { showToast } from './Toast'
import { inputCls, labelCls } from './ui'

/** 지출 1건 수정/삭제 폼 (주간 입력 인라인, 달력 상세 시트에서 공용) */
export function ExpenseEditForm({ expense, onDone }: { expense: Expense; onDone: () => void }) {
  const categories = useStore((s) => s.categories)
  const trips = useStore((s) => s.trips)
  const smallNumberAsMan = useStore((s) => s.settings.smallNumberAsMan)
  const updateExpense = useStore((s) => s.updateExpense)
  const deleteExpenses = useStore((s) => s.deleteExpenses)
  const restoreExpenses = useStore((s) => s.restoreExpenses)

  const [date, setDate] = useState(expense.date)
  const [categoryId, setCategoryId] = useState(expense.categoryId)
  const [amountText, setAmountText] = useState(formatNumber(expense.amount))
  const [memo, setMemo] = useState(expense.memo ?? '')
  const [tripId, setTripId] = useState(expense.tripId ?? '')
  const amount = parseAmount(amountText, { smallNumberAsMan })

  const save = () => {
    if (amount == null || !date) return
    updateExpense(expense.id, {
      date,
      categoryId,
      amount,
      memo: memo.trim() || undefined,
      tripId: tripId || undefined,
    })
    onDone()
  }

  const remove = () => {
    deleteExpenses([expense.id])
    showToast('1건 삭제했어요', { label: '되돌리기', onClick: () => restoreExpenses([expense]) })
    onDone()
  }

  return (
    <form
      className="grid grid-cols-2 gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      onKeyDown={(e) => e.key === 'Escape' && onDone()}
    >
      <div>
        <label className={labelCls}>날짜</label>
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div>
        <label className={labelCls}>카테고리</label>
        <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {sortedCategories(categories).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>
          금액 {amount != null && <span className="text-neutral-400">· {formatWon(amount)}</span>}
        </label>
        <input
          className={`${inputCls} ${amount == null ? 'border-red-400 dark:border-red-500' : ''}`}
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          inputMode="decimal"
          autoFocus
          onFocus={(e) => e.target.select()}
        />
      </div>
      <div>
        <label className={labelCls}>여행</label>
        <select className={inputCls} value={tripId} onChange={(e) => setTripId(e.target.value)}>
          <option value="">없음</option>
          {[...trips]
            .sort((a, b) => b.startDate.localeCompare(a.startDate))
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
        </select>
      </div>
      <div className="col-span-2">
        <label className={labelCls}>메모</label>
        <input className={inputCls} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="선택" />
      </div>
      <div className="col-span-2 mt-1 flex items-center gap-2">
        <Button type="button" variant="ghost" className="text-red-600 dark:text-red-400" onClick={remove}>
          삭제
        </Button>
        <div className="flex-1" />
        <Button type="button" onClick={onDone}>
          취소
        </Button>
        <Button type="submit" variant="primary" disabled={amount == null}>
          저장
        </Button>
      </div>
    </form>
  )
}
