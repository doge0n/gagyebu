import { firebaseConfig } from './config'
import { useSync } from './syncState'

type Mod = typeof import('./firebaseSync')
let mod: Promise<Mod> | null = null

/** 앱 시작 시 호출. 설정이 있을 때만 Firebase를 불러온다 (없으면 번들도 안 받음) */
export function initSync() {
  if (!firebaseConfig || mod) return
  mod = import('./firebaseSync')
  mod.catch((e) => useSync.setState({ ready: true, status: 'error', error: String(e) }))
}

async function m(): Promise<Mod> {
  initSync()
  if (!mod) throw new Error('동기화가 설정되지 않았어요.')
  return mod
}

export async function login(email: string, password: string) {
  const x = await m()
  try {
    await x.login(email, password)
  } catch (e) {
    throw new Error(x.message(e))
  }
}
export async function signup(email: string, password: string) {
  const x = await m()
  try {
    await x.signup(email, password)
  } catch (e) {
    throw new Error(x.message(e))
  }
}
export async function logout() {
  await (await m()).logout()
}
export async function retrySync() {
  ;(await m()).retry()
}
