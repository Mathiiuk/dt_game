import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { initDB } from './api/db'
import AuthScreen from './features/auth/AuthScreen'
import PlayScreen from './components/PlayScreen'
import CreateManagerWizard from './features/manager/CreateManagerWizard'

function App() {
  useEffect(() => {
    initDB()
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen text-zinc-100 bg-zinc-950 font-sans selection:bg-emerald-500/30">
        <Routes>
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/create-manager" element={<CreateManagerWizard />} />
          <Route path="/game" element={<PlayScreen />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
        <Toaster theme="dark" position="top-center" />
      </div>
    </BrowserRouter>
  )
}

export default App
