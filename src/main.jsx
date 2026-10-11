import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './features/errors/ErrorBoundary'
import { runStorageMigrations } from './lib/storageMigrations'
import { installStaleListener } from './lib/staleVersion'

// Antes de dibujar nada: los datos guardados en este navegador se ponen al día y se vigilan las pestañas con código viejo
runStorageMigrations()
installStaleListener()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </React.StrictMode>,
)
