import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../api/auth'
import { managerApi } from '../api/manager'
import { clubApi } from '../api/club'
import { queryCache } from '../utils/cache'
import ActionSheet from '../components/ActionSheet'

const GameContext = createContext(null)

export const useGameContext = () => useContext(GameContext)

let inFlightContextPromise = null

export const GameProvider = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [gameState, setGameState] = useState({ user: null, manager: null, club: null, loading: true })

  // ActionSheet Bottom Drawer confirmation state
  const [sheetConfig, setSheetConfig] = useState(null)
  const resolverRef = useRef(null)

  const loadData = async (force = false) => {
    if (!force && inFlightContextPromise) {
      return inFlightContextPromise
    }

    inFlightContextPromise = (async () => {
      try {
        const user = await authApi.getSession()
        if (!user) {
          if (location.pathname !== '/auth' && location.pathname !== '/welcome') navigate('/auth')
          setGameState(prev => ({ ...prev, loading: false }))
          return
        }

        // Si ya tenemos el manager y club cargados y no se fuerza recarga, reutilizar
        if (!force && gameState.manager && gameState.club && gameState.user?.id === user.id) {
          setGameState(prev => ({ ...prev, loading: false }))
          return
        }

        if (force) {
          queryCache.invalidate('manager:')
          queryCache.invalidate('club:')
        }

        const manager = await queryCache.fetch(
          `manager:${user.id}`,
          () => managerApi.getManager(user.id),
          120000
        )

        if (!manager) {
          if (location.pathname !== '/create-manager') navigate('/create-manager')
          setGameState(prev => ({ ...prev, loading: false }))
          return
        }

        const club = await queryCache.fetch(
          `club:${manager.id}`,
          () => clubApi.getClubByManager(manager.id),
          120000
        )

        if (!club) {
          if (manager.employment_status === 'UNEMPLOYED') {
            if (location.pathname !== '/manager') navigate('/manager')
            setGameState({ user, manager, club: null, loading: false })
            return
          }
          if (location.pathname !== '/create-club') navigate('/create-club')
          setGameState(prev => ({ ...prev, loading: false }))
          return
        }

        setGameState({ user, manager, club, loading: false })
      } catch (e) {
        console.error('Error loading game context:', e)
        setGameState(prev => ({ ...prev, loading: false }))
      } finally {
        inFlightContextPromise = null
      }
    })()

    return inFlightContextPromise
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
    queryCache.invalidate('manager:')
    queryCache.invalidate('club:')
    await loadData(true)
  }

  /**
   * Dispara una confirmación nativa tipo Bottom Sheet (ActionSheet)
   * Retorna una Promise que resuelve a true (Confirmado) o false (Cancelado)
   */
  const confirmAction = (config) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setSheetConfig(config)
    })
  }

  const handleSheetConfirm = () => {
    if (resolverRef.current) resolverRef.current(true)
    setSheetConfig(null)
    resolverRef.current = null
  }

  const handleSheetCancel = () => {
    if (resolverRef.current) resolverRef.current(false)
    setSheetConfig(null)
    resolverRef.current = null
  }

  return (
    <GameContext.Provider value={{ ...gameState, refreshContext, confirmAction }}>
      {children}
      <ActionSheet
        isOpen={!!sheetConfig}
        config={sheetConfig}
        onConfirm={handleSheetConfirm}
        onCancel={handleSheetCancel}
      />
    </GameContext.Provider>
  )
}
