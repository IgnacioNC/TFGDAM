import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initApiBaseUrl } from './lib/api.js'

// Inicializa la URL del backend antes de renderizar la app.
// En Electron la obtiene del proceso principal vía IPC.
// En web usa la variable de entorno o el proxy de Vite.
initApiBaseUrl().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
