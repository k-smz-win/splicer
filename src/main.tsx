import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'      // i18n初期化（副作用import）
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
