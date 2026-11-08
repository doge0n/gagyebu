import type { Category } from '../types'
import { catVars } from '../lib/palette'

export function CategoryDot({ color, className = "size-2" }: { color?: string; className?: string }) {
  return <span className={`cat-bg inline-block shrink-0 rounded-full ${className}`} style={catVars(color)} />
}

export function CategoryLabel({ category }: { category?: Category }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <CategoryDot color={category?.color ?? '#898781'} />
      {category?.name ?? '?'}
    </span>
  )
}
