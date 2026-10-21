import React, { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Joyride, EVENTS } from 'react-joyride'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { TOUR_STEPS } from './tourSteps'
import { buildJoyrideSteps, TOUR_LOCALE } from './tour'

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

/** El recorrido en sí (react-joyride y los pasos). Va en su propio trozo: se baja solo cuando el tutorial arranca */
export default function TourRunner({ onEnd }) {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const steps = useMemo(
    () => buildJoyrideSteps(TOUR_STEPS, { isDesktop, navigate, getPathname: () => window.location.pathname }),
    [isDesktop, navigate]
  )

  const onEvent = useCallback((data) => {
    if (data.type === EVENTS.TOUR_END) onEnd(data.status)
  }, [onEnd])

  return <Joyride run steps={steps} continuous locale={TOUR_LOCALE} options={TOUR_OPTIONS} onEvent={onEvent} />
}
