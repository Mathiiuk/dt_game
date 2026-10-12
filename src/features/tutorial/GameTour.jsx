import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Joyride, EVENTS } from 'react-joyride'
import { useGameContext } from '../../context/GameContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { supabase } from '../../api/supabase'
import { track } from '../../lib/analytics'
import { TOUR_STEPS } from './tourSteps'
import { buildJoyrideSteps, TOUR_LOCALE } from './tour'
import { EVENT_START_TOUR, shouldAutoStart, markTourDone } from './tourState'

const TOUR_OPTIONS = {
  buttons: ['back', 'skip', 'primary'],
  showProgress: true,
  overlayClickAction: false,
  zIndex: 10000,
  primaryColor: 'var(--color-primary)',
  backgroundColor: 'var(--color-surface)',
  textColor: 'var(--color-fg)',
  arrowColor: 'var(--color-surface)',
  overlayColor: 'rgba(0, 0, 0, 0.65)'
}

/** Tutorial de bienvenida: arranca solo la primera vez que una cuenta nueva entra, y se puede repetir desde "Más" */
export default function GameTour() {
  const { user } = useGameContext()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
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

  const steps = useMemo(
    () => buildJoyrideSteps(TOUR_STEPS, { isDesktop, navigate, getPathname: () => window.location.pathname }),
    [isDesktop, navigate]
  )

  const onEvent = useCallback((data) => {
    if (data.type !== EVENTS.TOUR_END) return
    setRun(false)
    track('tutorial_end', { finished: data.status === 'finished' })
    markTourDone(user, (payload) => supabase.auth.updateUser(payload))
  }, [user])

  if (!run) return null
  return <Joyride key={round} run steps={steps} continuous locale={TOUR_LOCALE} options={TOUR_OPTIONS} onEvent={onEvent} />
}
