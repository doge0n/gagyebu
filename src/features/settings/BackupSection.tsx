import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useRef, useState } from 'react'
import { Button, Card } from '../../components/Page'
import { showToast } from '../../components/Toast'
import { downloadJson, ImportError, parseImport } from '../../store/storage'
import { pickData, useStore } from '../../store/useStore'

const LAST_EXPORT_KEY = 'gagyebu:lastExport'

function readLastExport(): number | null {
  try {
    const v = Number(localStorage.getItem(LAST_EXPORT_KEY))
    return v > 0 ? v : null
  } catch {
    return null
  }
}

export function BackupSection() {
  const fileRef = useRef<HTMLInputElement>(null)
  const replaceAll = useStore((s) => s.replaceAll)
  const counts = { e: useStore((s) => s.expenses.length), t: useStore((s) => s.trips.length) }
  const [lastExport, setLastExport] = useState(readLastExport)

  const exportNow = () => {
    downloadJson(pickData(useStore.getState()))
    const now = Date.now()
    try {
      localStorage.setItem(LAST_EXPORT_KEY, String(now))
    } catch {
      /* 기록 못 해도 내보내기는 됨 */
    }
    setLastExport(now)
  }

  const importFile = async (file: File) => {
    try {
      const { data, skipped } = parseImport(await file.text())
      const dates = data.expenses.map((e) => e.date).sort()
      const range = dates.length ? `${dates[0]} ~ ${dates[dates.length - 1]}` : '기록 없음'
      const ok = confirm(
        `백업 파일: 지출 ${data.expenses.length}건 · 여행 ${data.trips.length}개 (${range})` +
          (skipped ? `\n읽을 수 없는 항목 ${skipped}개는 건너뜁니다.` : '') +
          `\n\n지금 이 기기의 데이터(지출 ${counts.e}건 · 여행 ${counts.t}개)를 이 내용으로 바꿀까요?`,
      )
      if (!ok) return
      // 화면 모드는 기기마다 다를 수 있으니 지금 기기 설정 유지
      replaceAll({ ...data, settings: { ...data.settings, theme: useStore.getState().settings.theme } })
      showToast(`가져왔어요: 지출 ${data.expenses.length}건`)
    } catch (err) {
      showToast(err instanceof ImportError ? err.message : '파일을 읽지 못했어요')
    }
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold">백업 · 기기 간 옮기기</h2>
      <p className="mt-0.5 mb-3 text-xs leading-relaxed text-neutral-500">
        데이터는 이 기기의 브라우저에만 저장돼요. PC에서 <b>내보내기</b> → 파일을 iCloud Drive나 구글 드라이브에 저장 →
        휴대폰에서 <b>가져오기</b>로 같은 내용을 볼 수 있어요.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={exportNow}>
          내보내기 (JSON)
        </Button>
        <Button onClick={() => fileRef.current?.click()}>가져오기</Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importFile(f)
            e.target.value = '' // 같은 파일 다시 고를 수 있게
          }}
        />
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        {lastExport
          ? `이 기기에서 마지막 내보내기: ${formatDistanceToNow(lastExport, { addSuffix: true, locale: ko })}`
          : '이 기기에서 아직 내보낸 적이 없어요.'}{' '}
        가져오기는 지금 데이터를 <b>통째로 바꿔요</b>.
      </p>
    </Card>
  )
}
