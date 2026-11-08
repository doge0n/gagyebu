import { useState } from 'react'
import { Button } from '../../components/Page'
import { Sheet } from '../../components/Sheet'
import { inputCls, labelCls } from '../../components/ui'
import { formatNumber, formatWon, parseAmount } from '../../lib/money'
import { useStore } from '../../store/useStore'

/**
 * 월 예산 진행 막대.
 * elapsedRatio: 이번 달이 지난 비율 (현재 달일 때만, 막대 위 '오늘' 눈금)
 * daysLeft: 오늘 포함 남은 일수 (현재 달일 때만)
 */
export function BudgetBar({ spent, elapsedRatio, daysLeft }: { spent: number; elapsedRatio?: number; daysLeft?: number }) {
  const budget = useStore((s) => s.settings.monthlyBudget)
  const [open, setOpen] = useState(false)

  if (budget == null) {
    return (
      <>
        <button className="text-xs text-neutral-500 underline-offset-2 hover:underline" onClick={() => setOpen(true)}>
          + 월 예산 설정
        </button>
        <BudgetSheet open={open} onClose={() => setOpen(false)} />
      </>
    )
  }

  const ratio = spent / budget
  const over = ratio > 1
  const remaining = budget - spent
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <button className="text-neutral-500 hover:underline" onClick={() => setOpen(true)}>
          예산 {formatWon(budget)}
        </button>
        <span className={over ? 'font-semibold text-[#d03b3b]' : 'text-neutral-600 dark:text-neutral-400'}>
          {over ? `⚠ 예산 초과 ${formatWon(-remaining)}` : `${Math.round(ratio * 100)}% 사용`}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          className={`h-full rounded-full ${over ? 'bg-[#d03b3b]' : 'bg-[#2a78d6] dark:bg-[#3987e5]'}`}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
        {elapsedRatio != null && (
          <div
            className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-neutral-900/60 dark:bg-white/60"
            style={{ left: `${elapsedRatio * 100}%` }}
            title="오늘까지 지난 날짜 비율"
          />
        )}
      </div>
      {!over && daysLeft != null && daysLeft > 0 && (
        <p className="mt-1.5 text-xs text-neutral-500">
          남은 예산 {formatWon(remaining)} · 하루 {formatWon(Math.floor(remaining / daysLeft))}씩 쓸 수 있어요
        </p>
      )}
      <BudgetSheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export function BudgetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="월 예산">
      {open && <BudgetForm onClose={onClose} />}
    </Sheet>
  )
}

function BudgetForm({ onClose }: { onClose: () => void }) {
  const budget = useStore((s) => s.settings.monthlyBudget)
  const updateSettings = useStore((s) => s.updateSettings)
  const [text, setText] = useState(budget ? formatNumber(budget) : '')
  const amount = parseAmount(text)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (amount) {
          updateSettings({ monthlyBudget: amount })
          onClose()
        }
      }}
      className="space-y-3"
    >
      <div>
        <label className={labelCls}>
          한 달 예산 {amount != null && <span className="text-neutral-400">· {formatWon(amount)}</span>}
        </label>
        <input
          className={inputCls}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예: 150만"
          inputMode="decimal"
          autoFocus
        />
      </div>
      <div className="flex gap-2">
        {budget != null && (
          <Button
            type="button"
            variant="ghost"
            className="text-red-600 dark:text-red-400"
            onClick={() => {
              updateSettings({ monthlyBudget: null })
              onClose()
            }}
          >
            예산 없애기
          </Button>
        )}
        <div className="flex-1" />
        <Button type="submit" variant="primary" disabled={!amount}>
          저장
        </Button>
      </div>
    </form>
  )
}
