// 1. Встроенные/библиотечные модули
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 2. Алиасы / внутренние модули
import App from './App'

// 3. Стили / относительные
import './assets/main.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
