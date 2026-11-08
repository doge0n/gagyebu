import { useState } from 'react'
import type { Category } from '../../types'
import { CategoryDot } from '../../components/CategoryDot'
import { Icon } from '../../components/Icon'
import { Button, Card } from '../../components/Page'
import { showToast } from '../../components/Toast'
import { inputCls } from '../../components/ui'
import { catVars, nextPaletteColor, PALETTE } from '../../lib/palette'
import { FALLBACK_CATEGORY_ID } from '../../store/defaults'
import { sortedCategories, useStore } from '../../store/useStore'

export function CategoryManager() {
  const categories = useStore((s) => s.categories)
  const expenses = useStore((s) => s.expenses)
  const addCategory = useStore((s) => s.addCategory)
  const updateCategory = useStore((s) => s.updateCategory)
  const deleteCategory = useStore((s) => s.deleteCategory)
  const reorderCategories = useStore((s) => s.reorderCategories)
  const [newName, setNewName] = useState('')
  const [colorFor, setColorFor] = useState<string | null>(null)

  const sorted = sortedCategories(categories)
  const nameTaken = (name: string, exceptId?: string) =>
    categories.some((c) => c.id !== exceptId && c.name.trim() === name.trim())

  const move = (i: number, dir: -1 | 1) => {
    const ids = sorted.map((c) => c.id)
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    reorderCategories(ids)
  }

  const add = () => {
    const name = newName.trim()
    if (!name) return
    if (nameTaken(name)) return showToast(`'${name}' 카테고리가 이미 있어요`)
    addCategory(name, nextPaletteColor(categories.map((c) => c.color)))
    setNewName('')
  }

  const remove = (c: Category) => {
    const n = expenses.filter((e) => e.categoryId === c.id).length
    const msg = n
      ? `'${c.name}' 카테고리를 삭제할까요?\n이 카테고리의 지출 ${n}건은 '기타'로 옮겨집니다.`
      : `'${c.name}' 카테고리를 삭제할까요?`
    if (confirm(msg)) deleteCategory(c.id)
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold">카테고리</h2>
      <p className="mt-0.5 mb-3 text-xs text-neutral-500">
        이름을 눌러 바꾸고, 점을 눌러 색을 고르세요. 한 줄 입력("교통 2")은 이 이름으로 인식해요.
      </p>
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {sorted.map((c, i) => {
          const count = expenses.filter((e) => e.categoryId === c.id).length
          return (
            <li key={c.id} className="py-1.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setColorFor(colorFor === c.id ? null : c.id)}
                  className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  aria-label={`${c.name} 색 바꾸기`}
                >
                  <CategoryDot color={c.color} className="size-3.5" />
                </button>
                <CategoryNameInput
                  key={c.id + c.name}
                  category={c}
                  onCommit={(name) => {
                    if (nameTaken(name, c.id)) {
                      showToast(`'${name}' 카테고리가 이미 있어요`)
                      return false
                    }
                    updateCategory(c.id, { name })
                    return true
                  }}
                />
                <span className="shrink-0 text-xs text-neutral-400">{count}건</span>
                <div className="flex shrink-0">
                  <button
                    className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-20 dark:hover:bg-neutral-800"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="위로"
                  >
                    <Icon name="chevronLeft" className="size-4 rotate-90" />
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-20 dark:hover:bg-neutral-800"
                    onClick={() => move(i, 1)}
                    disabled={i === sorted.length - 1}
                    aria-label="아래로"
                  >
                    <Icon name="chevronRight" className="size-4 rotate-90" />
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-red-600 disabled:invisible dark:hover:bg-neutral-800"
                    onClick={() => remove(c)}
                    disabled={c.id === FALLBACK_CATEGORY_ID}
                    aria-label={`${c.name} 삭제`}
                    title={c.id === FALLBACK_CATEGORY_ID ? '기타는 삭제할 수 없어요' : undefined}
                  >
                    <Icon name="close" className="size-4" />
                  </button>
                </div>
              </div>
              {colorFor === c.id && (
                <div className="mt-1.5 mb-1 ml-9 flex flex-wrap gap-1.5">
                  {PALETTE.map((p) => (
                    <button
                      key={p.light}
                      onClick={() => {
                        updateCategory(c.id, { color: p.light })
                        setColorFor(null)
                      }}
                      className={`cat-bg size-7 rounded-full ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 ${
                        c.color.toLowerCase() === p.light ? 'ring-2 ring-neutral-900 dark:ring-white' : ''
                      }`}
                      style={catVars(p.light)}
                      aria-label={p.name}
                      title={p.name}
                    />
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <input className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="새 카테고리 (예: 문화)" />
        <Button type="submit" disabled={!newName.trim()} className="shrink-0">
          추가
        </Button>
      </form>
    </Card>
  )
}

/** 포커스를 잃거나 Enter면 저장, Esc면 원래대로 */
function CategoryNameInput({ category, onCommit }: { category: Category; onCommit: (name: string) => boolean }) {
  const [value, setValue] = useState(category.name)
  const commit = () => {
    const v = value.trim()
    if (!v || v === category.name) return setValue(category.name)
    if (!onCommit(v)) setValue(category.name)
  }
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') {
          setValue(category.name)
          ;(e.target as HTMLInputElement).blur()
        }
      }}
      className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-base outline-none hover:border-neutral-200 focus:border-neutral-400 dark:hover:border-neutral-700"
      aria-label="카테고리 이름"
    />
  )
}
