import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// 브라우저가 저장 공간이 부족할 때 이 앱 데이터를 지우지 않도록 요청 (지원하는 브라우저만)
navigator.storage?.persist?.().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
