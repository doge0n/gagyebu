import type { CSSProperties } from 'react'

/**
 * 카테고리 색 (dataviz 검증 팔레트). 순서가 색약 구분을 보장하므로 순서대로 배정.
 * 라이트/다크 각각 검증 통과: validate_palette.js (흰 배경 / #171717 배경)
 */
export const PALETTE = [
  { name: '파랑', light: '#2a78d6', dark: '#3987e5' },
  { name: '주황', light: '#eb6834', dark: '#d95926' },
  { name: '청록', light: '#1baf7a', dark: '#199e70' },
  { name: '노랑', light: '#eda100', dark: '#c98500' },
  { name: '분홍', light: '#e87ba4', dark: '#d55181' },
  { name: '초록', light: '#008300', dark: '#008300' },
  { name: '보라', light: '#6250d6', dark: '#9085e9' },
  { name: '빨강', light: '#e34948', dark: '#e66767' },
] as const

const DARK_OF = new Map<string, string>(PALETTE.map((p) => [p.light.toLowerCase(), p.dark]))

/** 카테고리 색을 CSS 변수로 넘김 → .cat-bg / .cat-text 클래스가 테마에 맞는 값 사용 */
export function catVars(color: string | undefined): CSSProperties {
  const c = color ?? '#898781'
  return { '--c': c, '--cd': DARK_OF.get(c.toLowerCase()) ?? c } as CSSProperties
}

/** 다음 카테고리에 쓸 색: 아직 안 쓴 팔레트 색 중 첫 번째 */
export function nextPaletteColor(used: string[]): string {
  const u = new Set(used.map((c) => c.toLowerCase()))
  return (PALETTE.find((p) => !u.has(p.light)) ?? PALETTE[used.length % PALETTE.length]).light
}
