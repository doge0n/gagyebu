import { create } from 'zustand'
import { firebaseConfig } from './config'

export type SyncStatus = 'off' | 'connecting' | 'saving' | 'synced' | 'offline' | 'error'

interface SyncState {
  /** Firebase 설정이 들어 있어 동기화를 쓸 수 있는지 */
  available: boolean
  /** 로그인 확인 전(앱 켜질 때)인지 */
  ready: boolean
  email: string | null
  status: SyncStatus
  lastSyncedAt: number | null
  error: string | null
}

export const useSync = create<SyncState>()(() => ({
  available: !!firebaseConfig,
  ready: !firebaseConfig,
  email: null,
  status: 'off',
  lastSyncedAt: null,
  error: null,
}))
