import { useEffect } from 'react'
import { create } from 'zustand'

interface Toast {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
}

const useToastStore = create<{ toast: Toast | null; set: (t: Toast | null) => void }>((set) => ({
  toast: null,
  set: (toast) => set({ toast }),
}))

export function showToast(message: string, action?: { label: string; onClick: () => void }) {
  useToastStore.getState().set({ id: Date.now(), message, actionLabel: action?.label, onAction: action?.onClick })
}

export function Toaster() {
  const toast = useToastStore((s) => s.toast)
  const set = useToastStore((s) => s.set)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => set(null), 5000)
    return () => clearTimeout(t)
  }, [toast, set])
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900">
        <span>{toast.message}</span>
        {toast.onAction && (
          <button
            className="font-semibold text-sky-300 dark:text-sky-700"
            onClick={() => {
              toast.onAction?.()
              set(null)
            }}
          >
            {toast.actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
