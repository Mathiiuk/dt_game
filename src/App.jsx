import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { initDB } from './api/db'
import AuthScreen from './features/auth/AuthScreen'
import CreateManagerWizard from './features/manager/CreateManagerWizard'
import CreateClubWizard from './features/club/CreateClubWizard'
import Dashboard from './features/dashboard/Dashboard'
import WelcomeScreen from './features/auth/WelcomeScreen'
import CalendarScreen from './features/calendar/CalendarScreen'
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
import AchievementsScreen from './features/career/AchievementsScreen'
import EndgameScreen from './features/career/EndgameScreen'
import ReloadPrompt from './components/ReloadPrompt'
import { GameProvider } from './context/GameContext'
import BottomNav from './components/BottomNav'
import RequireCareer from './components/RequireCareer'

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
            <Route path="/dashboard" element={<RequireCareer><Dashboard /></RequireCareer>} />
            <Route path="/calendar" element={<RequireCareer><CalendarScreen /></RequireCareer>} />
            <Route path="/tactics" element={<RequireCareer><TacticsScreen /></RequireCareer>} />
            <Route path="/match" element={<RequireCareer><MatchScreen /></RequireCareer>} />
            <Route path="/post-match" element={<RequireCareer><PostMatchScreen /></RequireCareer>} />
            <Route path="/standings" element={<RequireCareer><StandingsScreen /></RequireCareer>} />
            <Route path="/market" element={<RequireCareer><MarketScreen /></RequireCareer>} />
            <Route path="/squad" element={<RequireCareer><SquadScreen /></RequireCareer>} />
            <Route path="/club" element={<RequireCareer><ClubScreen /></RequireCareer>} />
            <Route path="/finances" element={<RequireCareer><FinancesScreen /></RequireCareer>} />
            <Route path="/training" element={<RequireCareer><TrainingScreen /></RequireCareer>} />
            <Route path="/manager" element={<RequireCareer><ManagerCareerScreen /></RequireCareer>} />
            <Route path="/national-team" element={<RequireCareer><NationalTeamScreen /></RequireCareer>} />
            <Route path="/international-cup" element={<RequireCareer><InternationalCupScreen /></RequireCareer>} />
            <Route path="/hall-of-fame" element={<HallOfFameScreen />} />
            <Route path="/achievements" element={<RequireCareer><AchievementsScreen /></RequireCareer>} />
            <Route path="/endgame" element={<EndgameScreen />} />
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
