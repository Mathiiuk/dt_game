import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Loader2 } from 'lucide-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { initDB } from './api/db'
import AuthScreen from './features/auth/AuthScreen'
import Dashboard from './features/dashboard/Dashboard'
import WelcomeScreen from './features/auth/WelcomeScreen'
import ReloadPrompt from './components/ReloadPrompt'
import { GameProvider } from './context/GameContext'
import AppShell from './components/layout/AppShell'
import RequireCareer from './components/RequireCareer'
import { useSeo } from './seo/useSeo'
import { PRIVATE_SEO } from './seo/homeSeo'

// Cada pantalla se descarga al entrar a ella (antes se bajaban todas juntas al abrir el juego). Quedan fijas las del primer paso:
// acceso, bienvenida, inicio y el menú. Con la app instalada las descargas salen del caché del service worker.
const CreateManagerWizard = lazy(() => import('./features/manager/CreateManagerWizard'))
const CreateClubWizard = lazy(() => import('./features/club/CreateClubWizard'))
const CalendarScreen = lazy(() => import('./features/calendar/CalendarScreen'))
const TacticsScreen = lazy(() => import('./features/tactics/TacticsScreen'))
const MatchScreen = lazy(() => import('./features/match/MatchScreen'))
const PostMatchScreen = lazy(() => import('./features/match/PostMatchScreen'))
const StandingsScreen = lazy(() => import('./features/competition/StandingsScreen'))
const MarketScreen = lazy(() => import('./features/market/MarketScreen'))
const SquadScreen = lazy(() => import('./features/squad/SquadScreen'))
const ClubScreen = lazy(() => import('./features/club/screens/ClubScreen'))
const FinancesScreen = lazy(() => import('./features/finances/FinancesScreen'))
const TrainingScreen = lazy(() => import('./features/training/TrainingScreen'))
const ManagerCareerScreen = lazy(() => import('./features/manager/ManagerCareerScreen'))
const NationalTeamScreen = lazy(() => import('./features/manager/NationalTeamScreen'))
const InternationalCupScreen = lazy(() => import('./features/competition/InternationalCupScreen'))
const HallOfFameScreen = lazy(() => import('./features/manager/HallOfFameScreen'))
const AchievementsScreen = lazy(() => import('./features/career/AchievementsScreen'))
const EndgameScreen = lazy(() => import('./features/career/EndgameScreen'))
const LogbookScreen = lazy(() => import('./features/dashboard/LogbookScreen'))
const MoreScreen = lazy(() => import('./features/more/MoreScreen'))
const DesignSystemScreen = lazy(() => import('./features/design/DesignSystemScreen'))

/** Mientras baja una pantalla: un aviso liviano en el mismo lugar */
function ScreenLoading() {
  return (
    <div role="status" aria-label="Cargando la pantalla" className="grid min-h-[50dvh] place-items-center text-accent">
      <Loader2 className="size-7 animate-spin" aria-hidden="true" />
    </div>
  )
}

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
          <Suspense fallback={<ScreenLoading />}>
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
          </Suspense>
          <Toaster theme="dark" position="top-center" />
          <ReloadPrompt />
        </GameProvider>
      </div>
    </QueryClientProvider>
  )
}

export default GameApp
