import { useState } from 'react'
import type { ID, QuickItem } from '../../types'
import { CategoryDot } from '../../components/CategoryDot'
import { Icon } from '../../components/Icon'
import { Button, Card } from '../../components/Page'
import { inputCls } from '../../components/ui'
import { formatNumber, formatWon, parseAmount } from '../../lib/money'
import { sortedCategories, useStore } from '../../store/useStore'

/** 자주 쓰는 내역: 주간 입력/날짜 시트에서 한 번 눌러 추가하는 버튼들 */
export function QuickItemManager() {
  const quickItems = useStore((s) => s.quickItems)
  const categories = useStore((s) => s.categories)
  const deleteQuickItem = useStore((s) => s.deleteQuickItem)
  const [editing, setEditing] = useState<ID | 'new' | null>(null)
  const cat = (id: ID) => categories.find((c) => c.id === id)

  return (
    <Card>
      <h2 className="text-sm font-semibold">자주 쓰는 내역</h2>
      <p className="mt-0.5 mb-3 text-xs text-neutral-500">입력 칸을 누르면 버튼으로 나타나고, 한 번 누르면 바로 추가돼요.</p>
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {quickItems.map((q) =>
          editing === q.id ? (
            <li key={q.id} className="py-2">
              <QuickItemForm item={q} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={q.id} className="flex items-center gap-2">
              <button
                onClick={() => setEditing(q.id)}
                className="flex min-w-0 flex-1 items-center gap-2 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <CategoryDot color={cat(q.categoryId)?.color} />
                <span className="font-medium">{q.label}</span>
                <span className="text-neutral-500">{cat(q.categoryId)?.name}</span>
                <span className="ml-auto font-medium">{formatWon(q.amount)}</span>
              </button>
              <button
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-red-600 dark:hover:bg-neutral-800"
                onClick={() => deleteQuickItem(q.id)}
                aria-label={`${q.label} 삭제`}
              >
                <Icon name="close" className="size-4" />
              </button>
            </li>
          ),
        )}
      </ul>
      {editing === 'new' ? (
        <div className="mt-2">
          <QuickItemForm onDone={() => setEditing(null)} />
        </div>
      ) : (
        <Button className="mt-2" onClick={() => setEditing('new')} disabled={!sortedCategories(categories).length}>
          <Icon name="plus" className="size-4" /> 추가
        </Button>
      )}
    </Card>
  )
}

function QuickItemForm({ item, onDone }: { item?: QuickItem; onDone: () => void }) {
  const categories = useStore((s) => s.categories)
  const addQuickItem = useStore((s) => s.addQuickItem)
  const updateQuickItem = useStore((s) => s.updateQuickItem)
  const sorted = sortedCategories(categories)
  const [label, setLabel] = useState(item?.label ?? '')
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? sorted[0]?.id)
  const [amountText, setAmountText] = useState(item ? formatNumber(item.amount) : '')
  const amount = parseAmount(amountText)
  const valid = label.trim() && amount != null && categoryId

  return (
    <form
      className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_7rem_8rem_auto]"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        const data = { label: label.trim(), categoryId, amount: amount! }
        if (item) updateQuickItem(item.id, data)
        else addQuickItem(data)
        onDone()
      }}
      onKeyDown={(e) => e.key === 'Escape' && onDone()}
    >
      <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="이름 (예: 아아)" autoFocus />
      <select className={`${inputCls} w-auto`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        {sorted.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        className={inputCls}
        value={amountText}
        onChange={(e) => setAmountText(e.target.value)}
        placeholder="금액 (4500)"
        inputMode="decimal"
      />
      <div className="flex gap-1.5">
        <Button type="button" variant="ghost" onClick={onDone}>
          취소
        </Button>
        <Button type="submit" variant="primary" disabled={!valid}>
          저장
        </Button>
      </div>
    </form>
  )
}
