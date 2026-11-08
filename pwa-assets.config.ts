import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // 마스커블/애플 아이콘 배경은 아이콘과 같은 색
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#171717' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#171717' } },
  },
  images: ['public/icon.svg'],
})
