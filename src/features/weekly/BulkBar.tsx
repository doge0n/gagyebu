import { Button } from '../../components/Page'
import { formatWon } from '../../lib/money'

export function BulkBar({
  count,
  total,
  onTrip,
  onUntag,
  onDelete,
  onClear,
}: {
  count: number
  total: number
  onTrip: () => void
  onUntag: () => void
  onDelete: () => void
  onClear: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-3">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-2 pl-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <span className="text-sm font-medium">
          {count}건 <span className="text-neutral-500">· {formatWon(total)}</span>
        </span>
        <div className="ml-auto flex gap-1.5">
          <Button variant="primary" onClick={onTrip}>
            ✈ 여행 태그
          </Button>
          <Button onClick={onUntag}>태그 해제</Button>
          <Button variant="ghost" className="text-red-600 dark:text-red-400" onClick={onDelete}>
            삭제
          </Button>
          <Button variant="ghost" onClick={onClear} aria-label="선택 해제">
            ✕
          </Button>
        </div>
      </div>
    </div>
  )
}
