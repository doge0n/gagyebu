import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import {
  Timestamp,
  collection,
  connectFirestoreEmulator,
  doc,
  getDocsFromServer,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { useStore } from '../store/useStore'
import { firebaseConfig } from './config'
import { SETTINGS_KEY, allDocs, applyRemote, diffData, type RemoteDoc } from './diff'
import { useSync } from './syncState'

/*
 * 저장 구조: users/{uid}/items/{종류_id} = { data, del, at }
 * - 이 기기의 변경은 바로 클라우드에 쓴다 (오프라인이면 Firestore가 IndexedDB에 보관했다가 나중에 보냄)
 * - 다른 기기의 변경은 at(서버 시각)이 마지막으로 본 시각보다 나중인 문서만 실시간으로 받는다
 * - 삭제는 문서를 지우지 않고 del: true로 남겨 다른 기기에도 전달되게 한다
 */

const app = initializeApp(firebaseConfig!)
const auth = getAuth(app)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
})
// 개발용: VITE_FIREBASE_EMULATOR=1 npm run dev 로 로컬 에뮬레이터에 연결
if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

let uid: string | null = null
let unsubSnap: Unsubscribe | null = null
let unsubStore: (() => void) | null = null
let subscribedAt = 0
let applying = false
let inflight = 0
let fromCache = true

const sinceKey = (u: string) => `gagyebu:sync:${u}:since`
function getSince(u: string): number | null {
  try {
    const v = localStorage.getItem(sinceKey(u))
    return v == null ? null : Number(v)
  } catch {
    return null
  }
}
function setSince(u: string, ms: number) {
  try {
    localStorage.setItem(sinceKey(u), String(ms))
  } catch {
    /* 저장 실패해도 다음에 조금 더 받을 뿐 */
  }
}

const items = (u: string) => collection(db, 'users', u, 'items')

function toRemote(d: DocumentSnapshot): RemoteDoc {
  return { key: d.id, data: d.get('data') as object | undefined, del: d.get('del') === true }
}
function atOf(d: DocumentSnapshot): number {
  const at = d.get('at') as Timestamp | null | undefined
  return at ? at.toMillis() : 0
}

function apply(docs: RemoteDoc[], replace = false) {
  const patch = applyRemote(useStore.getState(), docs, replace)
  if (!patch) return
  applying = true
  try {
    useStore.setState(patch)
  } finally {
    applying = false
  }
}

function refreshStatus() {
  if (!uid) return
  const s = useSync.getState()
  if (s.status === 'error' || s.status === 'connecting') return
  useSync.setState({ status: !navigator.onLine ? 'offline' : inflight > 0 ? 'saving' : fromCache ? 'offline' : 'synced' })
}

async function push(changes: Map<string, object | null>) {
  const u = uid
  if (!u || !changes.size) return
  const entries = [...changes]
  inflight++
  refreshStatus()
  try {
    for (let i = 0; i < entries.length; i += 400) {
      const b = writeBatch(db)
      for (const [key, data] of entries.slice(i, i + 400)) {
        b.set(doc(items(u), key), data ? { data, del: false, at: serverTimestamp() } : { del: true, at: serverTimestamp() })
      }
      await b.commit()
    }
    useSync.setState({ lastSyncedAt: Date.now() })
  } catch (e) {
    useSync.setState({ status: 'error', error: message(e) })
  } finally {
    inflight--
    refreshStatus()
  }
}

function listen(u: string) {
  unsubSnap?.()
  const since = Math.max(0, (getSince(u) ?? 0) - 5000) // 경계 겹침 여유 (다시 받아도 결과는 같음)
  const q = query(items(u), where('at', '>', Timestamp.fromMillis(since)))
  subscribedAt = Date.now()
  unsubSnap = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      const docs: RemoteDoc[] = []
      let max = getSince(u) ?? 0
      for (const ch of snap.docChanges()) {
        // 내가 쓰는 중인 문서는 건너뜀 (서버 확인 후 다시 들어옴)
        if (ch.type === 'removed' || ch.doc.metadata.hasPendingWrites) continue
        docs.push(toRemote(ch.doc))
        max = Math.max(max, atOf(ch.doc))
      }
      if (docs.length) apply(docs)
      setSince(u, max)
      fromCache = snap.metadata.fromCache
      if (!fromCache) useSync.setState({ lastSyncedAt: Date.now() })
      if (useSync.getState().status === 'connecting') useSync.setState({ status: 'synced' })
      refreshStatus()
    },
    (e) => useSync.setState({ status: 'error', error: message(e) }),
  )
}

function watchStore() {
  unsubStore?.()
  unsubStore = useStore.subscribe((s, prev) => {
    if (applying || !uid) return
    void push(diffData(prev, s))
  })
}

/** 이 기기에서 처음 연결할 때: 클라우드와 이 기기 기록을 맞춘다 */
async function firstSync(u: string) {
  const snap = await getDocsFromServer(items(u))
  const docs = snap.docs.map(toRemote)
  const max = Math.max(0, ...snap.docs.map(atOf))
  const live = docs.filter((d) => !d.del)
  const s = useStore.getState()
  const localCount = s.expenses.length + s.trips.length

  let upload: Map<string, object> | null = null
  if (live.length === 0) {
    upload = allDocs(s)
  } else if (localCount === 0) {
    apply(docs, true)
  } else {
    const merge = confirm(
      `클라우드에 이미 기록이 있어요.\n\n이 기기에 있던 지출 ${s.expenses.length}건 · 여행 ${s.trips.length}개도 클라우드에 합칠까요?\n\n[확인] 합치기\n[취소] 이 기기 기록은 버리고 클라우드 기록만 쓰기`,
    )
    if (merge) {
      apply(docs)
      const remoteKeys = new Set(docs.map((d) => d.key))
      upload = new Map([...allDocs(useStore.getState())].filter(([k]) => !remoteKeys.has(k) && k !== SETTINGS_KEY))
    } else {
      apply(docs, true)
    }
  }
  setSince(u, max)
  return upload
}

async function start(user: User) {
  uid = user.uid
  inflight = 0
  fromCache = true
  useSync.setState({ ready: true, email: user.email, status: 'connecting', error: null })
  try {
    const upload = getSince(user.uid) == null ? await firstSync(user.uid) : null
    if (uid !== user.uid) return
    watchStore()
    listen(user.uid)
    if (upload?.size) await push(upload)
  } catch (e) {
    useSync.setState({ status: 'error', error: message(e) })
  }
}

function stop() {
  unsubSnap?.()
  unsubStore?.()
  unsubSnap = unsubStore = null
  uid = null
}

onAuthStateChanged(auth, (user) => {
  stop()
  if (user) void start(user)
  else useSync.setState({ ready: true, email: null, status: 'off', error: null })
})

// 오래 백그라운드에 있다가 돌아오면 다시 연결 (휴대폰에서 앱을 다시 열 때)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && uid && Date.now() - subscribedAt > 10 * 60 * 1000) listen(uid)
})
addEventListener('online', refreshStatus)
addEventListener('offline', refreshStatus)

export async function login(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email.trim(), password)
}
export async function signup(email: string, password: string) {
  await createUserWithEmailAndPassword(auth, email.trim(), password)
}
export async function logout() {
  const u = uid
  await signOut(auth)
  // 다음에 로그인하면 처음 연결처럼 다시 맞춘다 (로그아웃 중 바꾼 것도 올라가게)
  if (u) localStorage.removeItem(sinceKey(u))
}
/** 동기화 다시 시도 (오류 후) */
export function retry() {
  const user = auth.currentUser
  if (!user) return
  stop()
  void start(user)
}

export function message(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  const map: Record<string, string> = {
    'auth/invalid-credential': '이메일 또는 비밀번호가 틀렸어요.',
    'auth/invalid-email': '이메일 형식이 아니에요.',
    'auth/user-not-found': '가입된 이메일이 아니에요.',
    'auth/wrong-password': '비밀번호가 틀렸어요.',
    'auth/email-already-in-use': '이미 가입된 이메일이에요. 로그인을 눌러주세요.',
    'auth/weak-password': '비밀번호는 6자 이상이어야 해요.',
    'auth/missing-password': '비밀번호를 입력하세요.',
    'auth/too-many-requests': '시도가 너무 많아요. 잠시 후 다시 해주세요.',
    'auth/network-request-failed': '인터넷 연결을 확인하세요.',
    'auth/operation-not-allowed': 'Firebase에서 이메일/비밀번호 로그인이 꺼져 있어요.',
    'auth/admin-restricted-operation': '새 가입이 막혀 있어요.',
    'permission-denied': '클라우드 접근 권한이 없어요. Firestore 보안 규칙을 확인하세요.',
    unavailable: '클라우드에 연결할 수 없어요. 인터넷 연결을 확인하세요.',
  }
  return map[code] ?? (e instanceof Error ? e.message : String(e))
}
