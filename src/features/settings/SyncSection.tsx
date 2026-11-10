import { useState } from 'react'
import { Button, Card } from '../../components/Page'
import { showToast } from '../../components/Toast'
import { login, logout, retrySync, signup } from '../../sync'
import { useSync, type SyncStatus } from '../../sync/syncState'

const STATUS: Record<SyncStatus, { label: string; dot: string }> = {
  off: { label: '꺼짐', dot: 'bg-neutral-400' },
  connecting: { label: '연결 중…', dot: 'bg-amber-500' },
  saving: { label: '저장 중…', dot: 'bg-amber-500' },
  synced: { label: '동기화됨', dot: 'bg-emerald-500' },
  offline: { label: '오프라인 · 연결되면 자동으로 올라가요', dot: 'bg-neutral-400' },
  error: { label: '오류', dot: 'bg-red-500' },
}

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base outline-none focus:border-neutral-400 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800'

export function SyncSection() {
  const { available, ready, email, status, lastSyncedAt, error } = useSync()
  const [form, setForm] = useState({ email: '', pw: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  if (!available) return null

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setErr(null)
    try {
      await fn()
      setForm({ email: '', pw: '' })
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  if (!ready) {
    return (
      <Card>
        <h2 className="text-sm font-semibold">자동 동기화</h2>
        <p className="mt-1 text-xs text-neutral-500">확인 중…</p>
      </Card>
    )
  }

  if (email) {
    const st = STATUS[status]
    return (
      <Card>
        <h2 className="text-sm font-semibold">자동 동기화</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm">
          <span className={`size-2 rounded-full ${st.dot}`} />
          {st.label}
        </p>
        {status === 'error' && error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        <p className="mt-1 text-xs text-neutral-500">
          {email}
          {lastSyncedAt && ` · 마지막 확인 ${new Date(lastSyncedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
        <p className="mt-1 text-xs text-neutral-500">같은 계정으로 로그인한 기기끼리 입력이 바로 반영돼요.</p>
        <div className="mt-3 flex gap-2">
          {status === 'error' && <Button onClick={() => void retrySync()}>다시 시도</Button>}
          <Button
            variant="ghost"
            onClick={() => {
              if (!confirm('로그아웃할까요?\n이 기기의 기록은 그대로 남지만, 다시 로그인할 때까지 다른 기기와 맞춰지지 않아요.')) return
              void logout().then(() => showToast('로그아웃했어요'))
            }}
          >
            로그아웃
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold">자동 동기화</h2>
      <p className="mt-0.5 mb-3 text-xs text-neutral-500">
        로그인하면 휴대폰과 PC에서 같은 기록을 볼 수 있어요. 기기마다 한 번만 로그인하면 돼요.
      </p>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
          void run(() => login(form.email, form.pw))
        }}
      >
        <input
          className={inputCls}
          type="email"
          autoComplete="email"
          placeholder="이메일"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className={inputCls}
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호 (6자 이상)"
          value={form.pw}
          onChange={(e) => setForm({ ...form, pw: e.target.value })}
        />
        {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={busy || !form.email || !form.pw}>
            로그인
          </Button>
          <Button
            type="button"
            disabled={busy || !form.email || !form.pw}
            onClick={() => void run(() => signup(form.email, form.pw))}
          >
            처음이면 가입
          </Button>
        </div>
      </form>
    </Card>
  )
}
