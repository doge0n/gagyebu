export function TripBadge({ name, onClick }: { name: string; onClick?: () => void }) {
  const cls =
    'inline-flex max-w-[9rem] items-center gap-1 truncate rounded-md bg-neutral-900 px-1.5 py-0.5 text-[11px] font-medium text-white dark:bg-neutral-600 dark:text-white'
  return onClick ? (
    <button className={cls} onClick={onClick}>
      ✈ {name}
    </button>
  ) : (
    <span className={cls}>✈ {name}</span>
  )
}
