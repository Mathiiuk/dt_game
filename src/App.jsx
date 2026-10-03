import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { initDB } from './api/db'
import AuthScreen from './features/auth/AuthScreen'
import CreateManagerWizard from './features/manager/CreateManagerWizard'
import CreateClubWizard from './features/club/CreateClubWizard'
import Dashboard from './features/dashboard/Dashboard'
import WelcomeScreen from './features/auth/WelcomeScreen'
import TacticsScreen from './features/tactics/TacticsScreen'
import MatchScreen from './features/match/MatchScreen'
import PostMatchScreen from './features/match/PostMatchScreen'
import StandingsScreen from './features/competition/StandingsScreen'
import MarketScreen from './features/market/MarketScreen'
import SquadScreen from './features/squad/SquadScreen'
import ClubScreen from './features/club/screens/ClubScreen'
import FinancesScreen from './features/finances/FinancesScreen'
import TrainingScreen from './features/training/TrainingScreen'
import ManagerCareerScreen from './features/manager/ManagerCareerScreen'
import NationalTeamScreen from './features/manager/NationalTeamScreen'
import InternationalCupScreen from './features/competition/InternationalCupScreen'
import HallOfFameScreen from './features/manager/HallOfFameScreen'
import ReloadPrompt from './components/ReloadPrompt'
import { GameProvider } from './context/GameContext'
import BottomNav from './components/BottomNav'

function App() {
  useEffect(() => {
    initDB()
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen text-zinc-100 bg-zinc-950 font-sans selection:bg-emerald-500/30">
        <GameProvider>
          <Routes>
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/create-manager" element={<CreateManagerWizard />} />
            <Route path="/create-club" element={<CreateClubWizard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tactics" element={<TacticsScreen />} />
            <Route path="/match" element={<MatchScreen />} />
            <Route path="/post-match" element={<PostMatchScreen />} />
            <Route path="/standings" element={<StandingsScreen />} />
            <Route path="/market" element={<MarketScreen />} />
            <Route path="/squad" element={<SquadScreen />} />
            <Route path="/club" element={<ClubScreen />} />
            <Route path="/finances" element={<FinancesScreen />} />
            <Route path="/training" element={<TrainingScreen />} />
            <Route path="/manager" element={<ManagerCareerScreen />} />
            <Route path="/national-team" element={<NationalTeamScreen />} />
            <Route path="/international-cup" element={<InternationalCupScreen />} />
            <Route path="/hall-of-fame" element={<HallOfFameScreen />} />
            <Route path="/game" element={<Navigate to="/welcome" replace />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
          <BottomNav />
          <Toaster theme="dark" position="top-center" />
          <ReloadPrompt />
        </GameProvider>
      </div>
    </BrowserRouter>
  )
}

export default App
