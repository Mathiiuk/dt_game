import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../api/auth'
import { managerApi } from '../api/manager'
import { clubApi } from '../api/club'

const GameContext = createContext(null)

export const useGameContext = () => useContext(GameContext)

export const GameProvider = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [gameState, setGameState] = useState({ user: null, manager: null, club: null, loading: true })

  const loadData = async () => {
    try {
      const user = await authApi.getSession()
      if (!user) {
        if (location.pathname !== '/auth' && location.pathname !== '/welcome') navigate('/auth')
        setGameState(prev => ({ ...prev, loading: false }))
        return
      }

      const manager = await managerApi.getManager(user.id)
      if (!manager) {
        if (location.pathname !== '/create-manager') navigate('/create-manager')
        setGameState(prev => ({ ...prev, loading: false }))
        return
      }

      const club = await clubApi.getClubByManager(manager.id)
      if (!club) {
        if (location.pathname !== '/create-club') navigate('/create-club')
        setGameState(prev => ({ ...prev, loading: false }))
        return
      }

      setGameState({ user, manager, club, loading: false })
    } catch (e) {
      console.error('Error loading game context:', e)
      setGameState(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    // Only load if we are on a game route
    const publicRoutes = ['/auth', '/welcome', '/create-manager', '/create-club']
    if (!publicRoutes.includes(location.pathname)) {
      if (!gameState.user) {
        setGameState(prev => ({ ...prev, loading: true }))
        loadData()
      }
    } else {
      setGameState(prev => ({ ...prev, loading: false }))
    }
  }, [location.pathname])

  const refreshContext = async () => {
    await loadData()
  }

  return (
    <GameContext.Provider value={{ ...gameState, refreshContext }}>
      {children}
    </GameContext.Provider>
  )
}
