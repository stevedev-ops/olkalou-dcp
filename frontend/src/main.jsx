import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { LanguageProvider } from './contexts/LanguageContext'
import { LocationProvider } from './contexts/LocationContext'
import { SyncProvider } from './contexts/SyncContext'

const updateSW = registerSW({
  onNeedRefresh() {
    // Optionally prompt user to refresh
  },
  onOfflineReady() {
    // Ready for offline
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <LocationProvider>
          <SyncProvider>
            <App />
          </SyncProvider>
        </LocationProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
