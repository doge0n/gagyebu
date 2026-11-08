import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Page({ title, right, children }: { title: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-28">
      <header className="mb-4 flex min-h-10 items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {right}
      </header>
      {children}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      {children}
    </section>
  )
}

export function Button({
  children,
  variant = 'default',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'danger' | 'ghost' }) {
  const styles = {
    default:
      'border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700',
    primary: 'bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    ghost: 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
  }[variant]
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${styles} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
