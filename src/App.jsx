import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { initDB } from './api/db'
import AuthScreen from './features/auth/AuthScreen'
import CreateManagerWizard from './features/manager/CreateManagerWizard'
import CreateClubWizard from './features/club/CreateClubWizard'
import Dashboard from './features/dashboard/Dashboard'
import TacticsScreen from './features/tactics/TacticsScreen'
import MatchScreen from './features/match/MatchScreen'
import PostMatchScreen from './features/match/PostMatchScreen'
import StandingsScreen from './features/competition/StandingsScreen'
import MarketScreen from './features/market/MarketScreen'

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
          <Route path="/create-club" element={<CreateClubWizard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tactics" element={<TacticsScreen />} />
          <Route path="/match" element={<MatchScreen />} />
          <Route path="/post-match" element={<PostMatchScreen />} />
          <Route path="/standings" element={<StandingsScreen />} />
          <Route path="/market" element={<MarketScreen />} />
          <Route path="/game" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
        <Toaster theme="dark" position="top-center" />
      </div>
    </BrowserRouter>
  )
}

export default App
