import { NavLink } from 'react-router'
import { Icon, type IconName } from './Icon'

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: '달력', icon: 'calendar' },
  { to: '/weekly', label: '주간 입력', icon: 'edit' },
  { to: '/trips', label: '여행', icon: 'trip' },
  { to: '/settings', label: '설정', icon: 'settings' },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
      <ul className="mx-auto flex max-w-3xl">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300'
                }`
              }
            >
              <Icon name={t.icon} className="size-6" />
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
