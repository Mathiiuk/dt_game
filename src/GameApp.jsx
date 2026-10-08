import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
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
import LogbookScreen from './features/dashboard/LogbookScreen'
import ReloadPrompt from './components/ReloadPrompt'
import { GameProvider } from './context/GameContext'
import AppShell from './components/layout/AppShell'
import MoreScreen from './features/more/MoreScreen'
import RequireCareer from './components/RequireCareer'
import DesignSystemScreen from './features/design/DesignSystemScreen'
import { useSeo } from './seo/useSeo'
import { PRIVATE_SEO } from './seo/homeSeo'

/**
 * El juego (área privada): acceso, asistentes de creación y pantallas de la carrera.
 * Se carga aparte de la portada pública (ver App.jsx) y nunca se indexa en buscadores.
 */
function GameApp() {
  useSeo(PRIVATE_SEO)
  useEffect(() => {
    initDB()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-dvh bg-bg font-sans text-fg">
        <GameProvider>
          <Routes>
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/login" element={<AuthScreen key="login" initialMode="login" />} />
            <Route path="/registro" element={<AuthScreen key="registro" initialMode="register" />} />
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/create-manager" element={<CreateManagerWizard />} />
            <Route path="/create-club" element={<CreateClubWizard />} />
            <Route path="/design" element={<DesignSystemScreen />} />

            {/* Partido en vivo: pantalla inmersiva, sin menú (el resumen sí lleva menú para poder ir a otras secciones) */}
            <Route path="/match" element={<RequireCareer><MatchScreen /></RequireCareer>} />

            {/* Epílogo del DT retirado: sin menú (no hay a dónde volver) */}
            <Route path="/endgame" element={<EndgameScreen />} />

            {/* Pantallas de juego dentro del AppShell (menú lateral en escritorio, barra inferior en móvil) */}
            <Route element={<RequireCareer><AppShell /></RequireCareer>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/post-match" element={<PostMatchScreen />} />
              {/* Las decisiones viven en el inicio (tarjetas y pantalla completa de historias); la ruta vieja redirige */}
              <Route path="/events" element={<Navigate to="/dashboard" replace />} />
              <Route path="/calendar" element={<CalendarScreen />} />
              <Route path="/tactics" element={<TacticsScreen />} />
              <Route path="/standings" element={<StandingsScreen />} />
              <Route path="/market" element={<MarketScreen />} />
              <Route path="/squad" element={<SquadScreen />} />
              <Route path="/club" element={<ClubScreen />} />
              <Route path="/finances" element={<FinancesScreen />} />
              <Route path="/training" element={<TrainingScreen />} />
              <Route path="/manager" element={<ManagerCareerScreen />} />
              <Route path="/national-team" element={<NationalTeamScreen />} />
              <Route path="/international-cup" element={<InternationalCupScreen />} />
              <Route path="/achievements" element={<AchievementsScreen />} />
              <Route path="/more" element={<MoreScreen />} />
            </Route>

            {/* El Salón de la Fama es accesible incluso con el DT retirado */}
            <Route element={<AppShell />}>
              <Route path="/hall-of-fame" element={<HallOfFameScreen />} />
              <Route path="/logbook" element={<RequireCareer><LogbookScreen /></RequireCareer>} />
            </Route>

            <Route path="/game" element={<Navigate to="/welcome" replace />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
          <Toaster theme="dark" position="top-center" />
          <ReloadPrompt />
        </GameProvider>
      </div>
    </QueryClientProvider>
  )
}

export default GameApp
