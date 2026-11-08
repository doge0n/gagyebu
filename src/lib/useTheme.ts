import { useEffect } from 'react'
import { useStore } from '../store/useStore'

/** 설정의 테마(시스템/라이트/다크)를 html.dark 클래스에 반영 */
export function useApplyTheme() {
  const theme = useStore((s) => s.settings.theme)
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}
