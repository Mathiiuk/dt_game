import React from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useGameContext } from '../context/GameContext'

/**
 * Guard de rutas de juego: exige un DT activo.
 * - Sin sesión → /auth.
 * - Sin DT activo pero con un DT retirado → /endgame (epílogo obligatorio antes de fundar la sucesión).
 * - Sin ningún DT → /create-manager.
 */
export default function RequireCareer({ children }) {
  const { user, manager, retiredManager, loading } = useGameContext()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-accent">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  if (!manager) return <Navigate to={retiredManager ? '/endgame' : '/create-manager'} replace />

  return children
}
