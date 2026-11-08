import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // 홈 화면에 설치 + 오프라인 동작. 새 버전은 다음에 열 때 자동 적용
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: '가계부',
        short_name: '가계부',
        description: '매주 기록하는 개인 가계부 — 월간 달력과 여행별 지출',
        lang: 'ko',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#171717',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  // 정적 호스팅(GitHub Pages 등) 어디에 올려도 동작하도록 상대 경로 사용
  base: './',
  server: { host: true },
})
