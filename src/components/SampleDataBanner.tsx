import { useStore } from '../store/useStore'
import { Button, Card } from './Page'

/** 데이터가 비어 있을 때 보여주는 안내 + 샘플 데이터 넣기 */
export function SampleDataBanner() {
  const empty = useStore((s) => s.expenses.length === 0 && s.trips.length === 0)
  const loadSample = useStore((s) => s.loadSample)
  if (!empty) return null
  return (
    <Card className="mb-4 border-dashed text-center">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">아직 기록이 없어요.</p>
      <p className="mt-1 text-xs text-neutral-500">
        화면을 먼저 둘러보려면 샘플 데이터(최근 10주 + 부산 여행 2회)를 넣어보세요. 설정에서 언제든 초기화할 수 있어요.
      </p>
      <Button variant="primary" className="mt-3" onClick={loadSample}>
        샘플 데이터 넣기
      </Button>
    </Card>
  )
}
