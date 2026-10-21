import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useGameContext } from '../../context/GameContext'
import { supabase } from '../../api/supabase'
import { track } from '../../lib/analytics'
import { EVENT_START_TOUR, shouldAutoStart, markTourDone } from './tourState'

// react-joyride y los pasos pesan ~50 KB y casi nadie los usa: se cargan recién cuando arranca el tutorial
const TourRunner = lazy(() => import('./TourRunner'))

/** Tutorial de bienvenida: arranca solo la primera vez que una cuenta nueva entra, y se puede repetir desde "Más" */
export default function GameTour() {
  const { user } = useGameContext()
  const { pathname } = useLocation()
  const [run, setRun] = useState(false)
  const [round, setRound] = useState(0)
  const [auto, setAuto] = useState(false)

  useEffect(() => {
    if (!run && !auto && shouldAutoStart(user, pathname)) {
      setAuto(true)
      setRun(true)
      track('tutorial_start', { origin: 'auto' })
    }
  }, [user, pathname, run, auto])

  useEffect(() => {
    const start = () => { setRound(r => r + 1); setRun(true); track('tutorial_start', { origin: 'manual' }) }
    window.addEventListener(EVENT_START_TOUR, start)
    return () => window.removeEventListener(EVENT_START_TOUR, start)
  }, [])

  const onEnd = useCallback((status) => {
    setRun(false)
    track('tutorial_end', { finished: status === 'finished' })
    markTourDone(user, (payload) => supabase.auth.updateUser(payload))
  }, [user])

  if (!run) return null
  return <Suspense fallback={null}><TourRunner key={round} onEnd={onEnd} /></Suspense>
}
