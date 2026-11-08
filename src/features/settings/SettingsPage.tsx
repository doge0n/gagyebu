import { useState } from 'react'
import type { ThemeMode } from '../../types'
import { Button, Card, Page } from '../../components/Page'
import { Toggle } from '../../components/Toggle'
import { formatWon } from '../../lib/money'
import { useStore } from '../../store/useStore'
import { BudgetSheet } from '../calendar/BudgetBar'
import { BackupSection } from './BackupSection'
import { CategoryManager } from './CategoryManager'
import { QuickItemManager } from './QuickItemManager'

export function SettingsPage() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const loadSample = useStore((s) => s.loadSample)
  const resetAll = useStore((s) => s.resetAll)
  const counts = { e: useStore((s) => s.expenses.length), t: useStore((s) => s.trips.length) }
  const [budgetOpen, setBudgetOpen] = useState(false)

  const themes: { v: ThemeMode; label: string }[] = [
    { v: 'system', label: '시스템' },
    { v: 'light', label: '라이트' },
    { v: 'dark', label: '다크' },
  ]

  return (
    <Page title="설정">
      <div className="space-y-3">
        <Card className="py-2">
          <h2 className="pt-2 text-sm font-semibold">입력</h2>
          <Toggle
            checked={settings.smallNumberAsMan}
            onChange={(v) => updateSettings({ smallNumberAsMan: v })}
            label="단위 없는 작은 숫자는 '만 원'으로"
            description={'"2" → 20,000원, "3.5" → 35,000원 (1000 미만일 때만)'}
          />
          <Toggle
            checked={settings.autoTagTrips}
            onChange={(v) => updateSettings({ autoTagTrips: v })}
            label="여행 기간 지출에 여행 태그 자동으로"
            description="여행 날짜에 입력하면 그 여행에 바로 묶어요"
          />
          <div className="flex items-center justify-between gap-4 py-2">
            <span>
              <span className="block text-sm">월 예산</span>
              <span className="mt-0.5 block text-xs text-neutral-500">
                {settings.monthlyBudget ? formatWon(settings.monthlyBudget) : '설정 안 함'}
              </span>
            </span>
            <Button onClick={() => setBudgetOpen(true)}>{settings.monthlyBudget ? '변경' : '설정'}</Button>
          </div>
        </Card>

        <CategoryManager />
        <QuickItemManager />

        <Card>
          <h2 className="mb-3 text-sm font-semibold">화면 모드</h2>
          <div className="inline-flex rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
            {themes.map((o) => (
              <button
                key={o.v}
                onClick={() => updateSettings({ theme: o.v })}
                className={`rounded-lg px-4 py-1.5 text-sm ${
                  settings.theme === o.v ? 'bg-white font-semibold shadow-sm dark:bg-neutral-600' : 'text-neutral-500'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Card>

        <BackupSection />

        <Card>
          <h2 className="text-sm font-semibold">데이터</h2>
          <p className="mt-0.5 mb-3 text-xs text-neutral-500">
            지금 저장된 기록: 지출 {counts.e}건 · 여행 {counts.t}개
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (confirm('지금 데이터를 지우고 샘플 데이터로 바꿀까요?\n(필요하면 먼저 내보내기로 백업하세요)')) loadSample()
              }}
            >
              샘플 데이터 넣기
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (
                  confirm(
                    `지출 ${counts.e}건 · 여행 ${counts.t}개와 카테고리 설정을 모두 지웁니다.\n되돌릴 수 없어요. 먼저 내보내기로 백업했나요?\n\n계속할까요?`,
                  )
                )
                  resetAll()
              }}
            >
              전체 초기화
            </Button>
          </div>
        </Card>
      </div>
      <BudgetSheet open={budgetOpen} onClose={() => setBudgetOpen(false)} />
    </Page>
  )
}
